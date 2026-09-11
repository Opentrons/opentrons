"""Tests for otupdate.common.cli."""

import pytest

from otupdate.common import cli


def test_auth_server_location_defaults_to_unset() -> None:
    """Neither option is set unless asked for, so the caller can pick a default."""
    args = cli.build_root_parser().parse_args([])

    assert args.auth_server_uds is None
    assert args.auth_server_url is None


def test_auth_server_uds() -> None:
    args = cli.build_root_parser().parse_args(["--auth-server-uds", "/run/auth.sock"])

    assert args.auth_server_uds == "/run/auth.sock"
    assert args.auth_server_url is None


def test_auth_server_url() -> None:
    args = cli.build_root_parser().parse_args(
        ["--auth-server-url", "http://localhost:1234"]
    )

    assert args.auth_server_uds is None
    assert args.auth_server_url == "http://localhost:1234"


def test_auth_server_uds_and_url_are_mutually_exclusive() -> None:
    """auth-server can only be reached one way, so asking for both is an error."""
    with pytest.raises(SystemExit):
        cli.build_root_parser().parse_args(
            [
                "--auth-server-uds",
                "/run/auth.sock",
                "--auth-server-url",
                "http://localhost:1234",
            ]
        )
