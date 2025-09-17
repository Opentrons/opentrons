#!/bin/bash

# Setup script for the cypress-mirror repository
# This script helps set up the dedicated Cypress binary repository

set -e

echo "🚀 Setting up cypress-mirror repository..."

# Create the repository structure
mkdir -p .github/workflows
mkdir -p scripts

echo "📁 Created directory structure"

# Copy the automation script
cp scripts/cypress-cache-automation.js ../cypress-mirror/scripts/
echo "📄 Copied automation script"

# Copy the workflow
cp .github/workflows/cypress-cache-automation.yaml ../cypress-mirror/.github/workflows/
echo "⚙️ Copied GitHub Actions workflow"

# Create a README for the cypress-mirror repo
cat > ../cypress-mirror/README.md << 'EOF'
# Cypress Mirror

This repository contains cached Cypress binaries for faster CI builds.

## Purpose

Instead of downloading Cypress binaries from the official source every time, this repository provides pre-cached versions that can be downloaded much faster.

## How it works

1. **Automated caching**: When a new Cypress version is detected, the automation script downloads the official binary and creates a GitHub release
2. **Fast downloads**: CI builds download from this repository instead of the official Cypress source
3. **Fallback**: If a version isn't cached here, builds fall back to the official source

## Usage

CI builds automatically check this repository first:
```
https://github.com/Opentrons/cypress-mirror/releases/download/cypress-{VERSION}/cypress-{VERSION}-{PLATFORM}-{ARCH}.zip
```

## Automation

The repository is automatically updated via GitHub Actions when new Cypress versions are detected in the main Opentrons repository.

## Manual Management

To manually cache a specific version:
1. Go to Actions tab
2. Run "Cypress Cache Automation" workflow
3. Specify the version or leave empty to use the current package.json version

## Supported Platforms

- Linux x64
- macOS x64  
- Windows x64
EOF

echo "📖 Created README"

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. cd ../cypress-mirror"
echo "2. git add ."
echo "3. git commit -m 'Initial setup for Cypress binary caching'"
echo "4. git push origin main"
echo ""
echo "The automation will then be available in the cypress-mirror repository!"
