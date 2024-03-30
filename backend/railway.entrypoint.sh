#!/bin/sh

gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --log-level debug --access-logfile - --error-logfile -