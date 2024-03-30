"""
Download_semantic_model.py file for Semantic-functions. This file contains the code to download the semantic model.

Author: Benjamin Klieger
Version: 0.1.0-beta
Date: 2023-12-28
License: MIT
"""

# ------------- [Import Libraries] -------------

# Required for environment variables
import os

# Required for embedding functionality
from sentence_transformers import SentenceTransformer, util
import pickle

# ------------- [Download Model] -------------

# Path to store model
model_path = 'semantic_model'

# Check if model is downloaded, if not, download and save
if not os.path.exists(model_path):
    model = SentenceTransformer('SeyedAli/Multilingual-Text-Semantic-Search-Siamese-BERT-V1')
    model.save(model_path)
