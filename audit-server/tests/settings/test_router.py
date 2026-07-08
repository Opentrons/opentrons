"""Unit tests for the audit-server settings routes."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Generator, cast

import pytest
from decoy import Decoy, matchers
from fastapi import FastAPI
from starlette.testclient import TestClient

from server_utils.fastapi_utils.models.json_api import RequestModel

from .. import LogPayloadMatcher, RecentTimestampMatcher
from audit_server.log_ingest.models import SubmitAuditLogMessageData
from audit_server.log_storage.log_data_manager import LogDataManager
from audit_server.persistence.database import create_schema, sql_engine_ctx
from audit_server.persistence.fastapi_dependencies import set_sql_engine
from audit_server.settings.models import PatchLoggingEnabledRequestData
from audit_server.settings.router import (
    get_logging_enabled_settings,
    patch_logging_enabled_settings,
)
from audit_server.settings.router import (
    router as settings_router,
)
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


@pytest.fixture
def mock_store(decoy: Decoy) -> SettingsStore:
    return decoy.mock(cls=SettingsStore)


@pytest.fixture
def mock_log_data_manager(decoy: Decoy) -> LogDataManager:
    return decoy.mock(cls=LogDataManager)


async def test_get_logging_enabled(mock_store: SettingsStore, decoy: Decoy) -> None:
    """GET loggingEnabled returns False before it's ever set."""
    decoy.when(mock_store.get_logging_enabled()).then_return(True)
    result = await get_logging_enabled_settings(settings_store=mock_store)
    assert result.content.data.loggingEnabled is True
    assert result.status_code == 200
    decoy.when(mock_store.get_logging_enabled()).then_return(False)
    result = await get_logging_enabled_settings(settings_store=mock_store)
    assert result.content.data.loggingEnabled is False
    assert result.status_code == 200


async def test_patch_logging_enabled_logs_when_disabling(
    mock_store: SettingsStore, mock_log_data_manager: LogDataManager, decoy: Decoy
) -> None:
    """It should disable logging and store a log first."""
    decoy.when(mock_store.get_logging_enabled()).then_return(True)
    decoy.when(mock_store.patch_logging_enabled(False)).then_return(False)
    decoy.when(
        await mock_log_data_manager.store_log(
            cast(
                Any,
                LogPayloadMatcher(
                    SubmitAuditLogMessageData(
                        action="log-disable",
                        accountName="alice",
                        legalName="Alice",
                        message="Logging was disabled.",
                        reason="i wanted to",
                    ),
                    loggedAt=RecentTimestampMatcher(),
                ),
            )
        )
    ).then_return("")
    response = await patch_logging_enabled_settings(
        request_body=RequestModel(
            data=PatchLoggingEnabledRequestData(
                loggingEnabled=False,
                accountName="alice",
                legalName="Alice",
                reason="i wanted to",
            )
        ),
        settings_store=mock_store,
        log_data_manager=mock_log_data_manager,
    )

    assert response.status_code == 200
    assert response.content.data.loggingEnabled is False
    decoy.verify(await mock_log_data_manager.rotate_periods(), times=0)


async def test_patch_logging_enabled_rotates_and_logs_when_enabling(
    mock_store: SettingsStore, mock_log_data_manager: LogDataManager, decoy: Decoy
) -> None:
    """It should enable logging and then rotate and log."""
    decoy.when(mock_store.get_logging_enabled()).then_return(False)
    decoy.when(mock_store.patch_logging_enabled(True)).then_return(True)
    decoy.when(
        await mock_log_data_manager.store_log(
            cast(
                Any,
                LogPayloadMatcher(
                    SubmitAuditLogMessageData(
                        action="log-enable",
                        accountName="alice",
                        legalName="Alice",
                        message="Logging was enabled.",
                        reason="i wanted to",
                    ),
                    loggedAt=RecentTimestampMatcher(),
                ),
            )
        )
    ).then_return("")
    response = await patch_logging_enabled_settings(
        request_body=RequestModel(
            data=PatchLoggingEnabledRequestData(
                loggingEnabled=True,
                accountName="alice",
                legalName="Alice",
                reason="i wanted to",
            )
        ),
        settings_store=mock_store,
        log_data_manager=mock_log_data_manager,
    )
    assert response.status_code == 200
    assert response.content.data.loggingEnabled is True
    decoy.verify(await mock_log_data_manager.rotate_periods(), times=1)


async def test_patch_logging_enabled_noops_if_no_change(
    mock_store: SettingsStore, mock_log_data_manager: LogDataManager, decoy: Decoy
) -> None:
    decoy.when(mock_store.get_logging_enabled()).then_return(False)
    decoy.when(mock_store.patch_logging_enabled(False)).then_return(False)
    response = await patch_logging_enabled_settings(
        request_body=RequestModel(
            data=PatchLoggingEnabledRequestData(
                loggingEnabled=False,
                accountName="alice",
                legalName="Alice",
                reason="i wanted to",
            )
        ),
        settings_store=mock_store,
        log_data_manager=mock_log_data_manager,
    )
    assert response.status_code == 200
    assert response.content.data.loggingEnabled is False
    decoy.verify(await mock_log_data_manager.store_log(matchers.Anything()), times=0)
    decoy.verify(await mock_log_data_manager.rotate_periods(), times=0)
    decoy.when(mock_store.get_logging_enabled()).then_return(True)
    decoy.when(mock_store.patch_logging_enabled(True)).then_return(True)
    response = await patch_logging_enabled_settings(
        request_body=RequestModel(
            data=PatchLoggingEnabledRequestData(
                loggingEnabled=True,
                accountName="alice",
                legalName="Alice",
                reason="i wanted to",
            )
        ),
        settings_store=mock_store,
        log_data_manager=mock_log_data_manager,
    )
    assert response.status_code == 200
    assert response.content.data.loggingEnabled is True
    decoy.verify(await mock_log_data_manager.store_log(matchers.Anything()), times=0)
    decoy.verify(await mock_log_data_manager.rotate_periods(), times=0)


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
