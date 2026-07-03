"""Unit tests for the audit-server settings routes."""

from __future__ import annotations

from pathlib import Path
from typing import Generator

import pytest
from fastapi import FastAPI
from starlette.testclient import TestClient

from audit_server.persistence.database import create_schema, sql_engine_ctx
from audit_server.persistence.fastapi_dependencies import set_sql_engine
from audit_server.settings.router import router as settings_router
from audit_server.settings.store import SettingsStore, install_settings_store

_LOGGING_ENABLED_PATH = "/audit/internal/loggingEnabled"
_SETTINGS_PATH = "/audit/external/settings"


@pytest.fixture
def client(tmp_path: Path) -> Generator[TestClient, None, None]:
    """A TestClient for an app wired up with a real settings store."""
    db_path = tmp_path / "test_audit.db"
    with sql_engine_ctx(db_path) as engine:
        create_schema(engine)
        app = FastAPI()
        set_sql_engine(app.state, engine)
        install_settings_store(app.state, SettingsStore(sql_engine=engine))
        app.include_router(settings_router)
        with TestClient(app) as test_client:
            yield test_client


def test_get_logging_enabled_defaults_to_false(client: TestClient) -> None:
    """GET loggingEnabled returns False before it's ever set."""
    response = client.get(_LOGGING_ENABLED_PATH)
    assert response.status_code == 200
    assert response.json()["data"] == {"loggingEnabled": False}


def test_patch_logging_enabled_round_trips(client: TestClient) -> None:
    """PATCHing loggingEnabled to True is returned and reflected on a later GET."""
    response = client.patch(
        _LOGGING_ENABLED_PATH, json={"data": {"loggingEnabled": True}}
    )
    assert response.status_code == 200
    assert response.json()["data"] == {"loggingEnabled": True}

    response = client.get(_LOGGING_ENABLED_PATH)
    assert response.json()["data"] == {"loggingEnabled": True}


def test_patch_logging_enabled_can_disable(client: TestClient) -> None:
    """loggingEnabled can be turned back off via PATCH."""
    client.patch(_LOGGING_ENABLED_PATH, json={"data": {"loggingEnabled": True}})
    response = client.patch(
        _LOGGING_ENABLED_PATH, json={"data": {"loggingEnabled": False}}
    )
    assert response.status_code == 200
    assert response.json()["data"] == {"loggingEnabled": False}


def test_get_settings_returns_defaults(client: TestClient) -> None:
    """GET generic settings returns the (currently empty) defaults."""
    response = client.get(_SETTINGS_PATH)
    assert response.status_code == 200
    assert response.json()["data"] == {}


def test_patch_settings_returns_settings(client: TestClient) -> None:
    """PATCH generic settings with an empty body returns the settings."""
    response = client.patch(_SETTINGS_PATH, json={"data": {}})
    assert response.status_code == 200
    assert response.json()["data"] == {}


def test_delete_settings_resets(client: TestClient) -> None:
    """DELETE generic settings resets them and returns the defaults."""
    response = client.delete(_SETTINGS_PATH)
    assert response.status_code == 200
    assert response.json()["data"] == {}
