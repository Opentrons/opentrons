#!/usr/bin/env python
"""
Deployment configuration logic for Labware Library.

This script determines the deployment environment, bucket, URL, and other
configuration based on the GitHub event context. It can be used both in
GitHub Actions and locally for testing.
"""

import os
import sys
import json
from typing import Dict, Optional


def determine_deploy_config(
    event_name: str,
    ref: str,
    ref_name: str,
    ref_type: str,
    head_ref: Optional[str] = None,
    base_ref: Optional[str] = None,
    tag_name: Optional[str] = None,
) -> Dict[str, str]:
    """
    Determine deployment configuration based on GitHub event context.
    
    Args:
        event_name: GitHub event name (e.g., 'push', 'pull_request')
        ref: Full git reference (e.g., 'refs/heads/main', 'refs/tags/staging-labware-library-v1.0.0')
        ref_name: Reference name (e.g., 'main', 'staging-labware-library-v1.0.0')
        ref_type: Reference type ('branch' or 'tag')
        head_ref: Head reference for pull requests
        base_ref: Base reference for pull requests
        tag_name: Tag name if this is a tag event
        
    Returns:
        Dictionary containing deployment configuration:
        - environment: 'sandbox', 'staging', or 'production'
        - branch: Branch name for deployment
        - bucket: S3 bucket name
        - url: Full URL for the deployed site
    """
    
    # Determine environment and branch based on event type
    if event_name == "pull_request":
        environment = "sandbox"
        # Handle empty or null head_ref values
        if head_ref and head_ref.lower() not in ["", "null", "none"]:
            branch = head_ref
        else:
            branch = "unknown"
        bucket = "opentrons.sandbox.labware"
        url = f"http://opentrons.sandbox.labware.s3-website.us-east-2.amazonaws.com/{branch}/"
    elif event_name == "push" and ref_type == "branch":
        environment = "sandbox"
        branch = ref_name
        bucket = "opentrons.sandbox.labware"
        url = f"http://opentrons.sandbox.labware.s3-website.us-east-2.amazonaws.com/{branch}/"
    elif ref.startswith("refs/tags/staging-labware-library"):
        environment = "staging"
        branch = ref_name
        bucket = "opentrons.staging.labware"
        url = "https://staging.labware.opentrons.com/"
    elif ref.startswith("refs/tags/labware-library"):
        environment = "production"
        branch = ref_name
        bucket = "opentrons.production.labware"
        url = "https://labware.opentrons.com/"
    else:
        raise ValueError(f"No deployment configuration found for event: {event_name}, ref: {ref}")
    
    return {
        "environment": environment,
        "branch": branch,
        "bucket": bucket,
        "url": url,
    }


def main():
    """Main function for command-line usage."""
    if len(sys.argv) < 2:
        print("Usage: python labware_deploy_config.py <event_name> [ref] [ref_name] [ref_type] [head_ref]")
        print("Example: python labware_deploy_config.py pull_request refs/pulls/123/head feature-branch branch feature-branch")
        sys.exit(1)
    
    event_name = sys.argv[1]
    
    # For local testing, we can provide additional context
    ref = sys.argv[2] if len(sys.argv) > 2 else "refs/heads/main"
    ref_name = sys.argv[3] if len(sys.argv) > 3 else "main"
    ref_type = sys.argv[4] if len(sys.argv) > 4 else "branch"
    head_ref = sys.argv[5] if len(sys.argv) > 5 else None
    
    try:
        config = determine_deploy_config(
            event_name=event_name,
            ref=ref,
            ref_name=ref_name,
            ref_type=ref_type,
            head_ref=head_ref,
        )
        
        # Output in GitHub Actions format
        for key, value in config.items():
            print(f"{key}={value}")
            
        # Also output as JSON for debugging
        print(f"# JSON: {json.dumps(config, indent=2)}")
        
        # For GitHub Actions, we need to set the outputs
        if os.environ.get('GITHUB_OUTPUT'):
            with open(os.environ['GITHUB_OUTPUT'], 'a') as f:
                for key, value in config.items():
                    f.write(f"{key}={value}\n")
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
