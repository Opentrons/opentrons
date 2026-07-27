"""Tests for the deletion-key store."""

import pytest
from sqlalchemy import select
from sqlalchemy.engine import Engine as SQLEngine
from sqlalchemy.orm import Session

from audit_server.deletion_keys.store import DeletionKeyStore
from audit_server.log_storage.store import LogStore
from audit_server.log_storage.types import StoredLog
from audit_server.persistence.orm_models import DeletionKey


@pytest.fixture
def subject(db_engine: SQLEngine) -> DeletionKeyStore:
    """A DeletionKeyStore backed by a fresh test database."""
    return DeletionKeyStore(sql_engine=db_engine)


@pytest.fixture
def log_period_id(db_engine: SQLEngine) -> int:
    """Create a log period and return its id, so deletion keys can link to it."""
    log_store = LogStore(sql_engine=db_engine)
    log_store.start_period(
        [
            StoredLog(
                message="starting tests",
                message_hash="hash",
                message_sig="sig",
                sig_version="1",
            )
        ]
    )
    return log_store.list_periods()[0].id


def test_create_deletion_key_persists_row(
    subject: DeletionKeyStore, log_period_id: int, db_engine: SQLEngine
) -> None:
    """It should mint a non-empty key and persist a linked row."""
    key = subject.create_deletion_key(
        foreign_id=log_period_id, foreign_type="logPeriod"
    )

    assert key

    with Session(db_engine) as session:
        rows = session.scalars(select(DeletionKey)).all()
        assert len(rows) == 1
        assert rows[0].deletion_key == key
        assert rows[0].foreign_id == log_period_id
        assert rows[0].foreign_type == "logPeriod"


def test_create_deletion_key_appends_distinct_keys(
    subject: DeletionKeyStore, log_period_id: int, db_engine: SQLEngine
) -> None:
    """Each call should append a new, distinct key for the same record."""
    first = subject.create_deletion_key(
        foreign_id=log_period_id, foreign_type="logPeriod"
    )
    second = subject.create_deletion_key(
        foreign_id=log_period_id, foreign_type="logPeriod"
    )

    assert first != second

    with Session(db_engine) as session:
        rows = session.scalars(select(DeletionKey)).all()
        assert {row.deletion_key for row in rows} == {first, second}
        assert all(row.foreign_id == log_period_id for row in rows)
