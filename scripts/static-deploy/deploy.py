#!/usr/bin/env python3
"""
Generic deployment script for Opentrons applications.

This script consumes a configuration object and artifact_root to deploy
any application to the appropriate AWS resources.
"""

import argparse
import os
import sys
from pathlib import Path
from typing import Optional

import boto3
from botocore.exceptions import ClientError, NoCredentialsError

from deploy_config import ApplicationConfig


def deploy_application(
    config: ApplicationConfig,
    artifact_root: str,
    branch: Optional[str] = None,
    aws_profile: Optional[str] = None,
    environment: str = "unknown"
) -> None:
    """
    Deploy application artifacts to S3 using boto3.
    
    Args:
        config: ApplicationConfig object containing S3 bucket, CloudFront ID, and URL
        artifact_root: Path to the directory containing artifacts to deploy
        branch: Branch name for sandbox deployments (optional)
        aws_profile: AWS profile to use (optional)
        environment: Environment name for logging (optional)
    """
    
    # Check if we're in CI
    is_ci = os.getenv("CI") is not None
    if is_ci:
        print("Running in CI environment")
    elif aws_profile is None and not os.getenv("AWS_PROFILE"):
        print("Warning: No AWS profile specified. Make sure you have AWS credentials configured.")
    
    # Verify artifact directory exists
    artifact_path = Path(artifact_root)
    if not artifact_path.exists():
        print(f"Error: Artifact directory {artifact_path} does not exist.")
        print("Make sure you've built the application first.")
        sys.exit(1)
    
    # Check if this is a directory
    if artifact_path.is_file():
        print(f"Error: {artifact_path} is a file, not a directory.")
        print("Make sure you've built the application first.")
        sys.exit(1)

    # Check if artifact directory has content
    artifact_files = list(artifact_path.glob("*"))
    if not artifact_files:
        print(f"Warning: Artifact directory {artifact_path} is empty.")
        print("Make sure you've built the application first.")

    print(f"Artifact directory contents: {[f.name for f in artifact_files[:10]]}{'...' if len(artifact_files) > 10 else ''}")
    
    # Initialize boto3 session
    try:
        if aws_profile:
            session = boto3.Session(profile_name=aws_profile)
        else:
            session = boto3.Session()
        
        s3_client = session.client('s3')
        sts_client = session.client('sts')
        
    except NoCredentialsError:
        print("❌ AWS credentials not found. Please configure your credentials.")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error initializing AWS session: {e}")
        sys.exit(1)
    
    # Test AWS credentials
    print("Testing AWS credentials...")
    try:
        identity = sts_client.get_caller_identity()
        print(f"✅ AWS credentials working: {identity.get('Arn', 'Unknown')}")
    except ClientError as e:
        print(f"❌ AWS credentials issue: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error testing AWS credentials: {e}")
        sys.exit(1)
    
    # Check if bucket exists and is accessible
    print(f"Checking if bucket {config.s3_bucket} exists...")
    try:
        s3_client.head_bucket(Bucket=config.s3_bucket)
        print(f"✅ Bucket {config.s3_bucket} exists and is accessible")
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == '404':
            print(f"❌ Bucket {config.s3_bucket} does not exist")
        elif error_code == '403':
            print(f"❌ Access denied to bucket {config.s3_bucket}")
        else:
            print(f"❌ Error accessing bucket {config.s3_bucket}: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error checking bucket: {e}")
        sys.exit(1)
    
    # Test write permissions to bucket
    print("Testing write permissions...")
    test_key = "test-write-permission.txt"
    try:
        s3_client.put_object(
            Bucket=config.s3_bucket,
            Key=test_key,
            Body=b"test"
        )
        print("✅ Write permissions confirmed")
        # Clean up test file
        s3_client.delete_object(Bucket=config.s3_bucket, Key=test_key)
    except ClientError as e:
        print(f"❌ Write permission denied: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error testing write permissions: {e}")
        sys.exit(1)
    
    # Determine S3 prefix based on environment
    if environment == "sandbox" and branch:
        s3_prefix = f"{branch}/"
        deployment_url = f"{config.url}{branch}/"
    else:
        s3_prefix = ""
        deployment_url = config.url
    
    print(f"Deploying to {environment} environment:")
    print(f"  Bucket: {config.s3_bucket}")
    if environment == "sandbox" and branch:
        print(f"  Branch: {branch}")
    print(f"  S3 Prefix: {s3_prefix or '(root)'}")
    print(f"  Deployment URL: {deployment_url}")
    
    # Deploy artifacts to S3
    print("Deploying artifacts...")
    uploaded_count = 0
    failed_count = 0
    
    try:
        # First, delete existing objects if this is a clean deployment
        if environment != "sandbox":  # Only clean deploy for staging/production
            print("Cleaning existing objects...")
            paginator = s3_client.get_paginator('list_objects_v2')
            pages = paginator.paginate(Bucket=config.s3_bucket, Prefix=s3_prefix)
            
            objects_to_delete = []
            for page in pages:
                if 'Contents' in page:
                    for obj in page['Contents']:
                        objects_to_delete.append({'Key': obj['Key']})
            
            if objects_to_delete:
                # Delete in batches of 1000 (S3 limit)
                for i in range(0, len(objects_to_delete), 1000):
                    batch = objects_to_delete[i:i+1000]
                    s3_client.delete_objects(
                        Bucket=config.s3_bucket,
                        Delete={'Objects': batch}
                    )
                print(f"✅ Deleted {len(objects_to_delete)} existing objects")
        
        # Upload new artifacts
        for file_path in artifact_path.rglob("*"):
            if file_path.is_file():
                # Calculate relative path from artifact_root
                relative_path = file_path.relative_to(artifact_path)
                s3_key = f"{s3_prefix}{relative_path}".replace("\\", "/")  # Ensure forward slashes
                
                try:
                    # Determine content type
                    content_type = None
                    if file_path.suffix == '.html':
                        content_type = 'text/html'
                    elif file_path.suffix == '.css':
                        content_type = 'text/css'
                    elif file_path.suffix == '.js':
                        content_type = 'application/javascript'
                    elif file_path.suffix == '.json':
                        content_type = 'application/json'
                    elif file_path.suffix == '.png':
                        content_type = 'image/png'
                    elif file_path.suffix == '.jpg' or file_path.suffix == '.jpeg':
                        content_type = 'image/jpeg'
                    elif file_path.suffix == '.svg':
                        content_type = 'image/svg+xml'
                    
                    # Upload file
                    extra_args = {}
                    if content_type:
                        extra_args['ContentType'] = content_type
                    
                    s3_client.upload_file(
                        str(file_path),
                        config.s3_bucket,
                        s3_key,
                        ExtraArgs=extra_args
                    )
                    uploaded_count += 1
                    
                    if uploaded_count % 100 == 0:
                        print(f"  Uploaded {uploaded_count} files...")
                        
                except Exception as e:
                    print(f"❌ Failed to upload {file_path}: {e}")
                    failed_count += 1
        
        print(f"✅ Successfully uploaded {uploaded_count} files")
        if failed_count > 0:
            print(f"⚠️  Failed to upload {failed_count} files")
        
        # Invalidate CloudFront cache if configured
        if config.cloudfront_id:
            print(f"Invalidating CloudFront cache for distribution {config.cloudfront_id}...")
            try:
                cloudfront_client = session.client('cloudfront')
                cloudfront_client.create_invalidation(
                    DistributionId=config.cloudfront_id,
                    InvalidationBatch={
                        'Paths': {
                            'Quantity': 1,
                            'Items': ['/*']
                        },
                        'CallerReference': f"deploy-{environment}-{int(os.getenv('GITHUB_RUN_ID', 0))}"
                    }
                )
                print("✅ CloudFront cache invalidation initiated")
            except Exception as e:
                print(f"⚠️  CloudFront cache invalidation failed: {e}")
                # Don't fail the deployment for CloudFront issues
        
        print(f"✅ Successfully deployed to {environment}!")
        print(f"📍 Deployed to: {deployment_url}")
        
    except Exception as e:
        print(f"❌ Deployment failed: {e}")
        sys.exit(1)


