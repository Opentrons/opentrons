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
    labware_config = get_config("sandbox", "labware_library")
    designer_config = get_config("production", "protocol_designer")

    assert isinstance(labware_config, ApplicationConfig)
    assert isinstance(designer_config, ApplicationConfig)


def test_get_config_case_insensitive():
    """Test that get_config is case insensitive."""
    # Test uppercase
    config1 = get_config("SANDBOX", "LABWARE_LIBRARY")
    config2 = get_config("sandbox", "labware_library")

    # Should get the same values (both use DEFAULT since no env vars set)
    assert config1.s3_bucket == config2.s3_bucket
    assert config1.cloudfront_id == config2.cloudfront_id

    # Test mixed case
    config3 = get_config("Staging", "Protocol_Designer")
    assert isinstance(config3, ApplicationConfig)


def test_get_invalid_environment_raises_error():
    """Test that invalid environments raise InvalidEnvironmentError."""
    with pytest.raises(InvalidEnvironmentError) as excinfo:
        get_config("invalid_env", "labware_library")

    assert "Invalid environment 'invalid_env'" in str(excinfo.value)
    assert "sandbox, staging, production" in str(excinfo.value)


def test_get_invalid_application_raises_error():
    """Test that invalid applications raise InvalidApplicationError."""
    with pytest.raises(InvalidApplicationError) as excinfo:
        get_config("sandbox", "invalid_app")

    assert "Invalid application 'invalid_app'" in str(excinfo.value)
    assert "labware_library, protocol_designer" in str(excinfo.value)


def test_environment_error_message_format():
    """Test that environment error messages are well formatted."""
    with pytest.raises(InvalidEnvironmentError) as excinfo:
        get_config("dev", "labware_library")

    error_msg = str(excinfo.value)
    assert "Invalid environment 'dev'" in error_msg
    assert "Valid environments are: sandbox, staging, production" in error_msg


def test_application_error_message_format():
    """Test that application error messages are well formatted."""
    with pytest.raises(InvalidApplicationError) as excinfo:
        get_config("sandbox", "invalid_app")

    error_msg = str(excinfo.value)
    assert "Invalid application 'invalid_app'" in error_msg
    assert "Valid applications are: labware_library, protocol_designer, docs, mkdocs" in error_msg


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
    sandbox_labware = get_config("sandbox", "labware_library")
    production_designer = get_config("production", "protocol_designer")
    sandbox_designer = get_config("sandbox", "protocol_designer")

    # Check that static configuration is returned
    assert sandbox_labware.s3_bucket == "opentrons.sandbox.labware"
    assert sandbox_labware.cloudfront_id is None  # No CloudFront for sandbox
    assert production_designer.s3_bucket == "opentrons.production.protocol-designer"
    assert sandbox_designer.s3_bucket == "opentrons.sandbox.protocol-designer"


def test_get_deploy_config_with_defaults():
    """Test that get_deploy_config returns static configuration values."""
    # Current implementation uses static configuration, not environment variables
    # Test via get_config function
    sandbox_labware = get_config("sandbox", "labware_library")
    sandbox_designer = get_config("sandbox", "protocol_designer")

    # Check that static configuration values are returned
    assert sandbox_labware.s3_bucket == "opentrons.sandbox.labware"
    assert sandbox_labware.cloudfront_id is None  # No CloudFront for sandbox
    assert sandbox_designer.s3_bucket == "opentrons.sandbox.protocol-designer"
    assert sandbox_designer.cloudfront_id is None  # No CloudFront for sandbox


