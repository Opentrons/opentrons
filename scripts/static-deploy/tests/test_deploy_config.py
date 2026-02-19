"""Tests for deploy_config module."""

from unittest.mock import patch

import pytest
from deploy_config import (
    ApplicationConfig,
    GitHubEventArgs,
    InvalidApplicationError,
    InvalidEnvironmentError,
    determine_deploy_config_from_args,
    get_config,
    main,
    parse_cli_event_args,
    parse_github_event_context,
)


def test_get_valid_configs():
    """Test that valid environment/application combinations return proper configs."""
    designer_config = get_config("production", "protocol_designer")

    assert isinstance(designer_config, ApplicationConfig)


def test_get_config_case_insensitive():
    """Test that get_config is case insensitive."""
    # Test uppercase
    config1 = get_config("SANDBOX", "PROTOCOL_DESIGNER")
    config2 = get_config("sandbox", "protocol_designer")

    # Should get the same values (both use DEFAULT since no env vars set)
    assert config1.s3_bucket == config2.s3_bucket
    assert config1.cloudfront_id == config2.cloudfront_id

    # Test mixed case
    config3 = get_config("Staging", "Protocol_Designer")
    assert isinstance(config3, ApplicationConfig)


def test_get_invalid_environment_raises_error():
    """Test that invalid environments raise InvalidEnvironmentError."""
    with pytest.raises(InvalidEnvironmentError) as excinfo:
        get_config("invalid_env", "protocol_designer")

    assert "Invalid environment 'invalid_env'" in str(excinfo.value)
    assert "sandbox, staging, production" in str(excinfo.value)


def test_get_invalid_application_raises_error():
    """Test that invalid applications raise InvalidApplicationError."""
    with pytest.raises(InvalidApplicationError) as excinfo:
        get_config("sandbox", "invalid_app")

    assert "Invalid application 'invalid_app'" in str(excinfo.value)
    assert "protocol_designer" in str(excinfo.value)


def test_environment_error_message_format():
    """Test that environment error messages are well formatted."""
    with pytest.raises(InvalidEnvironmentError) as excinfo:
        get_config("dev", "protocol_designer")

    error_msg = str(excinfo.value)
    assert "Invalid environment 'dev'" in error_msg
    assert "Valid environments are: sandbox, staging, production" in error_msg


def test_application_error_message_format():
    """Test that application error messages are well formatted."""
    with pytest.raises(InvalidApplicationError) as excinfo:
        get_config("sandbox", "invalid_app")

    error_msg = str(excinfo.value)
    assert "Invalid application 'invalid_app'" in error_msg
    assert "Valid applications are: protocol_designer" in error_msg


def test_main_function():
    """Test that main function runs without error when called with no arguments."""
    # Test that main doesn't crash when called with no arguments (should print config)
    try:
        with patch("sys.argv", ["deploy_config.py"]):  # Simulate no arguments
            main()
    except SystemExit:
        # SystemExit is expected when there are insufficient arguments
        pass
    except Exception as e:
        pytest.fail(f"main() raised an unexpected exception: {e}")


def test_get_deploy_config_with_env_vars():
    """Test that get_deploy_config returns static configuration (env vars not currently used)."""
    # Current implementation uses static configuration, not environment variables
    # This test verifies the actual behavior
    production_designer = get_config("production", "protocol_designer")
    sandbox_designer = get_config("sandbox", "protocol_designer")
    staging_designer = get_config("staging", "protocol_designer")

    # Check that static configuration is returned
    assert production_designer.s3_bucket == "opentrons.production.designer.ot2"
    assert sandbox_designer.s3_bucket == "opentrons.sandbox.designer.ot2"
    assert staging_designer.s3_bucket == "opentrons.staging.designer.ot2"


def test_get_deploy_config_with_defaults():
    """Test that get_deploy_config returns static configuration values."""
    # Current implementation uses static configuration, not environment variables
    # Test via get_config function
    sandbox_designer = get_config("sandbox", "protocol_designer")

    # Check that static configuration values are returned
    assert sandbox_designer.s3_bucket == "opentrons.sandbox.designer.ot2"
    assert sandbox_designer.cloudfront_id is None  # No CloudFront for sandbox


