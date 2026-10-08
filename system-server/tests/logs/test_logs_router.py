"""Tests for system-server log routes."""

from collections.abc import Iterator
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import status
from fastapi.testclient import TestClient

from server_utils.audit.audit_server import NoOpClient
from server_utils.audit.fastapi import get_audit_client, install_audit_client
from server_utils.auth.resource_server.authentication_checker import (
    AlwaysAllowedAuthenticationChecker,
    AuthenticationChecker,
)
from server_utils.auth.resource_server.fastapi import (
    get_authentication_checker,
    install_authentication_checker,
)

from system_server.app_setup import app
from system_server.logs.log_control import DEFAULT_RECORDS, MAX_RECORDS


@pytest.fixture
def api_client() -> Iterator[TestClient]:
    """Provide a TestClient with auth and audit stubs installed."""
    authentication_checker = AlwaysAllowedAuthenticationChecker()
    audit_client = NoOpClient()

    async def get_authentication_checker_override() -> AuthenticationChecker:
        return authentication_checker

    def get_audit_client_override() -> NoOpClient:
        return audit_client

    install_authentication_checker(app.state, authentication_checker)
    install_audit_client(app.state, audit_client)
    app.dependency_overrides[get_authentication_checker] = (
        get_authentication_checker_override
    )
    app.dependency_overrides[get_audit_client] = get_audit_client_override

    with TestClient(app, raise_server_exceptions=True) as client:
        yield client

    app.dependency_overrides.pop(get_authentication_checker, None)
    app.dependency_overrides.pop(get_audit_client, None)


def test_get_serial_log_with_defaults(api_client: TestClient) -> None:
    """It should return serial logs with default format and record count."""
    logs = '{"serial": "serial logs"}'
    res_bytes = logs.encode("utf-8")

    with patch(
        "system_server.logs.router.log_control.get_records_dumb",
        new_callable=AsyncMock,
    ) as m:
        m.return_value = res_bytes
        response = api_client.get("/system/logs/serial.log")
        assert response.status_code == status.HTTP_200_OK
        assert response.text == logs
        m.assert_called_once_with("ALL_SERIAL", DEFAULT_RECORDS, "short-precise")


@pytest.mark.parametrize(
    "format_param, records_param, mode_param",
    [
        ("json", MAX_RECORDS - 1, "json"),
        ("text", MAX_RECORDS - 1, "short-precise"),
        ("json", 1, "json"),
        ("text", 1, "short-precise"),
    ],
)
def test_get_serial_log_with_params(
    api_client: TestClient,
    format_param: str,
    records_param: int,
    mode_param: str,
) -> None:
    """It should honor format and records query params."""
    logs = '{"serial": "serial logs"}'
    res_bytes = logs.encode("utf-8")

    with patch(
        "system_server.logs.router.log_control.get_records_dumb",
        new_callable=AsyncMock,
    ) as m:
        m.return_value = res_bytes
        response = api_client.get(
            f"/system/logs/serial.log?format={format_param}&records={records_param}"
        )
        assert response.status_code == status.HTTP_200_OK
        m.assert_called_once_with("ALL_SERIAL", records_param, mode_param)


@pytest.mark.parametrize(
    "format_param, records_param",
    [("json", 0), ("text", MAX_RECORDS + 1), ("invalid", MAX_RECORDS - 1)],
)
def test_get_serial_log_with_invalid_params(
    api_client: TestClient, format_param: str, records_param: int
) -> None:
    """It should reject invalid format or records values."""
    with patch(
        "system_server.logs.router.log_control.get_records_dumb",
        new_callable=AsyncMock,
    ) as m:
        response = api_client.get(
            f"/system/logs/serial.log?format={format_param}&records={records_param}"
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        m.assert_not_called()


def test_post_log_level_local_not_implemented(api_client: TestClient) -> None:
    """It should expose the log level route as not implemented."""
    response = api_client.post(
        "/system/settings/log_level/local", json={"log_level": "debug"}
    )
    assert response.status_code == status.HTTP_501_NOT_IMPLEMENTED
