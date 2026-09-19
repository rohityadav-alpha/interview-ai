#!/bin/bash
# Build script for Vercel deployment
echo "Building Interview AI Django Project..."
python3 -m pip install -r requirements.txt
python3 manage.py collectstatic --noinput --clear
echo "Build complete!"
