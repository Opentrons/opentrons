"""Tests for deploy module - focusing on parsing and configuration logic only."""

import pytest
from deploy import DeployArgs, parse_all_args, parse_and_validate_args
from deploy_config import ApplicationConfig


def test_parse_valid_production_args():
    """Test parsing valid production arguments."""
    args = ["production", "labware_library", "/path/to/artifacts"]

    parsed: DeployArgs = parse_and_validate_args(args)

    # Check that we get the real config back
    assert isinstance(parsed.config, ApplicationConfig)
    assert parsed.config.s3_bucket == "opentrons.production.labware"
    assert parsed.config.url == "https://labware.opentrons.com/"
    assert parsed.artifact_root == "/path/to/artifacts"
    assert parsed.sandbox_prefix is None
    assert parsed.environment == "production"


def test_parse_valid_sandbox_args_with_branch():
    """Test parsing valid sandbox arguments with branch."""
    args = ["sandbox", "protocol_designer", "/path/to/artifacts", "--sandbox-prefix", "feature-branch"]

    parsed: DeployArgs = parse_and_validate_args(args)

    # Check that we get the real config back
    assert isinstance(parsed.config, ApplicationConfig)
    assert parsed.config.s3_bucket == "opentrons.sandbox.protocol-designer"
    assert parsed.config.url == "http://opentrons.sandbox.protocol-designer.s3-website.us-east-2.amazonaws.com/"
    assert parsed.artifact_root == "/path/to/artifacts"
    assert parsed.sandbox_prefix == "feature-branch"
    assert parsed.environment == "sandbox"


def test_parse_sandbox_without_branch_fails():
    """Test that sandbox deployment without branch fails."""
    args = ["sandbox", "labware_library", "/path/to/artifacts"]

    with pytest.raises(SystemExit) as exc_info:
        parse_and_validate_args(args)
    assert exc_info.value.code == 1


def test_parse_invalid_environment_fails():
    """Test that invalid environment fails."""
    args = ["invalid-env", "labware_library", "/path/to/artifacts"]

    with pytest.raises(SystemExit):
        parse_and_validate_args(args)


def test_parse_invalid_application_fails():
    """Test that invalid application fails."""
    args = ["production", "invalid-app", "/path/to/artifacts"]

    with pytest.raises(SystemExit):
        parse_and_validate_args(args)


def test_parse_all_valid_environments():
    """Test parsing all valid environments."""
    environments = ["sandbox", "staging", "production"]

    for env in environments:
        args = [env, "labware_library", "/path/to/artifacts"]
        if env == "sandbox":
            args.extend(["--sandbox-prefix", "test-branch"])

        parsed: DeployArgs = parse_and_validate_args(args)

        assert isinstance(parsed.config, ApplicationConfig)
        assert parsed.config.s3_bucket  # Should have a bucket name
        assert parsed.artifact_root == "/path/to/artifacts"
        assert parsed.environment == env
        if env == "sandbox":
            assert parsed.sandbox_prefix == "test-branch"
        else:
            assert parsed.sandbox_prefix is None


def test_parse_all_valid_applications():
    """Test parsing all valid applications."""
    applications = ["labware_library", "protocol_designer", "docs", "mkdocs"]

    for app in applications:
        args = ["production", app, "/path/to/artifacts"]

    parsed: DeployArgs = parse_and_validate_args(args)

    assert isinstance(parsed.config, ApplicationConfig)
    assert parsed.config.s3_bucket  # Should have a bucket name
    assert parsed.artifact_root == "/path/to/artifacts"
    assert parsed.sandbox_prefix is None
    assert parsed.environment == "production"


def test_parse_with_aws_profile_argument():
    """Test parsing with AWS profile argument (should be ignored by parse function)."""
    args = ["production", "labware_library", "/path/to/artifacts", "--aws-profile", "test-profile"]

    parsed: DeployArgs = parse_and_validate_args(args)

    assert isinstance(parsed.config, ApplicationConfig)
    assert parsed.config.s3_bucket == "opentrons.production.labware"
    assert parsed.artifact_root == "/path/to/artifacts"
    assert parsed.sandbox_prefix is None
    assert parsed.environment == "production"


def test_parse_all_args_includes_dry_run_flag():
    """Test that parse_all_args captures the --dry-run flag as True."""
    args = [
        "production",
        "labware_library",
        "/path/to/artifacts",
        "--dry-run",
    ]

    parsed: DeployArgs = parse_all_args(args)

    assert isinstance(parsed.config, ApplicationConfig)
    assert parsed.environment == "production"
    assert parsed.config.s3_bucket == "opentrons.production.labware"
    assert parsed.artifact_root == "/path/to/artifacts"
    assert parsed.sandbox_prefix is None
    assert parsed.dry_run is True
