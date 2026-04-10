"""Tests for server_utils.settings_utils."""

import os
from pathlib import Path

import pytest
from mock import patch

from server_utils.settings_utils import get_dot_env_path


@pytest.fixture
def env_file(tmp_path: Path) -> Path:
    """Create a temporary .env file."""
    p = tmp_path / ".env"
    p.write_text("MY_TEST_VAR=from_dotenv\n")
    return p


def test_returns_none_when_env_var_not_set() -> None:
    """When no dot_env_path env var is set, return None."""
    result = get_dot_env_path("OT_TEST_SERVER_")
    assert result is None


def test_returns_path_when_env_var_is_set(env_file: Path) -> None:
    """When the prefixed dot_env_path env var is set, return that path."""
    with patch.dict(
        os.environ, {"OT_TEST_SERVER_dot_env_path": str(env_file)}, clear=False
    ):
        result = get_dot_env_path("OT_TEST_SERVER_")
    assert result == str(env_file)


def test_respects_env_prefix() -> None:
    """Only the env var with the correct prefix is read."""
    with patch.dict(
        os.environ,
        {"OT_OTHER_SERVER_dot_env_path": "/some/path"},
        clear=False,
    ):
        result = get_dot_env_path("OT_MY_SERVER_")
    assert result is None


def test_does_not_modify_os_environ(env_file: Path) -> None:
    """The function should not call load_dotenv or modify os.environ."""
    with patch.dict(
        os.environ,
        {"OT_TEST_SERVER_dot_env_path": str(env_file)},
        clear=False,
    ):
        get_dot_env_path("OT_TEST_SERVER_")
        assert "MY_TEST_VAR" not in os.environ
