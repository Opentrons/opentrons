"""Tests for deploy module - focusing on parsing and configuration logic only."""

import os
from unittest.mock import patch

import pytest
from deploy import DeployArgs, parse_all_args, parse_and_validate_args
from deploy_config import ApplicationConfig


def test_parse_valid_production_args(tmp_path):
    """Test parsing valid production arguments."""
    # Create a temporary artifact directory
    artifact_dir = tmp_path / "artifacts"
    artifact_dir.mkdir()
    (artifact_dir / "index.html").write_text("test content")

    args = ["production", "labware_library", str(artifact_dir)]

    with patch.dict(os.environ, {"AWS_PROFILE": "test-profile"}, clear=False):
        parsed: DeployArgs = parse_and_validate_args(args)

    # Check that we get the real config back
    assert isinstance(parsed.config, ApplicationConfig)
    assert parsed.config.s3_bucket == "opentrons.production.labware"
    assert parsed.config.url == "https://labware.opentrons.com/"
    assert parsed.relative_artifact_dir == str(artifact_dir)
    assert parsed.sandbox_prefix is None
    assert parsed.environment == "production"
    assert parsed.aws_profile == "test-profile"


def test_parse_valid_sandbox_args_with_branch(tmp_path):
    """Test parsing valid sandbox arguments with branch."""
    # Create a temporary artifact directory
    artifact_dir = tmp_path / "artifacts"
    artifact_dir.mkdir()
    (artifact_dir / "app.js").write_text("console.log('test');")

    args = ["sandbox", "protocol_designer", str(artifact_dir), "--sandbox-prefix", "feature-branch"]

    with patch.dict(os.environ, {"AWS_PROFILE": "test-profile"}, clear=False):
        parsed: DeployArgs = parse_and_validate_args(args)

    # Check that we get the real config back
    assert isinstance(parsed.config, ApplicationConfig)
    assert parsed.config.s3_bucket == "opentrons.sandbox.protocol-designer"
    assert parsed.config.url == "http://opentrons.sandbox.protocol-designer.s3-website.us-east-2.amazonaws.com/"
    assert parsed.relative_artifact_dir == str(artifact_dir)
    assert parsed.sandbox_prefix == "feature-branch"
    assert parsed.environment == "sandbox"
    assert parsed.aws_profile == "test-profile"


def test_parse_sandbox_without_branch_fails():
    """Test that sandbox without branch fails."""
    args = ["sandbox", "labware_library", "/path/to/artifacts"]

    with pytest.raises(SystemExit):
        parse_and_validate_args(args)


def test_parse_invalid_environment_fails():
    """Test that invalid environment fails."""
    args = ["invalid", "labware_library", "/path/to/artifacts"]

    with pytest.raises(SystemExit):
        parse_and_validate_args(args)


def test_parse_invalid_application_fails():
    """Test that invalid application fails."""
    args = ["production", "invalid", "/path/to/artifacts"]

    with pytest.raises(SystemExit):
        parse_and_validate_args(args)


def test_parse_all_valid_environments(tmp_path):
    """Test parsing all valid environments."""
    environments = ["sandbox", "staging", "production"]

    for env in environments:
        # Create a temporary artifact directory for each test
        artifact_dir = tmp_path / f"artifacts_{env}"
        artifact_dir.mkdir()
        (artifact_dir / "test.html").write_text("test")

        args = [env, "labware_library", str(artifact_dir)]
        if env == "sandbox":
            args.extend(["--sandbox-prefix", "test-branch"])

        with patch.dict(os.environ, {"AWS_PROFILE": "test-profile"}, clear=False):
            parsed: DeployArgs = parse_and_validate_args(args)

        assert parsed.environment == env
        assert isinstance(parsed.config, ApplicationConfig)


