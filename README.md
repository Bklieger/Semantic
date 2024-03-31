# SemanticPDF: Drag, Drop, Semantic Search

![License](https://img.shields.io/badge/license-MIT-green)

SemanticPDF is a simple, privacy-focused application that makes it easy to upload a PDF file and perform a semantic search on contents. With a minimalist drag-and-drop interface, SemanticPDF makes it effortless to search through a file intelligently when an exact keyword search is lacking. For instance, you can search through a book for "the author's opinion on the future of artificial intelligence" or locate sections of an economics research paper that speak to "the long term impact" of the studied topic. 

[SemanticPDF Video](https://github.com/Bklieger/Semantic/assets/62450410/ab3616c5-beeb-429b-9044-8bd0835f83d3)
> The design and frontend code for SemanticPDF was inspired by Liftoff ([Github](https://github.com/Tameyer41/liftoff), MIT License) by Tyler Meyer.

SemanticPDF's design philosophy focuses on privacy by not storing any of the files or embeddings in a database, using the browser's local storage and an open source embeddings model instead of sharing or storing data with a third-party API. The files do leave the browser for file conversion and embedding by the FastAPI backend, but they are not persistently stored anywhere except the browser.


## Features

- 🔒 Privacy-focused: All files, text, and embeddings are stored locally in your browser, keeping your data private by processing the data with the FastAPI backend but not storing the files or embeddings in any database.
- 💰 Zero API costs: SemanticPDF utilizes open-source models and libraries for file-to-text conversion, embedding, and semantic search, eliminating the need for any third-party APIs.
- 📂 Simple User Interface: Seamlessly upload your PDF file with an intuitive drag-and-drop interface and navigate the pages of the file.
- 🔍 Semantic search: Quickly find relevant information within your PDF files using semantic search capabilities.

### Architecture

- Next.js Frontend
- FastAPI Backend

### Installation

First, set the environment variables in both the frontend and backend folders. Example.env provides an outline for both.

**In frontend/.env:**

Set an API token for securing communication between the frontend and backend. Since the dockerized version of the application only exposes the frontend port, this is a redundant security measure from when the backend was publicly accessible over the internet.

API_AUTH_TOKEN = Run ```openssl rand -base64 21 | tr '+/' '-_' | cut -c1-21``` in command line

**In backend/.env:**

Here you can set hourly and daily rate limits for usage of the application. The only database utilized in this project is in the backend, storing only the timestamps of usage without any of the content. SEM_API_KEY should be the same as API_AUTH_TOKEN. SEMFUN_HOURLY_RATE_LIMIT and SEMFUN_DAILY_RATE_LIMIT are optional, and can be turned off through settings.py in the backend. More information can be found in the backend's README.md file.

SEMFUN_API_KEY = API_AUTH_TOKEN

SEMFUN_HOURLY_RATE_LIMIT = ```number of API calls allowed per 60 consecutive minutes```

SEMFUN_DAILY_RATE_LIMIT = ```number of API calls allower per 24 consecutive hours```

Uploading and searching a PDF may take several hundred API calls depending on the size of the PDF. You can adjust and tinker with the limits accordingly.

---

### Running the app with Docker

The application is dockerized and can be run simply with docker-compose. 

~~~
docker-compose up
~~~
with ```-d``` as a flag to run detached.

The application is now running on port 3000, and can be accessed on localhost:3000.

---

### Running the app without Docker

To run the backend, please see the README.md file in ./backend/README.md.

To run the frontend, follow these steps:

~~~
cd frontend
~~~

~~~
npm install
~~~

In your .env file, set API_BASE_URL="http://127.0.0.1:8000". This is not needed when running with docker-compose, as docker-compose.yml sets this variable to "http://backend:8000".

~~~
npm run dev
~~~

The frontend is now running, and accessible at localhost:3000! To run for production, build and serve the next app. For production, running with docker-compose is recommended.

### Roadmap
Bugs/Minor Features:
- Add feature for FE to serve specific error message for backend 429 error (rate limit reached, too many requests), rather than showing general error message

Major Features:
- Ability to search through multiple PDF files
- Ability to upload Docx and Txt files

### Contributions

If you would like to contribute to this project, you can fork the repository to make the changes with descriptive commits, then open a pull request.
