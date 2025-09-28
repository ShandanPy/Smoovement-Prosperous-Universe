#!/bin/bash

# Script to push the code to GitHub once repository is created and accessible

echo "Pushing Prosperous Universe MVP to GitHub..."

# Ensure we're in the right directory
cd /workspace/prosperous-universe-mvp

# Check current remotes
echo "Current remotes:"
git remote -v

# Push to main branch
echo "Pushing to origin/main..."
git push -u origin main

echo "Done! Your code should now be on GitHub."
echo "Vercel will automatically deploy from the main branch once connected."