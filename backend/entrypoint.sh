#!/bin/sh

gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app -b 0.0.0.0:8000