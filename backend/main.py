"""
Main.py file for Semantic-functions. This file contains the main code for the API.

Author: Benjamin Klieger
Version: 0.1.0-beta
Date: 2023-12-28
License: MIT
"""

# ------------- [Import Libraries] -------------

# Required libraries from FastAPI for API functionality
from fastapi import FastAPI, HTTPException, Depends, Security, File, UploadFile
from fastapi.security.api_key import APIKeyHeader, APIKey
from fastapi.security import HTTPBearer
from fastapi.responses import JSONResponse

# Required libraries from Pydantic for API functionality
from pydantic import BaseModel
from typing import List

# Required for environment variables
import os

# Required for inspecting code
import inspect

# Required for NLTK functionality to split sentences
import nltk
from nltk.tokenize import sent_tokenize

# Required for embedding functionality
from sentence_transformers import SentenceTransformer, util
import pickle

# Required for PDF text extraction
import fitz
import io

# Required for rate limiting with database and timestamps
import sqlite3
import time

# Required for printing styled log messages 
from utils import *

# Required for docx text extraction
from docx import Document
import io

# For usage data
from datetime import datetime
from collections import defaultdict


# ------------- [Settings] -------------

# Import settings from settings.py
from settings import *

# Check if settings are properly imported and set, raise exception if not
if USE_HOURLY_RATE_LIMIT==None or USE_DAILY_RATE_LIMIT==None or INSECURE_DEBUG==None:
    raise Exception("One or more of the settings are not set or have been removed. They are required for operation of Semantic-functions, unless the code has been modified.")


# ------------- [Initialization: App] -------------

# Create FastAPI app
app = FastAPI(
    title="Semantic-functions",
    description="Dockerized lightweight FastAPI service for semantic-related functions, including sentence splitting and embedding.",
    version="v0.1.0-beta",
)

# Path to store model
model_path = 'semantic_model'
model = SentenceTransformer(model_path)

# CORS allow
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------- [Initialization: Env] -------------

# Set OpenAI API key securely from environment variable
semfun_api_key = os.getenv("SEMFUN_API_KEY")

if USE_HOURLY_RATE_LIMIT:
    hourly_rate_limit = (os.getenv("SEMFUN_HOURLY_RATE_LIMIT"))
if USE_DAILY_RATE_LIMIT:
    daily_rate_limit = (os.getenv("SEMFUN_DAILY_RATE_LIMIT"))

# Initialization check
initialization_transcript = ""
critical_exist = False

# Check if the key is set
if semfun_api_key is None:
    initialization_transcript += red_critical(f'[Critical] SEMFUN_API_KEY environment variable is not set. (Line {inspect.currentframe().f_lineno} in {os.path.basename(__file__)})\n')
    critical_exist = True

# If the key is set, check if it is strong
elif len(semfun_api_key) <5:
    initialization_transcript+= yellow_warning(f'[Warning] SEMFUN_API_KEY environment variable is too short to be secure. (Line {inspect.currentframe().f_lineno} in {os.path.basename(__file__)})\n')

# Check if the rate limit(s) are set correctly
if USE_HOURLY_RATE_LIMIT:
    if hourly_rate_limit == None:
        initialization_transcript += red_critical(f'[Critical] SEMFUN_HOURLY_RATE_LIMIT environment variable is not set. Please change the settings on line 16 of main.py if you do not wish to use an hourly rate limit. (Line {inspect.currentframe().f_lineno} in {os.path.basename(__file__)})\n')
        critical_exist = True        
    elif hourly_rate_limit.isdigit() == False: # Will return False for floating point numbers
        initialization_transcript += red_critical(f'[Critical] SEMFUN_HOURLY_RATE_LIMIT environment variable is not a valid integer. (Line {inspect.currentframe().f_lineno} in {os.path.basename(__file__)})\n')
        critical_exist = True
    else:
        hourly_rate_limit = int(hourly_rate_limit)
        
if USE_DAILY_RATE_LIMIT:
    if daily_rate_limit == None:
        initialization_transcript += red_critical(f'[Critical] SEMFUN_DAILY_RATE_LIMIT environment variable is not set. Please change the settings on line 16 of main.py if you do not wish to use an daily rate limit. (Line {inspect.currentframe().f_lineno} in {os.path.basename(__file__)})\n')
        critical_exist = True
    elif daily_rate_limit.isdigit() == False: # Will return False for floating point numbers
        initialization_transcript += red_critical(f'[Critical] SEMFUN_DAILY_RATE_LIMIT environment variable is not a valid integer. (Line {inspect.currentframe().f_lineno} in {os.path.basename(__file__)})\n')
        critical_exist = True
    else:
        daily_rate_limit = int(daily_rate_limit)

