#!/usr/bin/env python
"""
Test script for deploy_config.py

This script demonstrates how to test the deployment configuration logic locally.
"""

import sys
import os

# Add the current directory to the path so we can import deploy_config
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from deploy_config import determine_deploy_config


def test_deploy_config():
    """Test various deployment scenarios."""
    
    test_cases = [
        {
            "name": "Pull Request",
            "args": {
                "event_name": "pull_request",
                "ref": "refs/pull/123/head",
                "ref_name": "feature-branch",
                "ref_type": "branch",
                "head_ref": "feature-branch",
            },
            "expected": {
                "environment": "sandbox",
                "branch": "feature-branch",
                "bucket": "sandbox.docs",
                "url": "http://sandbox.docs.s3-website.us-east-2.amazonaws.com/feature-branch/",
            }
        },
        {
            "name": "Branch Push",
            "args": {
                "event_name": "push",
                "ref": "refs/heads/feature-branch",
                "ref_name": "feature-branch",
                "ref_type": "branch",
            },
            "expected": {
                "environment": "sandbox",
                "branch": "feature-branch",
                "bucket": "sandbox.docs",
                "url": "http://sandbox.docs.s3-website.us-east-2.amazonaws.com/feature-branch/",
            }
        },
        {
            "name": "Staging Tag",
            "args": {
                "event_name": "push",
                "ref": "refs/tags/staging-MKDOCS-v1.0.0",
                "ref_name": "staging-MKDOCS-v1.0.0",
                "ref_type": "tag",
            },
            "expected": {
                "environment": "staging",
                "branch": "staging-MKDOCS-v1.0.0",
                "bucket": "opentrons.staging.docs",
                "url": "https://staging.docs.opentrons.com/",
            }
        },
        {
            "name": "Production Tag",
            "args": {
                "event_name": "push",
                "ref": "refs/tags/MKDOCS-v1.0.0",
                "ref_name": "MKDOCS-v1.0.0",
                "ref_type": "tag",
            },
            "expected": {
                "environment": "production",
                "branch": "MKDOCS-v1.0.0",
                "bucket": "opentrons.production.docs",
                "url": "https://docs.opentrons.com/",
            }
        },
    ]
    
    print("🧪 Testing deployment configuration logic...\n")
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"Test {i}: {test_case['name']}")
        print(f"  Input: {test_case['args']}")
        
        try:
            result = determine_deploy_config(**test_case['args'])
            print(f"  Output: {result}")
            
            # Check if result matches expected
            if result == test_case['expected']:
                print("  ✅ PASS")
            else:
                print("  ❌ FAIL")
                print(f"  Expected: {test_case['expected']}")
                print(f"  Got:      {result}")
                
        except Exception as e:
            print(f"  ❌ ERROR: {e}")
        
        print()


def test_command_line():
    """Test the command-line interface."""
    print("🔧 Testing command-line interface...\n")
    
    test_commands = [
        ["pull_request", "refs/pull/123/head", "feature-branch", "branch", "feature-branch"],
        ["push", "refs/heads/main", "main", "branch"],
        ["push", "refs/tags/staging-MKDOCS-v1.0.0", "staging-MKDOCS-v1.0.0", "tag"],
        ["push", "refs/tags/MKDOCS-v1.0.0", "MKDOCS-v1.0.0", "tag"],
    ]
    
    for i, cmd_args in enumerate(test_commands, 1):
        print(f"Command {i}: python deploy_config.py {' '.join(cmd_args)}")
        print("Output:")
        
        # Simulate command-line execution
        import subprocess
        try:
            result = subprocess.run(
                [sys.executable, "deploy_config.py"] + cmd_args,
                capture_output=True,
                text=True,
                cwd=os.path.dirname(os.path.abspath(__file__))
            )
            print(result.stdout)
            if result.stderr:
                print(f"Error: {result.stderr}")
        except Exception as e:
            print(f"Error running command: {e}")
        
        print()


if __name__ == "__main__":
    print("🚀 Deploy Config Test Suite\n")
    print("=" * 50)
    
    test_deploy_config()
    print("=" * 50)
    test_command_line()
    
    print("\n✨ Test suite complete!")
    print("\nTo run individual tests:")
    print("  uv run python test_deploy_config.py")
    print("\nTo test specific scenarios:")
    print("  uv run python deploy_config.py pull_request refs/pull/123/head feature-branch branch feature-branch")
    print("  uv run python deploy_config.py push refs/tags/staging-MKDOCS-v1.0.0 staging-MKDOCS-v1.0.0 tag")