class TestParseGithubEventContext:
    """Tests for the parse_github_event_context function."""

    def test_pull_request_with_valid_head_ref(self):
        """Test pull request event with valid head_ref."""

    evt = parse_github_event_context(
        event_name="pull_request", ref="refs/pull/123/merge", ref_name="123/merge", ref_type="branch", head_ref="feature-branch"
    )

    assert evt.application == "labware_library"  # default application
    assert evt.environment == "sandbox"
    assert evt.sandbox_prefix == "feature-branch"

    def test_pull_request_with_empty_head_ref(self):
        """Test pull request event with empty head_ref."""

    evt = parse_github_event_context(
        event_name="pull_request", ref="refs/pull/123/merge", ref_name="123/merge", ref_type="branch", head_ref=""
    )

    assert evt.application == "labware_library"
    assert evt.environment == "sandbox"
    assert evt.sandbox_prefix == "unknown"

    def test_pull_request_with_none_head_ref(self):
        """Test pull request event with None head_ref."""

    evt = parse_github_event_context(
        event_name="pull_request", ref="refs/pull/123/merge", ref_name="123/merge", ref_type="branch", head_ref=None
    )

    assert evt.application == "labware_library"
    assert evt.environment == "sandbox"
    assert evt.sandbox_prefix == "unknown"

    def test_push_branch_event(self):
        """Test push event to a branch."""

    evt = parse_github_event_context(event_name="push", ref="refs/heads/edge", ref_name="edge", ref_type="branch")

    assert evt.application == "labware_library"
    assert evt.environment == "sandbox"
    assert evt.sandbox_prefix == "edge"

    def test_push_tag_staging_labware_library(self):
        """Test push event for staging labware library tag."""

    evt = parse_github_event_context(
        event_name="push",
        ref="refs/tags/tmp-staging-labware-library-202509041016",
        ref_name="tmp-staging-labware-library-202509041016",
        ref_type="tag",
    )

    assert evt.application == "labware_library"
    assert evt.environment == "staging"
    assert evt.sandbox_prefix == "tmp-staging-labware-library-202509041016"

    def test_push_tag_production_labware_library(self):
        """Test push event for production labware library tag."""

    evt = parse_github_event_context(
        event_name="push", ref="refs/tags/tmp-labware-library-202509041016", ref_name="tmp-labware-library-202509041016", ref_type="tag"
    )

    assert evt.application == "labware_library"
    assert evt.environment == "production"
    assert evt.sandbox_prefix == "tmp-labware-library-202509041016"

    def test_push_tag_staging_mkdocs(self):
        """Test push event for staging mkdocs tag."""

    evt = parse_github_event_context(
        event_name="push", ref="refs/tags/staging-mkdocs-v1.0.0", ref_name="staging-mkdocs-v1.0.0", ref_type="tag"
    )

    assert evt.application == "mkdocs"
    assert evt.environment == "staging"
    assert evt.sandbox_prefix == "staging-mkdocs-v1.0.0"

    def test_push_tag_production_mkdocs(self):
        """Test push event for production mkdocs tag."""

    evt = parse_github_event_context(event_name="push", ref="refs/tags/mkdocs-v1.0.0", ref_name="mkdocs-v1.0.0", ref_type="tag")

    assert evt.application == "mkdocs"
    assert evt.environment == "production"
    assert evt.sandbox_prefix == "mkdocs-v1.0.0"

    def test_push_tag_staging_docs(self):
        """Test push event for staging docs tag."""

    evt = parse_github_event_context(event_name="push", ref="refs/tags/staging-docs-v1.0.0", ref_name="staging-docs-v1.0.0", ref_type="tag")

    assert evt.application == "docs"
    assert evt.environment == "staging"
    assert evt.sandbox_prefix == "staging-docs-v1.0.0"

    def test_push_tag_production_docs(self):
        """Test push event for production docs tag."""

    evt = parse_github_event_context(event_name="push", ref="refs/tags/docs-v1.0.0", ref_name="docs-v1.0.0", ref_type="tag")

    assert evt.application == "docs"
    assert evt.environment == "production"
    assert evt.sandbox_prefix == "docs-v1.0.0"

    def test_push_tag_unrecognized_defaults_to_sandbox(self):
        """Test push event for unrecognized tag defaults to sandbox."""

    evt = parse_github_event_context(event_name="push", ref="refs/tags/random-tag-name", ref_name="random-tag-name", ref_type="tag")

    assert evt.application == "labware_library"  # default application
    assert evt.environment == "sandbox"  # default for unrecognized tags
    assert evt.sandbox_prefix == "random-tag-name"

    def test_branch_based_application_detection_mkdocs(self):
        """Test branch-based application detection defaults to labware_library (not implemented yet)."""
        # Note: Branch-based application detection is not yet implemented
        # Currently defaults to labware_library for all branch events

    evt = parse_github_event_context(
        event_name="push", ref="refs/heads/mkdocs-new-workflow", ref_name="mkdocs-new-workflow", ref_type="branch"
    )

    assert evt.application == "labware_library"  # Default application (branch detection not implemented)
    assert evt.environment == "sandbox"
    assert evt.sandbox_prefix == "mkdocs-new-workflow"

    def test_branch_based_application_detection_docs(self):
        """Test branch-based application detection defaults to labware_library (not implemented yet)."""
        # Note: Branch-based application detection is not yet implemented
        # Currently defaults to labware_library for all branch events

    evt = parse_github_event_context(event_name="push", ref="refs/heads/docs-deploy", ref_name="docs-deploy", ref_type="branch")

    assert evt.application == "labware_library"  # Default application (branch detection not implemented)
    assert evt.environment == "sandbox"
    assert evt.sandbox_prefix == "docs-deploy"

    def test_invalid_event_raises_error(self):
        """Test that invalid event combinations raise ValueError."""
        with pytest.raises(ValueError) as excinfo:
            parse_github_event_context(event_name="invalid_event", ref="refs/heads/main", ref_name="main", ref_type="branch")

        assert "No deployment configuration found" in str(excinfo.value)
        assert "invalid_event" in str(excinfo.value)

    def test_tag_prefixes_labware_library(self):
        """Test various tag prefixes for labware library application detection."""
        test_cases = ["tmp-staging-labware-library-123", "staging-labware-library-456", "tmp-labware-library-789", "labware-library-abc"]

        for tag_name in test_cases:
            evt = parse_github_event_context(event_name="push", ref=f"refs/tags/{tag_name}", ref_name=tag_name, ref_type="tag")

            assert evt.application == "labware_library", f"Failed for tag: {tag_name}"

    def test_case_sensitivity_head_ref(self):
        """Test case sensitivity handling for head_ref special values."""
        test_cases = ["", "NULL", "null", "NONE", "none"]

        for head_ref_value in test_cases:
            evt = parse_github_event_context(
                event_name="pull_request", ref="refs/pull/123/merge", ref_name="123/merge", ref_type="branch", head_ref=head_ref_value
            )

            assert evt.application == "labware_library"
            assert evt.environment == "sandbox"
            assert evt.sandbox_prefix == "unknown", f"Failed for head_ref: '{head_ref_value}'"


