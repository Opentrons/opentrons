#!/usr/bin/env python3
"""
Deploy Flex Manual to S3
Replaces the deploy-flex-manual Makefile target with staging/production/sandbox support
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

def deploy_flex_manual(environment, branch=None, aws_profile=None, flex_manual_prefix="flex-manual"):
    """Deploy flex manual to S3"""
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
    source_dir = Path(flex_manual_prefix) / "site"
    if not source_dir.exists():
        print(f"Error: Source directory {source_dir} does not exist.")
        print("Make sure you've run 'make build-flex-manual' first.")
        sys.exit(1)
    # Build S3 sync command
    s3_path = f"s3://{bucket}/{branch}/{flex_manual_prefix}/"
    cmd = [
        "aws", "s3", "sync",
        str(source_dir) + "/",
        s3_path,
        "--delete",
        "--acl", "public-read"
    ]
    # Add AWS profile if specified
    if aws_profile:
        cmd.extend(["--profile", aws_profile])
    print(f"Deploying to {environment} environment:")
    print(f"  Bucket: {bucket}")
    print(f"  Branch: {branch}")
    print(f"  S3 Path: {s3_path}")
    try:
        run_command(cmd)
        print(f"✅ Successfully deployed to {environment}!")
        # Print the URL where it's deployed
        url = f"https://{bucket}/{branch}/{flex_manual_prefix}/"
        print(f"📍 Deployed to: {url}")
    except subprocess.CalledProcessError as e:
        print(f"❌ Deployment failed with exit code {e.returncode}")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Deploy Flex Manual to S3")
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
        "--flex-manual-prefix",
        default="flex-manual",
        help="Flex manual prefix directory (default: flex-manual)"
    )
    args = parser.parse_args()
    aws_profile = args.aws_profile or os.getenv("AWS_PROFILE")
    deploy_flex_manual(
        environment=args.environment,
        branch=args.branch,
        aws_profile=aws_profile,
        flex_manual_prefix=args.flex_manual_prefix
    )

if __name__ == "__main__":
    main()