# Print results of initialization check
print("Initialization check:")
print(initialization_transcript)    
if critical_exist:
    print(red_critical("Critical errors found in initialization check. Please fix them before deploying. If you are building the Docker image and have not yet set the environment variables, you may ignore this message."))
else:
    print(green_success("No critical errors found in initialization check."))


# ------------- [Initialization: DB] -------------

# Check if database is needed for rate limiting
if USE_HOURLY_RATE_LIMIT or USE_DAILY_RATE_LIMIT:
    # Use SQLITE database to store API usage
    # Create a table for API usage if it does not exist
    conn = sqlite3.connect('semfun.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS api_usage
                    (api_timestamp integer)''')
    conn.commit()
    conn.close()


# ------------- [Helper Functions] -------------

# Make function for adding API usage
def log_api_usage() -> None:
    """
    This function logs an instance of API usage to the SQLite database.
    It only logs the instance if the rate limit is enabled.
    """
    if USE_HOURLY_RATE_LIMIT or USE_DAILY_RATE_LIMIT:
        with sqlite3.connect('semfun.db') as conn:
            c = conn.cursor()
            c.execute("INSERT INTO api_usage VALUES (?)", (int(time.time()),))
            conn.commit()

# Make function for getting API usage (hourly)
def get_api_usage_from_last_hour() -> int:
    """
    This function returns the number of API calls in the last hour.
    """
    with sqlite3.connect('semfun.db') as conn:
        c = conn.cursor()
        c.execute("SELECT COUNT(*) FROM api_usage WHERE api_timestamp > ?", (int(time.time())-3600,))
        return c.fetchone()[0]

# Make function for getting API usage (daily)
def get_api_usage_from_last_day() -> int:
    """
    This function returns the number of API calls in the last day.
    """
    with sqlite3.connect('semfun.db') as conn:
        c = conn.cursor()
        c.execute("SELECT COUNT(*) FROM api_usage WHERE api_timestamp > ?", (int(time.time())-86400,))
        return c.fetchone()[0]

# Make function for checking rate limit
def check_rate_limit() -> bool:
    """
    This function checks if the rate limit has been reached.

    Note that both hourly and daily rate limits can simultaneously be 
    in effect.

    Returns:
        bool: True if rate limit has not been reached, False otherwise.
    """
    if USE_HOURLY_RATE_LIMIT and get_api_usage_from_last_hour() >= hourly_rate_limit:
        return False
    if USE_DAILY_RATE_LIMIT and get_api_usage_from_last_day() >= daily_rate_limit:
        return False
    else:
        return True

# Filter the non-semantic sentences from a list of sentences
def filter_non_semantic_sentences(sentences: List[str]) -> List[str]:
    """
    This function filters the non-semantic sentences from a list of sentences. This is 
    determined if any of the following conditions are met:

    - The sentence is less than 5 characters long.
    - The sentence is primarily numbers.
    - The sentence is less than 3 words long.


    Args:
        sentences (list): The sentences to filter.
    
    Returns:
        list: A list containing the semantic sentences.
    """

    for sentence in sentences:
        if len(sentence) < 5:
            sentences.remove(sentence)
        elif sum(c.isdigit() for c in sentence) > (len(sentence) / 2):
            # Remove sentences that are primarily numbers
            sentences.remove(sentence)
        elif len(sentence.split()) < 3:
            # Remove sentences that are less than 3 words
            sentences.remove(sentence)
    
    return sentences

# Filter newline characters and similar from text, replace with spaces
def replace_newlines(text: str) -> str:
    """
    This function replaces newline characters and similar from text, replacing them with spaces.

    Args:
        text (str): The text to replace newline characters from.
    
    Returns:
        str: The text with newline characters replaced.
    """

    return text.replace('\n', ' ').replace('\\n', ' ').replace('\r\n', ' ')

# Text file to string
def txt_to_string(file_in_memory):
    """
    Args:
        file_in_memory (UploadFile): The txt file to extract text from in bytes format.
    """

    file_in_memory = io.BytesIO(file_in_memory)
    return file_in_memory.getvalue().decode('utf-8')

# Docx file to string
def docx_to_string(file: io.BytesIO):
    """
    Args:
        file (UploadFile): The docx file to extract text from in bytes format.
    """

    file = io.BytesIO(file)
    doc = Document(file)
    return '\n'.join([para.text for para in doc.paragraphs])


# ------------- [Classes and Other] -------------

# Define a security scheme for API key
bearer_scheme = HTTPBearer()

# Define validation function for API key
def valid_api_key(api_key_header: APIKey = Depends(bearer_scheme)):
    # Check if API key is valid
    if api_key_header.credentials != semfun_api_key:
        raise HTTPException(
            status_code=400, detail="Invalid API key"
        )
    return api_key_header.credentials

# Define validation function for API key with rate limit
def valid_api_key_rate_limit(api_key_header: APIKey = Depends(bearer_scheme)):
    # Check if rate limit has been reached
    if check_rate_limit() == False:
        raise HTTPException(status_code=429, detail="Rate limit reached. Try again later. See /ratelimit to view status and settings.")

    # Check if API key is valid
    if api_key_header.credentials != semfun_api_key:
        raise HTTPException(
            status_code=400, detail="Invalid API key"
        )
    return api_key_header.credentials


# ------------- [Routes and Endpoints] -------------

@app.post('/api/v1/text-split')
async def text_split(text: str, api_key: str = Depends(valid_api_key_rate_limit)):
    """
    This endpoint splits the body of text into a list of sentences.

    Args:
        text (str): The text to split.

    Returns:
        list: A list containing the sentences.
    """

    try:
        # Log API usage. Note, you could move this to the end of the endpoint and check the response content if you want to log only successful requests.
        log_api_usage()

        sentences = sent_tokenize(replace_newlines(text))

        return JSONResponse(status_code=200, content={"sentences": sentences})
    except Exception as e:
        if INSECURE_DEBUG:
            return JSONResponse(status_code=500, content={"error": str(e)})
        else:
            print(e)
            return JSONResponse(status_code=500, content={"error": "Internal server error. Set INSECURE_DEBUG to True to view error details from client side."})

@app.post('/api/v1/text-embed')
async def text_embed(sentences: List[str], api_key: str = Depends(valid_api_key_rate_limit)):
    """
    This endpoint embeds the body of text into a list of vectors.

    Args:
        sentences (list): The sentences to embed.

    Returns:
        list: A list containing the vectors.
    """

    try:
        # Log API usage. Note, you could move this to the end of the endpoint and check the response content if you want to log only successful requests.
        log_api_usage()

        sentence_embeddings = model.encode(sentences)

        return JSONResponse(status_code=200, content={"vectors": sentence_embeddings.tolist()})
    except Exception as e:
        if INSECURE_DEBUG:
            return JSONResponse(status_code=500, content={"error": str(e)})
        else:
            print(e)
            return JSONResponse(status_code=500, content={"error": "Internal server error. Set INSECURE_DEBUG to True to view error details from client side."})

@app.post('/api/v1/text-split-and-embed')
async def text_split_and_embed(text: str, filter: bool, api_key: str = Depends(valid_api_key_rate_limit)):
    """
    This endpoint splits the body of text into a list of sentences and embeds them into a list of vectors.

    Args:
        text (str): The text to split and embed.
        filter (bool): Whether to filter the non-semantic sentences from the list of sentences.

    Returns:
        list: A list containing the sentences and vectors.
    """

    try:
        # Log API usage. Note, you could move this to the end of the endpoint and check the response content if you want to log only successful requests.
        log_api_usage()

        sentences = sent_tokenize(replace_newlines(text))

        if filter:
            sentences = filter_non_semantic_sentences(sentences)

            # Var 1:
            # Now combine every n sentences into 1 sentence
            # n=2
            # sentences = [' '.join(sentences[i:i+n]) for i in range(0, len(sentences), n)]

            # Var 2:
            # If a sentence is less than n chars, combine with the next one
            n=75
            # sentences = [sentences[i] + ' ' + sentences[i+1] if len(sentences[i]) < n else sentences[i] for i in range(0, len(sentences), 2)]
            sentences = [sentences[i] + ' ' + sentences[i+1] if i+1 < len(sentences) and len(sentences[i]) < n else sentences[i] for i in range(0, len(sentences), 2)]

            # Var 3:
            # Do nothing.

        sentence_embeddings = model.encode(sentences)

        return JSONResponse(status_code=200, content={"sentences": sentences, "vectors": sentence_embeddings.tolist()})
    except Exception as e:
        if INSECURE_DEBUG:
            return JSONResponse(status_code=500, content={"error": str(e)})
        else:
            print(e)
            return JSONResponse(status_code=500, content={"error": "Internal server error. Set INSECURE_DEBUG to True to view error details from client side."})

@app.post("/api/v1/pdf-to-text/")
async def pdf_to_text(file: UploadFile = File(...), api_key: str = Depends(valid_api_key_rate_limit)):
    """
    This endpoint extracts text from a PDF file.

    Args:
        file (UploadFile): The PDF file to extract text from.
    
    Returns:
        dict: A dictionary containing the filename and the extracted text in seperated pages.
    """

    try:
        # Preliminary check for MIME type
        if file.content_type != "application/pdf":
            return JSONResponse(status_code=400, content={"error": "Invalid file type. Please upload a PDF file."})

        # Read the uploaded file into memory
        contents = await file.read()

        # Log API usage. Note, you could move this to the end of the endpoint and check the response content if you want to log only successful requests.
        log_api_usage()

        # Attempt to open and process the PDF from memory
        try:
            pdf_stream = io.BytesIO(contents)
            doc = fitz.open(stream=pdf_stream, filetype="pdf")
        except Exception as e:
            # Handle invalid PDF file
            return JSONResponse(status_code=400, content={"error": "Invalid PDF file."})

        # Dictionary to hold text for each page
        pages_text = {}

        for page_num in range(len(doc)):  # Iterate through each page
            page = doc.load_page(page_num)  # Load the page
            text = page.get_text()  # Extract text from the page
            pages_text[page_num + 1] = text  # Key is page number, value is text

        # Close the document
        doc.close()

        # Return the structured text as a dictionary
        return JSONResponse(status_code=200, content={"filename": file.filename, "text": pages_text})
    except Exception as e:
        if INSECURE_DEBUG:
            return JSONResponse(status_code=500, content={"error": str(e)})
        else:
            print(e)
            return JSONResponse(status_code=500, content={"error": "Internal server error. Set INSECURE_DEBUG to True to view error details from client side."})


@app.post("/api/v1/txt-to-text/")
async def txt_to_text(file: UploadFile = File(...), api_key: str = Depends(valid_api_key_rate_limit)):
    """
    This endpoint extracts text from a txt file.

    Args:
        file (UploadFile): The txt file to extract text from.
    
    Returns:
        dict: A dictionary containing the filename and the extracted text.
    """

    try:
        # Preliminary check for MIME type
        if file.content_type != "text/plain":
            return JSONResponse(status_code=400, content={"error": "Invalid file type. Please upload a text file (.txt)."})

        # Read the uploaded file into memory
        contents = await file.read()

        # Log API usage. Note, you could move this to the end of the endpoint and check the response content if you want to log only successful requests.
        log_api_usage()

        # Attempt to open and process the text from memory
        try:
            results = txt_to_string(contents)
        except Exception as e:
            # Handle invalid PDF file
            return JSONResponse(status_code=400, content={"error": "Invalid text file."})


        # Return the structured text as a dictionary
        return JSONResponse(status_code=200, content={"filename": file.filename, "text": results})
    except Exception as e:
        if INSECURE_DEBUG:
            return JSONResponse(status_code=500, content={"error": str(e)})
        else:
            print(e)
            return JSONResponse(status_code=500, content={"error": "Internal server error. Set INSECURE_DEBUG to True to view error details from client side."})


@app.post("/api/v1/docx-to-text/")
async def docx_to_text(file: UploadFile = File(...), api_key: str = Depends(valid_api_key_rate_limit)):
    """
    This endpoint extracts text from a .docx file.

    Args:
        file (UploadFile): The docx file to extract text from.
    
    Returns:
        dict: A dictionary containing the filename and the extracted text.
    """

    try:
        # Preliminary check for MIME type
        if file.content_type != "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            return JSONResponse(status_code=400, content={"error": "Invalid file type. Please upload a .docx file."})

        # Read the uploaded file into memory
        contents = await file.read()

        # Log API usage. Note, you could move this to the end of the endpoint and check the response content if you want to log only successful requests.
        log_api_usage()

        # Attempt to open and process the docx from memory
        try:
            doc = docx_to_string(contents)
        except Exception as e:
            # Handle invalid PDF file
            return JSONResponse(status_code=400, content={"error": "Invalid docx file."})

        # Return the structured text as a dictionary
        return JSONResponse(status_code=200, content={"filename": file.filename, "text": doc})
    except Exception as e:
        if INSECURE_DEBUG:
            return JSONResponse(status_code=500, content={"error": str(e)})
        else:
            print(e)
            return JSONResponse(status_code=500, content={"error": "Internal server error. Set INSECURE_DEBUG to True to view error details from client side."})




# Filter the non-semantic sentences from a list of sentences
@app.post('/api/v1/filter-non-semantic-sentences')
async def filter_non_semantic_sentences_route(sentences: List[str], api_key: str = Depends(valid_api_key_rate_limit)):
    """
    This endpoint filters the non-semantic sentences from a list of sentences. This is 
    determined if any of the following conditions are met:

    - The sentence is less than 5 characters long.
    - The sentence is primarily numbers.
    - The sentence is less than 3 words long.

    Args:
        sentences (list): The sentences to filter.
    
    Returns:
        list: A list containing the semantic sentences.
    """

    try :
        # Log API usage. Note, you could move this to the end of the endpoint and check the response content if you want to log only successful requests.
        log_api_usage()

        filtered_sentences = filter_non_semantic_sentences(sentences)

        # Return the filtered sentences
        return JSONResponse(status_code=200, content={"sentences": filtered_sentences})
    except Exception as e:
        if INSECURE_DEBUG:
            return JSONResponse(status_code=500, content={"error": str(e)})
        else:
            print(e)
            return JSONResponse(status_code=500, content={"error": "Internal server error. Set INSECURE_DEBUG to True to view error details from client side."})


# Perform semantic search on a list of sentences and vectors compared to a query
@app.post('/api/v1/semantic-search')
async def semantic_search(query: str, sentences: List[str], vectors: List[List[float]], api_key: str = Depends(valid_api_key_rate_limit)):
    """
    This endpoint performs semantic search on a list of sentences and vectors compared to a query.

    Args:
        query (str): The query to compare to.
        sentences (list): The sentences to compare.
        vectors (list): The corresponding vectors to compare.
    
    Returns:
        list: A list containing the sentences and scores.
    """

    try:
        query_emb = model.encode([query])

        scores = util.dot_score(query_emb, vectors)[0].cpu().tolist()
        #Combine docs & scores
        doc_score_pairs = list(zip(sentences, scores))

        #Sort by decreasing score
        doc_score_pairs = sorted(doc_score_pairs, key=lambda x: x[1], reverse=True)

        return JSONResponse(status_code=200, content={"results": doc_score_pairs})

    except Exception as e:
        if INSECURE_DEBUG:
            return JSONResponse(status_code=500, content={"error": str(e)})
        else:
            print(e)
            return JSONResponse(status_code=500, content={"error": "Internal server error. Set INSECURE_DEBUG to True to view error details from client side."})


# Define a route for the GET of /ratelimit
@app.get('/ratelimit')
async def get_ratelimit(api_key: str = Depends(valid_api_key)):
    """
    This endpoint allows you to view the current rate limit status and settings.
    """

    # Return rate limit status and settings if rate limits are enabled
    json_to_return = {}
    if USE_DAILY_RATE_LIMIT:
        json_to_return["daily_rate_limit"] = daily_rate_limit
        json_to_return["daily_api_usage"] = get_api_usage_from_last_day()
    if USE_HOURLY_RATE_LIMIT:
        json_to_return["hourly_rate_limit"] = hourly_rate_limit
        json_to_return["hourly_api_usage"] = get_api_usage_from_last_hour()
    if len(json_to_return) == 0:
        json_to_return = {"error": "Rate limit is not enabled."}

    return JSONResponse(status_code=200, content=json_to_return)


# Define a route for the GET of /usage-data
@app.post('/api/v1/usage-data')
async def get_usagedata(api_key: str = Depends(valid_api_key)):
    """
    This endpoint exports all available usage data.
    """

    # Return the usage data from the DB
    usage_data = {}

    # Query DB for all usage data
    with sqlite3.connect('semfun.db') as conn:
        c = conn.cursor()
        c.execute("SELECT * FROM api_usage")
        results = c.fetchall()

        # Add usage data to return JSON
        usage_data["usage_data"] = results

    timestamp_counts = defaultdict(int)

    # Find the minimum and maximum timestamps
    min_timestamp = min(timestamp_list[0] for timestamp_list in usage_data["usage_data"])
    max_timestamp = max(timestamp_list[0] for timestamp_list in usage_data["usage_data"])

    # Generate all timestamps between min and max with hourly intervals
    current_timestamp = min_timestamp
    while current_timestamp <= max_timestamp:
        dt = datetime.fromtimestamp(current_timestamp)
        formatted_date_hour = dt.strftime("%Y-%m-%d %H:00")
        timestamp_counts[formatted_date_hour] = 0
        current_timestamp += 3600  # Increment by one hour

    # Count the occurrences of each timestamp
    for timestamp_list in usage_data["usage_data"]:
        timestamp = timestamp_list[0]
        dt = datetime.fromtimestamp(timestamp)
        formatted_date_hour = dt.strftime("%Y-%m-%d %H:00")
        timestamp_counts[formatted_date_hour] += 1

    result = []
    for formatted_date_hour, count in timestamp_counts.items():
        result.append({
            "date_hour": formatted_date_hour,
            "count": count
        })

    result = {"usage_data": result}

    return JSONResponse(status_code=200, content=result)
