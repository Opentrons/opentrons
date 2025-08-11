#!/usr/bin/env python3
"""
Deploy Docs to S3
Replaces the deploy Makefile target with staging/production/sandbox support
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path

def run_command(cmd, check=True):
    """Run a shell command and return the result"""
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, check=check, capture_output=True, text=True)
    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)
    return result

def deploy_docs(environment, branch=None, aws_profile=None, source_dir="site"):
    """Deploy docs to S3"""
    # Environment-specific bucket configuration
    buckets = {
        "sandbox": "sandbox.docs",               # Your current sandbox bucket
        "staging": "opentrons.staging.docs",     # Replace with your staging bucket
        "production": "opentrons.production.docs" # Replace with your production bucket
    }
    if environment not in buckets:
        print(f"Error: Environment must be one of {list(buckets.keys())}")
        sys.exit(1)
    bucket = buckets[environment]
    
    # Default branch based on environment
    if branch is None:
        branch = "edge"
    
    # Check if we're in CI
    is_ci = os.getenv("CI") is not None
    if is_ci:
        print("Running in CI environment")
    elif aws_profile is None:
        print("Warning: AWS_PROFILE not set. Make sure you have AWS credentials configured.")
    
    # Verify source directory exists
    source_path = Path(source_dir)
    if not source_path.exists():
        print(f"Error: Source directory {source_path} does not exist.")
        print("Make sure you've run 'make build' first.")
        sys.exit(1)
    
    # Check if source directory has content
    source_files = list(source_path.glob("*"))
    if not source_files:
        print(f"Warning: Source directory {source_path} is empty.")
        print("Make sure you've run 'make build' first.")
    
    print(f"Source directory contents: {[f.name for f in source_files[:10]]}{'...' if len(source_files) > 10 else ''}")
    
    # Build S3 sync command - use branch for sandbox, root for staging/production
    if environment == "sandbox":
        s3_path = f"s3://{bucket}/{branch}/"
        url = f"http://sandbox.docs.s3-website.us-east-2.amazonaws.com/{branch}/"
    else:
        s3_path = f"s3://{bucket}/"
        if environment == "staging":
            url = f"https://staging.docs.opentrons.com/"
        else:  # production
            url = f"https://docs.opentrons.com/"
    
    cmd = [
        "aws", "s3", "sync",
        str(source_path) + "/",
        s3_path,
        "--delete",
        "--acl", "public-read",
        "--verbose"
    ]
    
    # Add AWS profile if specified
    if aws_profile:
        cmd.extend(["--profile", aws_profile])
    
    print(f"Deploying to {environment} environment:")
    print(f"  Bucket: {bucket}")
    if environment == "sandbox":
        print(f"  Branch: {branch}")
    print(f"  S3 Path: {s3_path}")
    
    # Check if bucket exists
    bucket_check_cmd = ["aws", "s3", "ls", f"s3://{bucket}/"]
    if aws_profile:
        bucket_check_cmd.extend(["--profile", aws_profile])
    
    print(f"Checking if bucket exists: {' '.join(bucket_check_cmd)}")
    try:
        bucket_result = subprocess.run(bucket_check_cmd, capture_output=True, text=True)
        if bucket_result.returncode != 0:
            print(f"❌ Bucket {bucket} does not exist or is not accessible")
            print(f"Error: {bucket_result.stderr}")
            sys.exit(1)
        else:
            print(f"✅ Bucket {bucket} exists and is accessible")
    except Exception as e:
        print(f"❌ Error checking bucket: {e}")
        sys.exit(1)
    
    try:
        run_command(cmd)
        print(f"✅ Successfully deployed to {environment}!")
        
        # Print the URL where it's deployed
        print(f"📍 Deployed to: {url}")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Deployment failed with exit code {e.returncode}")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Deploy Docs to S3")
    parser.add_argument(
        "environment",
        choices=["sandbox", "staging", "production"],
        help="Deployment environment"
    )
    parser.add_argument(
        "--branch",
        help="Branch name (defaults to 'edge')"
    )
    parser.add_argument(
        "--aws-profile",
        help="AWS profile to use (defaults to AWS_PROFILE env var)"
    )
    parser.add_argument(
        "--source-dir",
        default="site",
        help="Source directory to deploy (default: site)"
    )
    
    args = parser.parse_args()
    aws_profile = args.aws_profile or os.getenv("AWS_PROFILE")
    
    deploy_docs(
        environment=args.environment,
        branch=args.branch,
        aws_profile=aws_profile,
        source_dir=args.source_dir
    )

if __name__ == "__main__":
    main()