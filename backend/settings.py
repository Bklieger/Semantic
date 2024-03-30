"""
Settings.py file for Semantic-functions. This file contains the settings for the API.

Author: Benjamin Klieger
Version: 0.1.0-beta
Date: 2023-12-28
License: MIT
"""

# ------------- [Settings] -------------

# Settings (Note: Both can be true and simultaneously active and enforced)
USE_HOURLY_RATE_LIMIT = True # Set to False to disable hourly rate limit
USE_DAILY_RATE_LIMIT = True # Set to False to disable daily rate limit

"""
Set INSECURE_DEBUG to False to disable debug mode. When debug mode is off,
server errors will no longer be passed through to the client, and instead 
present a generic error message to the API client, limiting the risk of 
exposing any secret variables stored on the server side to client.
"""
INSECURE_DEBUG = True

