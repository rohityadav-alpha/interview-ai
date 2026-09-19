#!/bin/bash
set -e

echo "===> Installing Python dependencies for Vercel..."
if command -v uv &> /dev/null; then
    uv pip install -r requirements.txt --system || python3 -m pip install -r requirements.txt --break-system-packages
else
    python3 -m pip install -r requirements.txt --break-system-packages
fi

echo "===> Ensuring staticfiles output directory exists..."
mkdir -p staticfiles

echo "===> Collecting static files..."
python3 manage.py collectstatic --noinput --clear

echo "===> Vercel Build Succeeded!"
