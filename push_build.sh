#!/bin/bash

# Build the project
echo "Building the project..."
npm run build

# Check if build succeeded
if [ $? -eq 0 ]; then
  echo "Build successful!"
else
  echo "Build failed. Exiting."
  exit 1
fi

# Add changes
git add .

# Prompt for commit message
echo "Enter commit message:"
read commit_message

# Commit changes
git commit -m "$commit_message"

# Push changes
echo "Pushing to remote..."
git push

echo "Done!"
