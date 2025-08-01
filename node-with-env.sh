#!/bin/bash

# node-with-env.sh - A wrapper script that loads .env file if it exists, then runs node

# Check if .env file exists in the current directory
if [ -f ".env" ]; then
    # Load .env file and run node with --env-file flag
    exec node --env-file .env "$@"
else
    # No .env file found, run node normally
    exec node "$@"
fi
