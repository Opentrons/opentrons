#!/usr/bin/env python3
"""
Update URLs in index.html based on deployment environment
"""

import argparse
import os
import re
from pathlib import Path


def update_urls(environment, branch=None):
    """Update URLs in index.html based on environment"""
    # Check for temporary staging/production directories first
    if environment == "staging" and Path("temp-staging").exists():
        index_path = Path("temp-staging/site/index.html")
    elif environment == "production" and Path("temp-production").exists():
        index_path = Path("temp-production/site/index.html")
    else:
        index_path = Path("site/index.html")
    
    if not index_path.exists():
        print(f"Error: {index_path} does not exist")
        return False
    
    # Read the current content
    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Define URL patterns to replace
    if environment == "sandbox":
        # For sandbox, use the branch-specific URL
        if branch:
            new_url = f"https://sandbox.docs.opentrons.com/{branch}/v2/"
        else:
            new_url = "https://sandbox.docs.opentrons.com/edge/v2/"
        
        # Replace the production URL with sandbox URL
        content = re.sub(
            r'https://docs\.opentrons\.com/v2/',
            new_url,
            content
        )
        print(f"Updated Python API URL to: {new_url}")
        
    elif environment == "staging":
        # For staging, use the staging URL
        staging_url = "https://staging.docs.opentrons.com/v2/"
        content = re.sub(
            r'https://docs\.opentrons\.com/v2/',
            staging_url,
            content
        )
        content = re.sub(
            r'https://sandbox\.docs\.opentrons\.com/[^/]+/v2/',
            staging_url,
            content
        )
        print(f"Updated Python API URL to: {staging_url}")
        
    else:  # production
        # For production, use relative URL since API docs are served from same domain
        relative_url = "/v2/"
        content = re.sub(
            r'https://docs\.opentrons\.com/v2/',
            relative_url,
            content
        )
        content = re.sub(
            r'https://sandbox\.docs\.opentrons\.com/[^/]+/v2/',
            relative_url,
            content
        )
        content = re.sub(
            r'https://staging\.docs\.opentrons\.com/v2/',
            relative_url,
            content
        )
        print(f"Updated Python API URL to: {relative_url}")
    
    # Write the updated content back
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return True


def main():
    parser = argparse.ArgumentParser(description="Update URLs in index.html")
    parser.add_argument(
        "environment",
        choices=["sandbox", "staging", "production"],
        help="Deployment environment"
    )
    parser.add_argument(
        "--branch",
        help="Branch name (for sandbox deployments)"
    )
    
    args = parser.parse_args()
    
    success = update_urls(args.environment, args.branch)
    if not success:
        exit(1)


if __name__ == "__main__":
    main()
