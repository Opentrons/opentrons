"""Tests for deploy_config module."""

import os
from unittest.mock import patch

import pytest
from deploy_config import (
    DEFAULT,
    ApplicationConfig,
    InvalidApplicationError,
    InvalidEnvironmentError,
    get_config,
    main,
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
        get_config("sandbox", "docs")

    error_msg = str(excinfo.value)
    assert "Invalid application 'docs'" in error_msg
    assert "Valid applications are: labware_library, protocol_designer" in error_msg


def test_main_function():
    """Test that main function runs without error."""
    # Test that main doesn't crash
    try:
        main()
    except Exception as e:
        pytest.fail(f"main() raised an exception: {e}")


def test_get_deploy_config_with_env_vars():
    """Test that get_deploy_config uses environment variables when available."""
    sandbox_bucket = "test-sandbox-labware-bucket"
    sandbox_cf = "test-sandbox-labware-cf"
    production_bucket = "test-prod-designer-bucket"

    test_env_vars = {
        "SANDBOX_LABWARE_LIBRARY_S3_BUCKET": sandbox_bucket,
        "SANDBOX_LABWARE_LIBRARY_CLOUDFRONT_ID": sandbox_cf,
        "PRODUCTION_PROTOCOL_DESIGNER_S3_BUCKET": production_bucket,
    }

    with patch.dict(os.environ, test_env_vars, clear=False):
        # Test via get_config function
        sandbox_labware = get_config("sandbox", "labware_library")
        production_designer = get_config("production", "protocol_designer")
        sandbox_designer = get_config("sandbox", "protocol_designer")

        # Check that env vars are used
        assert sandbox_labware.s3_bucket == sandbox_bucket
        assert sandbox_labware.cloudfront_id == sandbox_cf
        assert production_designer.s3_bucket == production_bucket

    # Check that defaults are used when env vars not set
    assert sandbox_designer.s3_bucket == "not_set"  # Using DEFAULT constant


def test_get_deploy_config_with_defaults():
    """Test that get_deploy_config uses defaults when no env vars are set."""
    # Clear any existing env vars that might affect the test
    env_vars_to_clear = [
        "SANDBOX_LABWARE_LIBRARY_S3_BUCKET",
        "SANDBOX_LABWARE_LIBRARY_CLOUDFRONT_ID",
        "SANDBOX_PROTOCOL_DESIGNER_S3_BUCKET",
        "SANDBOX_PROTOCOL_DESIGNER_CLOUDFRONT_ID",
    ]

    # Remove the environment variables entirely
    with patch.dict(os.environ, {}, clear=False):
        # Make sure the vars are not in the environment
        for var in env_vars_to_clear:
            os.environ.pop(var, None)

        # Test via get_config function
        sandbox_labware = get_config("sandbox", "labware_library")
        sandbox_designer = get_config("sandbox", "protocol_designer")

        assert sandbox_labware.s3_bucket == DEFAULT
        assert sandbox_labware.cloudfront_id == DEFAULT
        assert sandbox_designer.s3_bucket == DEFAULT
        assert sandbox_designer.cloudfront_id == DEFAULT