def test_pull_request_with_valid_head_ref():
    """Test pull request event with valid head_ref."""

    evt = parse_github_event_context(
        event_name="pull_request", ref="refs/pull/123/merge", ref_name="123/merge", ref_type="branch", head_ref="feature-branch"
    )

    assert evt.application == "protocol_designer"  # default application
    assert evt.environment == "sandbox"
    assert evt.sandbox_prefix == "feature-branch"

def test_pull_request_with_empty_head_ref():
    """Test pull request event with empty head_ref."""

    evt = parse_github_event_context(
        event_name="pull_request", ref="refs/pull/123/merge", ref_name="123/merge", ref_type="branch", head_ref=""
    )

    assert evt.application == "protocol_designer"
    assert evt.environment == "sandbox"
    assert evt.sandbox_prefix == "unknown"

def test_pull_request_with_none_head_ref():
    """Test pull request event with None head_ref."""

    evt = parse_github_event_context(
        event_name="pull_request", ref="refs/pull/123/merge", ref_name="123/merge", ref_type="branch", head_ref=None
    )

    assert evt.application == "protocol_designer"
    assert evt.environment == "sandbox"
    assert evt.sandbox_prefix == "unknown"

def test_push_branch_event():
    """Test push event to a branch."""

    evt = parse_github_event_context(event_name="push", ref="refs/heads/edge", ref_name="edge", ref_type="branch")

    assert evt.application == "protocol_designer"
    assert evt.environment == "sandbox"
    assert evt.sandbox_prefix == "edge"

def test_push_tag_unrecognized_defaults_to_sandbox():
    """Test push event for unrecognized tag defaults to sandbox."""

    evt = parse_github_event_context(event_name="push", ref="refs/tags/random-tag-name", ref_name="random-tag-name", ref_type="tag")

    assert evt.application == "protocol_designer"  # default application
    assert evt.environment == "sandbox"  # default for unrecognized tags
    assert evt.sandbox_prefix == "random-tag-name"

def test_invalid_event_raises_error():
    """Test that invalid event combinations raise ValueError."""
    with pytest.raises(ValueError) as excinfo:
        parse_github_event_context(event_name="invalid_event", ref="refs/heads/main", ref_name="main", ref_type="branch")

    assert "No deployment configuration found" in str(excinfo.value)
    assert "invalid_event" in str(excinfo.value)

def test_case_sensitivity_head_ref():
    """Test case sensitivity handling for head_ref special values."""
    test_cases = ["", "NULL", "null", "NONE", "none"]

    for head_ref_value in test_cases:
        evt = parse_github_event_context(
            event_name="pull_request", ref="refs/pull/123/merge", ref_name="123/merge", ref_type="branch", head_ref=head_ref_value
        )

        assert evt.application == "protocol_designer"
        assert evt.environment == "sandbox"
        assert evt.sandbox_prefix == "unknown", f"Failed for head_ref: '{head_ref_value}'"


def test_parse_cli_event_args_basic():
    """CLI parser should produce GitHubEventArgs for a push tag scenario."""
    argv = [
        "push",
        "refs/tags/staging-protocol-designer-v1.2.3",
        "staging-protocol-designer-v1.2.3",
        "tag",
    ]
    event = parse_cli_event_args(argv)

    assert event.event_name == "push"
    assert event.ref == "refs/tags/staging-protocol-designer-v1.2.3"
    assert event.ref_name == "staging-protocol-designer-v1.2.3"
    assert event.ref_type == "tag"
    assert event.head_ref is None


def test_determine_deploy_config_from_args_sandbox_branch_url_suffix():
    """Sandbox branch should append branch to base URL and use sandbox labware bucket."""
    event = GitHubEventArgs(
        event_name="push",
        ref="refs/heads/edge",
        ref_name="edge",
        ref_type="branch",
    )

    cfg = determine_deploy_config_from_args(event)

    assert cfg.application == "protocol_designer"
    assert cfg.environment == "sandbox"
    assert cfg.sandbox_prefix == "edge"
    assert cfg.bucket == "opentrons.sandbox.designer.ot2"
    assert cfg.url == "http://ot2.sandbox.designer.opentrons.com/edge/"
