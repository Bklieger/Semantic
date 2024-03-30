# Use the lightweight Python 3.8-slim base image
FROM python:3.8-slim

# Install system dependencies and clean up in a single RUN command
RUN apt-get update && \
    rm -rf /var/lib/apt/lists/* && \
    # Set up the Python virtual environment
    python -m venv /opt/venv && \
    chmod +x /opt/venv/bin/activate

ENV PATH="/opt/venv/bin:$PATH"

# Copy the requirements.txt file and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN python -m nltk.downloader punkt

# Copy the download_semantic_model.py file and run it
COPY download_semantic_model.py .
RUN python download_semantic_model.py

# Copy the application files
COPY . .

# Copy the entrypoint script
COPY entrypoint.sh .

# Give the execution permissions to the entrypoint script
RUN chmod +x ./entrypoint.sh

# Run the entrypoint script when the container starts
CMD ["./entrypoint.sh"]
