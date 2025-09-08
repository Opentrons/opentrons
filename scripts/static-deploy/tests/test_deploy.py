"""Tests for deploy module - focusing on parsing and configuration logic only."""

import pytest
from deploy import parse_and_validate_args
from deploy_config import ApplicationConfig


def test_parse_valid_production_args():
    """Test parsing valid production arguments."""
    args = ["production", "labware_library", "/path/to/artifacts"]

    config, artifact_root, branch, environment = parse_and_validate_args(args)

    # Check that we get the real config back
    assert isinstance(config, ApplicationConfig)
    assert config.s3_bucket == "opentrons.production.labware"
    assert config.url == "https://labware.opentrons.com/"
    assert artifact_root == "/path/to/artifacts"
    assert branch is None
    assert environment == "production"


def test_parse_valid_sandbox_args_with_branch():
    """Test parsing valid sandbox arguments with branch."""
    args = ["sandbox", "protocol_designer", "/path/to/artifacts", "--branch", "feature-branch"]

    config, artifact_root, branch, environment = parse_and_validate_args(args)

    # Check that we get the real config back
    assert isinstance(config, ApplicationConfig)
    assert config.s3_bucket == "opentrons.sandbox.protocol-designer"
    assert config.url == "http://opentrons.sandbox.protocol-designer.s3-website.us-east-2.amazonaws.com/"
    assert artifact_root == "/path/to/artifacts"
    assert branch == "feature-branch"
    assert environment == "sandbox"


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
            args.extend(["--branch", "test-branch"])

        config, artifact_root, branch, environment = parse_and_validate_args(args)

        assert isinstance(config, ApplicationConfig)
        assert config.s3_bucket  # Should have a bucket name
        assert artifact_root == "/path/to/artifacts"
        assert environment == env
        if env == "sandbox":
            assert branch == "test-branch"
        else:
            assert branch is None


def test_parse_all_valid_applications():
    """Test parsing all valid applications."""
    applications = ["labware_library", "protocol_designer", "docs", "mkdocs"]

    for app in applications:
        args = ["production", app, "/path/to/artifacts"]

        config, artifact_root, branch, environment = parse_and_validate_args(args)

        assert isinstance(config, ApplicationConfig)
        assert config.s3_bucket  # Should have a bucket name
        assert artifact_root == "/path/to/artifacts"
        assert branch is None
        assert environment == "production"


def test_parse_with_aws_profile_argument():
    """Test parsing with AWS profile argument (should be ignored by parse function)."""
    args = ["production", "labware_library", "/path/to/artifacts", "--aws-profile", "test-profile"]

    config, artifact_root, branch, environment = parse_and_validate_args(args)

    assert isinstance(config, ApplicationConfig)
    assert config.s3_bucket == "opentrons.production.labware"
    assert artifact_root == "/path/to/artifacts"
    assert branch is None
    assert environment == "production"