def test_parse_cli_event_args_basic():
    """CLI parser should produce GitHubEventArgs for a push tag scenario."""
    argv = [
        "push",
        "refs/tags/staging-mkdocs-v1.2.3",
        "staging-mkdocs-v1.2.3",
        "tag",
    ]
    event = parse_cli_event_args(argv)

    assert event.event_name == "push"
    assert event.ref == "refs/tags/staging-mkdocs-v1.2.3"
    assert event.ref_name == "staging-mkdocs-v1.2.3"
    assert event.ref_type == "tag"
    assert event.head_ref is None


def test_determine_deploy_config_from_args_staging_mkdocs():
    """End-to-end: staging mkdocs tag resolves to staging docs bucket and URL."""
    event = GitHubEventArgs(
        event_name="push",
        ref="refs/tags/staging-mkdocs-v1.2.3",
        ref_name="staging-mkdocs-v1.2.3",
        ref_type="tag",
    )

    cfg = determine_deploy_config_from_args(event)

    assert cfg.application == "mkdocs"
    assert cfg.environment == "staging"
    assert cfg.sandbox_prefix == "staging-mkdocs-v1.2.3"
    assert cfg.bucket == "opentrons.staging.docs"
    assert cfg.url == "https://staging.docs.opentrons.com/"
    assert cfg.cloudfront_id == "E8IWASMDOWHYP"


def test_determine_deploy_config_from_args_sandbox_branch_url_suffix():
    """Sandbox branch should append branch to base URL and use sandbox labware bucket."""
    event = GitHubEventArgs(
        event_name="push",
        ref="refs/heads/edge",
        ref_name="edge",
        ref_type="branch",
    )

    cfg = determine_deploy_config_from_args(event)

    assert cfg.application == "labware_library"
    assert cfg.environment == "sandbox"
    assert cfg.sandbox_prefix == "edge"
    assert cfg.bucket == "opentrons.sandbox.labware"
    assert cfg.url == "http://opentrons.sandbox.labware.s3-website.us-east-2.amazonaws.com/edge/"
