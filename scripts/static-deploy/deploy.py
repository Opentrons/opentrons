#!/usr/bin/env python3
"""
Generic deployment script for Opentrons applications.

This script consumes a configuration object and relative_artifact_dir to deploy
any application to the appropriate AWS resources.
"""

import argparse
import os
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from deploy_config import ApplicationConfig
from rich.console import Console

console = Console()


def _validate_artifact_directory(relative_artifact_dir: str) -> Path:
    """Validate that the artifact directory exists and is a directory.

    Args:
        relative_artifact_dir: Path to the directory containing artifacts to deploy

    Returns:
        Path object for the validated directory

    Raises:
        SystemExit: If validation fails
    """
    artifact_path = Path(relative_artifact_dir)

    if not artifact_path.exists():
        console.print(f"❌ Error: Artifact directory {artifact_path} does not exist.", style="red")
        console.print("Make sure you've built the application first.", style="red")
        sys.exit(1)

    # Check if this is a directory (not a file)
    if not artifact_path.is_dir():
        console.print(f"❌ Error: {artifact_path} is not a directory.", style="red")
        console.print("The artifact path must be a directory containing built artifacts.", style="red")
        sys.exit(1)

    # Check if artifact directory has content
    artifact_files = list(artifact_path.glob("*"))
    if not artifact_files:
        console.print(f"⚠️  Warning: Artifact directory {artifact_path} is empty.", style="yellow")
        console.print("Make sure you've built the application first.", style="yellow")

    console.print(f"Artifact directory contents: {[f.name for f in artifact_files[:10]]}{'...' if len(artifact_files) > 10 else ''}")

    return artifact_path


def _resolve_aws_profile(cli_aws_profile: Optional[str]) -> Optional[str]:
    """Resolve AWS profile with proper priority: CLI flag > ENV var > error in non-CI.

    Args:
        cli_aws_profile: AWS profile from --aws-profile CLI argument

    Returns:
        Resolved AWS profile name or None for CI environments

    Raises:
        SystemExit: If no AWS profile is available in non-CI environments
    """
    # Check if we're in CI environment
    is_ci = os.getenv("CI") is not None

    # Priority 1: --aws-profile flag
    if cli_aws_profile:
        return cli_aws_profile

    # Priority 2: AWS_PROFILE environment variable
    env_aws_profile = os.getenv("AWS_PROFILE")
    if env_aws_profile:
        return env_aws_profile

    # In CI, we can use default credentials (IAM roles, etc.)
    if is_ci:
        return None

    # In local environments, require explicit AWS profile
    console.print("❌ Error: AWS profile required for local deployment", style="red")
    console.print("  Use --aws-profile <profile> or set AWS_PROFILE environment variable", style="red")
    sys.exit(1)


@dataclass(frozen=True)
class DeployArgs:
    """Parsed deploy CLI arguments.

    Attributes:
        config: Application configuration resolved for the environment/app.
        relative_artifact_dir: Path to built artifacts to sync.
        sandbox_prefix: Optional sandbox path prefix (branch or tag name).
        environment: Target environment name.
        aws_profile: AWS profile to use for authentication.
        dry_run: Whether to run without making changes.
    """

    config: ApplicationConfig
    relative_artifact_dir: str
    sandbox_prefix: Optional[str]
    environment: str
    aws_profile: Optional[str]
    dry_run: bool = False


def _build_parser() -> argparse.ArgumentParser:
    """Build the CLI argument parser.

    Returns:
        Configured ArgumentParser instance.
    """
    parser = argparse.ArgumentParser(description="Deploy application artifacts to S3")
    parser.add_argument("environment", choices=["sandbox", "staging", "production"], help="Deployment environment")
    parser.add_argument(
        "application",
        choices=["labware_library", "protocol_designer", "docs", "mkdocs"],
        help="Application to deploy",
    )
    parser.add_argument("relative_artifact_dir", help="Path to the directory containing artifacts to deploy")
    parser.add_argument(
        "--sandbox-prefix",
        dest="sandbox_prefix",
        help="Sandbox path prefix (branch or tag); required for sandbox deployments",
    )
    parser.add_argument("--aws-profile", help="AWS profile to use (defaults to AWS_PROFILE env var)")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would change without making any changes (adds aws s3 sync --dryrun and skips writes)",
    )
    return parser


