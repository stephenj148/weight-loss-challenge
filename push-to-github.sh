#!/bin/bash

echo "🚀 GitHub Repository Setup Script"
echo "================================"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not initialized. Run 'git init' first."
    exit 1
fi

# Check if we have commits
if ! git log --oneline -1 > /dev/null 2>&1; then
    echo "❌ No commits found. Make sure you've committed your changes."
    exit 1
fi

echo "✅ Git repository is ready"
echo ""

# Get GitHub username
read -p "Enter your GitHub username: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ GitHub username is required"
    exit 1
fi

REPO_NAME="weight-loss-competition"
REPO_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

echo ""
echo "📋 Next steps:"
echo "1. Go to https://github.com/new"
echo "2. Create a new repository named: $REPO_NAME"
echo "3. Description: Family & Friends Weight Loss Competition App"
echo "4. Make it Public (recommended)"
echo "5. DO NOT initialize with README, .gitignore, or license"
echo "6. Click 'Create repository'"
echo ""
echo "After creating the repository, run these commands:"
echo ""
echo "git remote add origin $REPO_URL"
echo "git branch -M main"
echo "git push -u origin main"
echo ""

# Ask if they want to run the commands now
read -p "Have you created the repository on GitHub? (y/n): " CREATED

if [ "$CREATED" = "y" ] || [ "$CREATED" = "Y" ]; then
    echo ""
    echo "🔗 Adding remote origin..."
    git remote add origin $REPO_URL
    
    echo "📝 Renaming branch to main..."
    git branch -M main
    
    echo "🚀 Pushing to GitHub..."
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Successfully pushed to GitHub!"
        echo "🌐 Your repository is now available at: $REPO_URL"
    else
        echo ""
        echo "❌ Failed to push to GitHub. Please check your credentials and try again."
    fi
else
    echo ""
    echo "Please create the repository on GitHub first, then run this script again."
fi