def test_parse_all_valid_applications(tmp_path):
    """Test parsing all valid applications."""
    applications = ["labware_library", "protocol_designer", "docs", "mkdocs"]

    for app in applications:
        # Create a temporary artifact directory for each test
        artifact_dir = tmp_path / f"artifacts_{app}"
        artifact_dir.mkdir()
        (artifact_dir / "test.html").write_text("test")

        args = ["production", app, str(artifact_dir)]

        with patch.dict(os.environ, {"AWS_PROFILE": "test-profile"}, clear=False):
            parsed: DeployArgs = parse_and_validate_args(args)

        assert isinstance(parsed.config, ApplicationConfig)


def test_parse_with_aws_profile_argument(tmp_path):
    """Test parsing with AWS profile argument."""
    # Create a temporary artifact directory
    artifact_dir = tmp_path / "artifacts"
    artifact_dir.mkdir()
    (artifact_dir / "index.html").write_text("test content")

    args = ["production", "labware_library", str(artifact_dir), "--aws-profile", "test-profile"]

    parsed: DeployArgs = parse_and_validate_args(args)

    assert parsed.aws_profile == "test-profile"
    assert isinstance(parsed.config, ApplicationConfig)


def test_parse_all_args_includes_dry_run_flag(tmp_path):
    """Test that parse_all_args captures the --dry-run flag as True."""
    # Create a temporary artifact directory
    artifact_dir = tmp_path / "artifacts"
    artifact_dir.mkdir()
    (artifact_dir / "index.html").write_text("test content")

    args = [
        "production",
        "labware_library",
        str(artifact_dir),
        "--dry-run",
    ]

    with patch.dict(os.environ, {"AWS_PROFILE": "test-profile"}, clear=False):
        parsed: DeployArgs = parse_all_args(args)

    assert parsed.dry_run is True
    assert parsed.aws_profile == "test-profile"


def test_parse_aws_profile_priority(tmp_path):
    """Test that CLI AWS profile takes priority over environment variable."""
    # Create a temporary artifact directory
    artifact_dir = tmp_path / "artifacts"
    artifact_dir.mkdir()
    (artifact_dir / "index.html").write_text("test content")

    args = ["production", "labware_library", str(artifact_dir), "--aws-profile", "cli-profile"]

    # Set environment variable that should be overridden
    with patch.dict(os.environ, {"AWS_PROFILE": "env-profile"}, clear=False):
        parsed: DeployArgs = parse_and_validate_args(args)

    # CLI profile should win
    assert parsed.aws_profile == "cli-profile"


def test_parse_aws_profile_from_env(tmp_path):
    """Test that AWS profile comes from environment when no CLI flag."""
    # Create a temporary artifact directory
    artifact_dir = tmp_path / "artifacts"
    artifact_dir.mkdir()
    (artifact_dir / "index.html").write_text("test content")

    args = ["production", "labware_library", str(artifact_dir)]

    with patch.dict(os.environ, {"AWS_PROFILE": "env-profile"}, clear=False):
        parsed: DeployArgs = parse_and_validate_args(args)

    assert parsed.aws_profile == "env-profile"


def test_parse_aws_profile_required_non_ci(tmp_path):
    """Test that AWS profile is required in non-CI environments."""
    # Create a temporary artifact directory
    artifact_dir = tmp_path / "artifacts"
    artifact_dir.mkdir()
    (artifact_dir / "index.html").write_text("test content")

    args = ["production", "labware_library", str(artifact_dir)]

    # Clear CI and AWS_PROFILE environment
    with patch.dict(os.environ, {}, clear=True):
        with pytest.raises(SystemExit):
            parse_and_validate_args(args)


def test_parse_aws_profile_optional_in_ci(tmp_path):
    """Test that AWS profile is optional in CI environments."""
    # Create a temporary artifact directory
    artifact_dir = tmp_path / "artifacts"
    artifact_dir.mkdir()
    (artifact_dir / "index.html").write_text("test content")

    args = ["production", "labware_library", str(artifact_dir)]

    # Set CI environment but no AWS_PROFILE
    with patch.dict(os.environ, {"CI": "true"}, clear=True):
        parsed: DeployArgs = parse_and_validate_args(args)

    assert parsed.aws_profile is None