def deploy_application(  # noqa: C901
    config: ApplicationConfig,
    relative_artifact_dir: str,
    sandbox_prefix: Optional[str] = None,
    aws_profile: Optional[str] = None,
    environment: str = "unknown",
    dry_run: bool = False,
) -> None:
    """
    Deploy application artifacts to S3 using boto3.

    Args:
        config: ApplicationConfig object containing S3 bucket, CloudFront ID, and URL
        relative_artifact_dir: Path to the directory containing artifacts to deploy
        sandbox_prefix: prefix for sandbox deployments (optional)
        aws_profile: AWS profile to use (optional)
        environment: Environment name for logging (optional)
        dry_run: Whether to run without making changes
    """

    # Check if we're in CI
    is_ci = os.getenv("CI") is not None
    if is_ci:
        console.print("Running in CI environment", style="blue")
    else:
        console.print(f"Using AWS profile: {aws_profile or 'default'}", style="blue")

    # Use the already-validated artifact directory
    artifact_path = Path(relative_artifact_dir)

    # Initialize boto3 session
    try:
        if aws_profile:
            session = boto3.Session(profile_name=aws_profile)
        else:
            session = boto3.Session()

        s3_client = session.client("s3")
        sts_client = session.client("sts")

    except NoCredentialsError:
        console.print("❌ AWS credentials not found. Please configure your credentials.", style="red")
        sys.exit(1)
    except Exception as e:
        console.print(f"❌ Error initializing AWS session: {e}", style="red")
        sys.exit(1)

    # Test AWS credentials
    console.print("Testing AWS credentials...")
    try:
        identity = sts_client.get_caller_identity()
        console.print(f"✅ AWS credentials working: {identity.get('Arn', 'Unknown')}", style="green")
    except ClientError as e:
        console.print(f"❌ AWS credentials issue: {e}", style="red")
        sys.exit(1)
    except Exception as e:
        console.print(f"❌ Error testing AWS credentials: {e}", style="red")
        sys.exit(1)

    # Check if bucket exists and is accessible
    console.print(f"Checking if bucket {config.s3_bucket} exists...")
    try:
        s3_client.head_bucket(Bucket=config.s3_bucket)
        console.print(f"✅ Bucket {config.s3_bucket} exists and is accessible", style="green")
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        if error_code == "404":
            console.print(f"❌ Bucket {config.s3_bucket} does not exist", style="red")
        elif error_code == "403":
            console.print(f"❌ Access denied to bucket {config.s3_bucket}", style="red")
        else:
            console.print(f"❌ Error accessing bucket {config.s3_bucket}: {e}", style="red")
        sys.exit(1)
    except Exception as e:
        console.print(f"❌ Error checking bucket: {e}", style="red")
        sys.exit(1)

    # Skipping explicit write-permission probe; aws s3 sync will surface errors if writes are not permitted

    # Determine S3 prefix based on environment
    if environment == "sandbox" and sandbox_prefix:
        s3_prefix = f"{sandbox_prefix}/"
        deployment_url = f"{config.url}{sandbox_prefix}/"
    else:
        s3_prefix = ""
        deployment_url = config.url

    console.print(f"Deploying to {environment} environment:")
    console.print(f"  Bucket: {config.s3_bucket}")
    if environment == "sandbox" and sandbox_prefix:
        console.print(f"  Sandbox prefix: {sandbox_prefix}")
    console.print(f"  S3 Prefix: {s3_prefix or '(root)'}")
    console.print(f"  Deployment URL: {deployment_url}")

    # Deploy artifacts to S3
    console.print("Deploying artifacts...")
    # Upload progress is handled by AWS CLI output

    try:
        # No manual pre-clean: rely on aws s3 sync --delete in all environments
        if dry_run:
            console.print("Dry run: will simulate deletions via 'aws s3 sync --delete --dryrun'", style="blue")
        else:
            console.print("Using 'aws s3 sync --delete' to remove remote files not present locally", style="blue")

        # Upload new artifacts using AWS CLI instead of boto3 for faster sync and automatic content-type
        try:
            s3_uri = f"s3://{config.s3_bucket}/{s3_prefix}"
            cmd = [
                "aws",
                "s3",
                "sync",
                str(artifact_path),
                s3_uri,
                "--only-show-errors",
                "--exact-timestamps",
            ]
            cmd.append("--delete")
            # Dry run simulation
            if dry_run:
                cmd.append("--dryrun")
            # Use provided profile if any
            if aws_profile:
                cmd.extend(["--profile", aws_profile])

            console.print(f"Running: {' '.join(cmd)}", style="blue")
            result = subprocess.run(cmd, check=True, text=True, capture_output=True)
            # aws s3 sync doesn't return a count; we surface its output for visibility
            if result.stdout.strip():
                console.print(result.stdout.strip())
            console.print("✅ Sync completed", style="green")
        except FileNotFoundError:
            console.print("❌ 'aws' CLI not found. Please install AWS CLI v2 and ensure it's on PATH.", style="red")
            sys.exit(1)
        except subprocess.CalledProcessError as e:
            if e.stdout:
                console.print(e.stdout, style="red")
            if e.stderr:
                console.print(e.stderr, style="red")
            console.print(f"❌ AWS CLI sync failed with exit code {e.returncode}", style="red")
            sys.exit(1)

        # Invalidate CloudFront cache if configured
        if config.cloudfront_id:
            console.print(f"Invalidating CloudFront cache for distribution {config.cloudfront_id}...")
            try:
                if dry_run:
                    console.print("Dry run: skipping CloudFront invalidation", style="blue")
                else:
                    cloudfront_client = session.client("cloudfront")
                    cloudfront_client.create_invalidation(
                        DistributionId=config.cloudfront_id,
                        InvalidationBatch={
                            "Paths": {"Quantity": 1, "Items": ["/*"]},
                            "CallerReference": f"deploy-{environment}-{int(os.getenv('GITHUB_RUN_ID', 0))}",
                        },
                    )
                    console.print("✅ CloudFront cache invalidation initiated", style="green")
            except Exception as e:
                console.print(f"⚠️  CloudFront cache invalidation failed: {e}", style="yellow")
                # Don't fail the deployment for CloudFront issues

        console.print(f"✅ Successfully deployed to {environment}!", style="green bold")
        console.print(f"📍 Deployed to: {deployment_url}", style="blue")

    except Exception as e:
        console.print(f"❌ Deployment failed: {e}", style="red")
        sys.exit(1)


