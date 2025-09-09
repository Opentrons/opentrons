"""Tests for deploy_ci_config module."""

import os
import tempfile
from unittest.mock import patch

import pytest
from deploy_ci_config import (
    CIConfig,
    parse_github_env,
    resolve_ci_config,
    write_github_output,
    write_github_summary,
)


def test_parse_github_env_branch_push():
    """Test parsing GitHub environment for branch push event."""
    env = {
        "GITHUB_EVENT_NAME": "push",
        "GITHUB_REF": "refs/heads/test-branch",
        "GITHUB_REF_NAME": "test-branch",
        "GITHUB_WORKFLOW": "Labware Library test, build, and deploy",
    }

    with patch.dict(os.environ, env, clear=False):
        event_name, ref, ref_name, ref_type, head_ref = parse_github_env()

    assert event_name == "push"
    assert ref == "refs/heads/test-branch"
    assert ref_name == "test-branch"
    assert ref_type == "branch"
    assert head_ref is None


def test_parse_github_env_tag_push():
    """Test parsing GitHub environment for tag push event."""
    env = {
        "GITHUB_EVENT_NAME": "push",
        "GITHUB_REF": "refs/tags/staging-labware-library-v1.0.0",
        "GITHUB_REF_NAME": "staging-labware-library-v1.0.0",
        "GITHUB_WORKFLOW": "Labware Library test, build, and deploy",
    }

    with patch.dict(os.environ, env, clear=False):
        event_name, ref, ref_name, ref_type, head_ref = parse_github_env()

    assert event_name == "push"
    assert ref == "refs/tags/staging-labware-library-v1.0.0"
    assert ref_name == "staging-labware-library-v1.0.0"
    assert ref_type == "tag"
    assert head_ref is None


def test_resolve_ci_config_sandbox():
    """Test CI config resolution for sandbox environment."""
    env = {
        "GITHUB_EVENT_NAME": "push",
        "GITHUB_REF": "refs/heads/feature-branch",
        "GITHUB_REF_NAME": "feature-branch",
        "GITHUB_WORKFLOW": "Labware Library test, build, and deploy",
        "RELATIVE_ARTIFACT_DIR": "/test/artifacts",
    }

    with patch.dict(os.environ, env, clear=False):
        config = resolve_ci_config()

    assert isinstance(config, CIConfig)
    assert config.application == "labware_library"
    assert config.environment == "sandbox"
    assert config.sandbox_prefix == "feature-branch"
    assert config.relative_artifact_dir == "/test/artifacts"


def test_resolve_ci_config_staging():
    """Test CI config resolution for staging environment."""
    env = {
        "GITHUB_EVENT_NAME": "push",
        "GITHUB_REF": "refs/tags/staging-mkdocs-v1.0.0",
        "GITHUB_REF_NAME": "staging-mkdocs-v1.0.0",
        "GITHUB_WORKFLOW": "Docs build and deploy",
        "RELATIVE_ARTIFACT_DIR": "/build/docs",
    }

    with patch.dict(os.environ, env, clear=False):
        config = resolve_ci_config()

    assert isinstance(config, CIConfig)
    assert config.application == "mkdocs"
    assert config.environment == "staging"
    assert config.sandbox_prefix == "staging-mkdocs-v1.0.0"  # sandbox_prefix is the tag name for staging
    assert config.relative_artifact_dir == "/build/docs"


def test_resolve_ci_config_production():
    """Test CI config resolution for production environment."""
    env = {
        "GITHUB_EVENT_NAME": "push",
        "GITHUB_REF": "refs/tags/docs-v2.0.0",
        "GITHUB_REF_NAME": "docs-v2.0.0",
        "GITHUB_WORKFLOW": "Docs build and deploy",
        "RELATIVE_ARTIFACT_DIR": "/dist",
    }

    with patch.dict(os.environ, env, clear=False):
        config = resolve_ci_config()

    assert isinstance(config, CIConfig)
    assert config.application == "docs"
    assert config.environment == "production"
    assert config.sandbox_prefix == "docs-v2.0.0"  # sandbox_prefix is the tag name for production
    assert config.relative_artifact_dir == "/dist"


def test_write_github_output():
    """Test writing config to GITHUB_OUTPUT file."""
    config = CIConfig(
        application="labware_library",
        environment="sandbox",
        sandbox_prefix="test-branch",
        relative_artifact_dir="/tmp/artifacts",
    )

    with tempfile.NamedTemporaryFile(mode="w", delete=False) as f:
        output_file = f.name

    try:
        with patch.dict(os.environ, {"GITHUB_OUTPUT": output_file}, clear=False):
            write_github_output(config)

        with open(output_file, "r") as f:
            content = f.read()

        expected_lines = [
            "APPLICATION=labware_library",
            "ENVIRONMENT=sandbox",
            "SANDBOX_PREFIX=test-branch",
            "RELATIVE_ARTIFACT_DIR=/tmp/artifacts",
        ]

        for line in expected_lines:
            assert line in content

    finally:
        os.unlink(output_file)


def test_write_github_summary():
    """Test writing deployment summary to GitHub Actions."""
    config = CIConfig(
        application="protocol_designer",
        environment="production",
        sandbox_prefix=None,
        relative_artifact_dir="/dist/pd",
    )

    with tempfile.NamedTemporaryFile(mode="w", delete=False) as f:
        summary_file = f.name

    try:
        env_vars = {
            "GITHUB_STEP_SUMMARY": summary_file,
            "GITHUB_EVENT_NAME": "push",
            "GITHUB_REF": "refs/tags/pd-v2.0.0",
            "GITHUB_WORKFLOW": "PD test, build, and deploy",
        }

        with patch.dict(os.environ, env_vars, clear=False):
            write_github_summary(config)

        with open(summary_file, "r") as f:
            content = f.read()

        # Check key elements are present
        assert "🚀 Deployment Configuration Resolved" in content
        assert "Protocol Designer" in content
        assert "Production" in content
        assert "/dist/pd" in content
        assert "push" in content
        assert "refs/tags/pd-v2.0.0" in content

        # Should not have sandbox prefix section for production
        assert "Sandbox Prefix" not in content

    finally:
        os.unlink(summary_file)


def test_write_github_output_handles_file_errors():
    """Test that write_github_output raises RuntimeError on file write errors."""
    config = CIConfig(
        application="labware_library",
        environment="sandbox",
        sandbox_prefix="test-branch",
        relative_artifact_dir="/tmp/artifacts",
    )

    # Use a directory as the output file to cause a write error
    with tempfile.TemporaryDirectory() as temp_dir:
        with patch.dict(os.environ, {"GITHUB_OUTPUT": temp_dir}, clear=False):
            with pytest.raises(RuntimeError, match="Failed to write to GITHUB_OUTPUT"):
                write_github_output(config)


def test_resolve_ci_config_missing_relative_artifact_dir():
    """Test that missing artifact root raises error."""
    env = {
        "GITHUB_EVENT_NAME": "push",
        "GITHUB_REF": "refs/heads/test",
        "GITHUB_REF_NAME": "test",
        "GITHUB_WORKFLOW": "Labware Library test, build, and deploy",
        # No RELATIVE_ARTIFACT_DIR
    }

    with patch.dict(os.environ, env, clear=True):  # Clear environment
        with pytest.raises(ValueError, match="CI mode requires RELATIVE_ARTIFACT_DIR environment variable"):
            resolve_ci_config()
