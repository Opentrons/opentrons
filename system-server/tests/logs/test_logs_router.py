"""Tests for system-server log routes."""

from collections.abc import Iterator

import pytest
from decoy import Decoy
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
from system_server.logs import journald, log_control
from system_server.logs.log_control import DEFAULT_RECORDS, MAX_RECORDS
from system_server.logs.models import LogLevels


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


async def test_get_serial_log_with_defaults(
    api_client: TestClient, decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """It should return serial logs with default format and record count."""
    logs = '{"serial": "serial logs"}'
    res_bytes = logs.encode("utf-8")
    mock_get_records = decoy.mock(func=log_control.get_records_dumb)
    monkeypatch.setattr(log_control, "get_records_dumb", mock_get_records)

    decoy.when(
        await mock_get_records("ALL_SERIAL", DEFAULT_RECORDS, "short-precise")
    ).then_return(res_bytes)

    response = api_client.get("/system/logs/serial.log")
    assert response.status_code == status.HTTP_200_OK
    assert response.text == logs


@pytest.mark.parametrize(
    "format_param, records_param, mode_param",
    [
        ("json", MAX_RECORDS - 1, "json"),
        ("text", MAX_RECORDS - 1, "short-precise"),
        ("json", 1, "json"),
        ("text", 1, "short-precise"),
    ],
)
async def test_get_serial_log_with_params(
    api_client: TestClient,
    decoy: Decoy,
    monkeypatch: pytest.MonkeyPatch,
    format_param: str,
    records_param: int,
    mode_param: str,
) -> None:
    """It should honor format and records query params."""
    logs = '{"serial": "serial logs"}'
    res_bytes = logs.encode("utf-8")
    mock_get_records = decoy.mock(func=log_control.get_records_dumb)
    monkeypatch.setattr(log_control, "get_records_dumb", mock_get_records)

    decoy.when(
        await mock_get_records("ALL_SERIAL", records_param, mode_param)
    ).then_return(res_bytes)

    response = api_client.get(
        f"/system/logs/serial.log?format={format_param}&records={records_param}"
    )
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.parametrize(
    "format_param, records_param",
    [("json", 0), ("text", MAX_RECORDS + 1), ("invalid", MAX_RECORDS - 1)],
)
def test_get_serial_log_with_invalid_params(
    api_client: TestClient,
    decoy: Decoy,
    monkeypatch: pytest.MonkeyPatch,
    format_param: str,
    records_param: int,
) -> None:
    """It should reject invalid format or records values."""
    mock_get_records = decoy.mock(func=log_control.get_records_dumb)
    monkeypatch.setattr(log_control, "get_records_dumb", mock_get_records)

    response = api_client.get(
        f"/system/logs/serial.log?format={format_param}&records={records_param}"
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.parametrize(
    "body_level",
    ["debug", "info", "warning", "error", "deBug", "ERROR"],
)
def test_post_log_level_local(
    api_client: TestClient,
    decoy: Decoy,
    monkeypatch: pytest.MonkeyPatch,
    body_level: str,
) -> None:
    """It should accept a log level and configure journald."""
    mock_set = decoy.mock(func=journald.set_max_level_store)
    monkeypatch.setattr(journald, "set_max_level_store", mock_set)
    expected_level = LogLevels(body_level.lower())  # type: ignore[call-arg]

    decoy.when(mock_set(expected_level)).then_return(expected_level.value)

    response = api_client.post(
        "/system/settings/log_level/local", json={"log_level": body_level}
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"message": f"log_level set to {body_level.lower()}"}


@pytest.mark.parametrize(
    "body",
    [{}, {"log_level": None}, {"log_level": "not-a-level"}],
)
def test_post_log_level_local_invalid(
    api_client: TestClient,
    decoy: Decoy,
    monkeypatch: pytest.MonkeyPatch,
    body: dict[str, object],
) -> None:
    """It should reject missing or invalid log levels."""
    mock_set = decoy.mock(func=journald.set_max_level_store)
    monkeypatch.setattr(journald, "set_max_level_store", mock_set)

    response = api_client.post("/system/settings/log_level/local", json=body)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_post_log_level_local_journald_failure(
    api_client: TestClient, decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """It should return 500 when journald configuration fails."""
    mock_set = decoy.mock(func=journald.set_max_level_store)
    monkeypatch.setattr(journald, "set_max_level_store", mock_set)

    decoy.when(mock_set(LogLevels.info)).then_raise(OSError("permission denied"))

    response = api_client.post(
        "/system/settings/log_level/local", json={"log_level": "info"}
    )

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