def parse_and_validate_args(args: Optional[list] = None) -> DeployArgs:
    """Parse CLI arguments needed for tests (without side-effect flags).

    Args:
        args: Optional list of arguments to parse (for testing).

    Returns:
        DeployArgs value object (frozen) with config, relative_artifact_dir, sandbox_prefix, environment, aws_profile.

    Raises:
        SystemExit: If validation fails or configuration cannot be loaded.
    """
    parser = _build_parser()
    parsed_args = parser.parse_args(args)

    # Validate branch requirement for sandbox
    if parsed_args.environment == "sandbox" and not parsed_args.sandbox_prefix:
        console.print("❌ Error: --sandbox-prefix is required for sandbox deployments", style="red")
        sys.exit(1)

    # Validate artifact directory
    _validate_artifact_directory(parsed_args.relative_artifact_dir)

    # Resolve AWS profile with proper priority
    aws_profile = _resolve_aws_profile(parsed_args.aws_profile)

    # Get configuration for the application and environment
    try:
        from deploy_config import get_config

        config = get_config(parsed_args.environment, parsed_args.application)
    except Exception as e:
        console.print(f"❌ Error getting configuration: {e}", style="red")
        sys.exit(1)

    return DeployArgs(
        config=config,
        relative_artifact_dir=parsed_args.relative_artifact_dir,
        sandbox_prefix=parsed_args.sandbox_prefix,
        environment=parsed_args.environment,
        aws_profile=aws_profile,
        dry_run=False,
    )


def parse_all_args(args: Optional[list] = None) -> DeployArgs:
    """Parse all CLI arguments including the dry-run flag.

    Args:
        args: Optional list of arguments to parse (for testing).

    Returns:
        DeployArgs value object (frozen) including dry_run.
    """
    parser = _build_parser()
    parsed_args = parser.parse_args(args)

    # Validate branch requirement for sandbox
    if parsed_args.environment == "sandbox" and not parsed_args.sandbox_prefix:
        console.print("❌ Error: --sandbox-prefix is required for sandbox deployments", style="red")
        sys.exit(1)

    # Validate artifact directory
    _validate_artifact_directory(parsed_args.relative_artifact_dir)

    # Resolve AWS profile with proper priority
    aws_profile = _resolve_aws_profile(parsed_args.aws_profile)

    # Get configuration for the application and environment
    try:
        from deploy_config import get_config

        config = get_config(parsed_args.environment, parsed_args.application)
    except Exception as e:
        console.print(f"❌ Error getting configuration: {e}", style="red")
        sys.exit(1)

    return DeployArgs(
        config=config,
        relative_artifact_dir=parsed_args.relative_artifact_dir,
        sandbox_prefix=parsed_args.sandbox_prefix,
        environment=parsed_args.environment,
        aws_profile=aws_profile,
        dry_run=parsed_args.dry_run,
    )


def main():
    """Main entry point for the deployment script."""
    # Parse CLI arguments - all arguments are required now
    parsed = parse_all_args()

    deploy_application(
        config=parsed.config,
        relative_artifact_dir=parsed.relative_artifact_dir,
        sandbox_prefix=parsed.sandbox_prefix,
        aws_profile=parsed.aws_profile,
        environment=parsed.environment,
        dry_run=parsed.dry_run,
    )


if __name__ == "__main__":
    main()
