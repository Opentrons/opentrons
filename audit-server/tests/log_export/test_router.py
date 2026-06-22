"""Unit tests for the `GET /audit/external/logPeriods` route."""

from __future__ import annotations

from pathlib import Path
from typing import AsyncGenerator, Generator

import pytest
from fastapi import FastAPI
from starlette.testclient import TestClient

from audit_server.log_export.router import router as log_export_router
from audit_server.log_storage.store import LogStore
from audit_server.log_storage.types import StoredLog
from audit_server.persistence.database import create_schema, sql_engine_ctx
from audit_server.persistence.fastapi_dependencies import set_sql_engine

_ENDPOINT_PATH = "/audit/external/logPeriods"


@pytest.fixture
def client(tmp_path: Path) -> Generator[TestClient, None, None]:
    """A TestClient for an app wired up with a real LogStore and database."""
    db_path = tmp_path / "test_audit.db"
    with sql_engine_ctx(db_path) as engine:
        create_schema(engine)
        app = FastAPI()
        set_sql_engine(app.state, engine)
        app.include_router(log_export_router)
        with TestClient(app) as test_client:
            yield test_client


@pytest.fixture
async def client_with_periods(tmp_path: Path) -> AsyncGenerator[TestClient, None]:
    """A TestClient pre-populated with one completed and one active log period."""
    db_path = tmp_path / "test_audit.db"
    with sql_engine_ctx(db_path) as engine:
        create_schema(engine)
        store = LogStore(sql_engine=engine)

        # First period: completed
        await store.start_period(
            StoredLog(
                message="p1 start", message_hash="h1", message_sig="s1", sig_version="1"
            )
        )
        await store.end_period(
            StoredLog(
                message="p1 end", message_hash="h2", message_sig="s2", sig_version="1"
            )
        )

        # Second period: still active
        await store.start_period(
            StoredLog(
                message="p2 start", message_hash="h3", message_sig="s3", sig_version="1"
            )
        )

        app = FastAPI()
        set_sql_engine(app.state, engine)
        app.include_router(log_export_router)
        with TestClient(app) as test_client:
            yield test_client


def test_get_log_periods_empty(client: TestClient) -> None:
    """GET logPeriods returns an empty list when no periods exist."""
    response = client.get(_ENDPOINT_PATH)
    assert response.status_code == 200
    body = response.json()
    assert body["data"] == []
    assert body["meta"]["totalLength"] == 0


def test_get_log_periods_returns_periods(
    client_with_periods: TestClient,
) -> None:
    """GET logPeriods returns all periods."""
    response = client_with_periods.get(_ENDPOINT_PATH)
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) == 2


def test_get_log_periods_newest_first(
    client_with_periods: TestClient,
) -> None:
    """GET logPeriods returns periods ordered newest first."""
    response = client_with_periods.get(_ENDPOINT_PATH)
    data = response.json()["data"]
    assert len(data) == 2
    # Active period (started second) should be first
    assert data[0]["endedAt"] is None
    assert data[1]["endedAt"] is not None


def test_get_log_periods_active_period_has_null_ended_at(
    client_with_periods: TestClient,
) -> None:
    """An in-progress period must have endedAt: null."""
    response = client_with_periods.get(_ENDPOINT_PATH)
    active = next(p for p in response.json()["data"] if p["endedAt"] is None)
    assert active is not None
    assert active["startedAt"] is not None


def test_get_log_periods_completed_period_has_ended_at(
    client_with_periods: TestClient,
) -> None:
    """A completed period must have a non-null endedAt."""
    response = client_with_periods.get(_ENDPOINT_PATH)
    completed = next(p for p in response.json()["data"] if p["endedAt"] is not None)
    assert completed is not None


def test_get_log_periods_ids_are_strings(
    client_with_periods: TestClient,
) -> None:
    """Period IDs in the response must be strings."""
    response = client_with_periods.get(_ENDPOINT_PATH)
    for period in response.json()["data"]:
        assert isinstance(period["id"], str)


def test_get_log_periods_response_shape(
    client_with_periods: TestClient,
) -> None:
    """Each period in the response must have exactly the expected fields."""
    response = client_with_periods.get(_ENDPOINT_PATH)
    for period in response.json()["data"]:
        assert set(period.keys()) == {"id", "startedAt", "endedAt"}