def main():
    """Main entry point for the deployment script."""
    parser = argparse.ArgumentParser(description="Deploy application artifacts to S3")
    parser.add_argument(
        "environment",
        choices=["sandbox", "staging", "production"],
        help="Deployment environment"
    )
    parser.add_argument(
        "application",
        choices=["labware_library", "protocol_designer", "docs", "mkdocs"],
        help="Application to deploy"
    )
    parser.add_argument(
        "artifact_root",
        help="Path to the directory containing artifacts to deploy"
    )
    parser.add_argument(
        "--branch",
        help="Branch name (required for sandbox deployments)"
    )
    parser.add_argument(
        "--aws-profile",
        help="AWS profile to use (defaults to AWS_PROFILE env var)"
    )
    
    args = parser.parse_args()
    
    # Validate branch requirement for sandbox
    if args.environment == "sandbox" and not args.branch:
        print("Error: --branch is required for sandbox deployments")
        sys.exit(1)
    
    aws_profile = args.aws_profile or os.getenv("AWS_PROFILE")
    
    # Get configuration for the application and environment
    try:
        from deploy_config import get_config
        config = get_config(args.environment, args.application)
    except Exception as e:
        print(f"Error getting configuration: {e}")
        sys.exit(1)
    
    deploy_application(
        config=config,
        artifact_root=args.artifact_root,
        branch=args.branch,
        aws_profile=aws_profile,
        environment=args.environment
    )


if __name__ == "__main__":
    main()