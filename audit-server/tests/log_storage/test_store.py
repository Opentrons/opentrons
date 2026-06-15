"""Tests for the audit log store."""

import pytest
from sqlalchemy import select
from sqlalchemy.engine import Engine as SQLEngine
from sqlalchemy.orm import Session

from audit_server.log_storage.store import (
    LogStore,
    NoActivePeriodError,
)
from audit_server.log_storage.types import StoredLog
from audit_server.persistence.orm_models import LogPeriod


@pytest.fixture
def subject(db_engine: SQLEngine) -> LogStore:
    """A LogStore backed by a fresh test database."""
    return LogStore(sql_engine=db_engine)


@pytest.fixture
async def subject_with_period(db_engine: SQLEngine) -> LogStore:
    """A LogStore with an open period ready for logs."""
    store = LogStore(sql_engine=db_engine)
    await store.start_period(
        StoredLog(
            message="starting tests",
            message_hash="asdasd",
            message_sig="ddddd",
            sig_version="1",
        )
    )
    return store


async def test_end_period_raises_if_ending_nonexistent_period(
    subject: LogStore,
) -> None:
    """It should raise an exception if ending a period that does not exist."""
    with pytest.raises(NoActivePeriodError):
        await subject.end_period(
            StoredLog(
                message="ending",
                message_hash="asdasd",
                message_sig="asdasd",
                sig_version="2",
            )
        )


async def test_start_period_starts_period(
    subject: LogStore, db_engine: SQLEngine
) -> None:
    """It should add a period entry when commanded."""
    start_log = StoredLog(
        message="starting", message_hash="asads", message_sig="dddd", sig_version="3"
    )
    await subject.start_period(start_log)
    with Session(db_engine) as session:
        periods = session.scalars(select(LogPeriod)).all()
        assert len(periods) == 1
        assert len(periods[0].log_entries) == 1
        assert periods[0].log_entries[0].message == "starting"
        assert periods[0].log_entries[0].message_hash == "asads"
        assert periods[0].ended_at is None
        assert periods[0].log_entries[0].period_ordinal == 0


async def test_end_period_stops_period(
    subject_with_period: LogStore, db_engine: SQLEngine
) -> None:
    """It should close a period entry when commanded."""
    await subject_with_period.end_period(
        StoredLog(
            message="stopping",
            message_hash="ffff",
            message_sig="zzzz",
            sig_version="11",
        )
    )
    with Session(db_engine) as session:
        period = session.scalar(select(LogPeriod))
        assert period is not None
        assert period.ended_at is not None
        assert len(period.log_entries) == 2
        assert period.log_entries[-1].period_ordinal == 1
        assert period.log_entries[-1].message == "stopping"


async def test_end_period_with_no_period_raises(subject: LogStore) -> None:
    """It should fail to end a period if no period exists."""
    with pytest.raises(NoActivePeriodError):
        await subject.end_period(
            StoredLog(
                message="no log here",
                message_hash="fff",
                message_sig="zzz",
                sig_version="11",
            )
        )


async def test_end_period_with_no_active_period_raises(
    subject_with_period: LogStore,
) -> None:
    """It should fail to end a period if periods exist but none are active."""
    await subject_with_period.end_period(
        StoredLog(
            message="stopping",
            message_hash="fffff",
            message_sig="gggg",
            sig_version="32",
        )
    )
    with pytest.raises(NoActivePeriodError):
        await subject_with_period.end_period(
            StoredLog(
                message="blublublu",
                message_hash="fhhff",
                message_sig="gllg",
                sig_version="31",
            )
        )


async def test_log_to_period(
    subject_with_period: LogStore, db_engine: SQLEngine
) -> None:
    """It should store a log to a period with an appropriate ordinal."""
    await subject_with_period.store_log(
        StoredLog(
            message="hello friend",
            message_hash="asdasdasd",
            message_sig="hrhrh",
            sig_version="13",
        )
    )
    with Session(db_engine) as session:
        period = session.scalar(select(LogPeriod))
        assert period is not None
        assert period.ended_at is None
        assert len(period.log_entries) == 2
        assert period.log_entries[-1].period_ordinal == 1
        assert period.log_entries[-1].message == "hello friend"


async def test_log_to_period_fails_if_no_period_present(subject: LogStore) -> None:
    """It should fail to store a log if no log period is present."""
    with pytest.raises(NoActivePeriodError):
        await subject.store_log(
            StoredLog(
                message="asda",
                message_hash="ghghgh",
                message_sig="2314",
                sig_version="1",
            )
        )


async def test_log_to_period_fails_if_no_period_active(
    subject_with_period: LogStore,
) -> None:
    """It should fail to store a log if no log period is active."""
    await subject_with_period.end_period(
        StoredLog(
            message="ending", message_hash="adsa", message_sig="31113", sig_version="h"
        )
    )
    with pytest.raises(NoActivePeriodError):
        await subject_with_period.store_log(
            StoredLog(
                message="asda",
                message_hash="ghghgh",
                message_sig="2314",
                sig_version="1",
            )
        )


async def test_get_tail_hash(subject_with_period: LogStore) -> None:
    """It should get the hash of the last message in the period."""
    starting_hash = await subject_with_period.tail_hash()
    assert starting_hash == "asdasd"
    await subject_with_period.store_log(
        StoredLog(
            message="hfhfhf", message_hash="zzz", message_sig="4141", sig_version="4"
        )
    )
    new_starting_hash = await subject_with_period.tail_hash()
    assert new_starting_hash == "zzz"


async def test_get_tail_hash_fails_if_no_period(subject: LogStore) -> None:
    """It should fail to get the last hash if no period exists."""
    with pytest.raises(NoActivePeriodError):
        await subject.tail_hash()


async def test_get_tail_hash_fails_if_no_period_active(
    subject_with_period: LogStore,
) -> None:
    """It should fail to get the last hash if no period is active."""
    await subject_with_period.end_period(
        StoredLog(
            message="ending", message_hash="adsa", message_sig="31113", sig_version="h"
        )
    )
    with pytest.raises(NoActivePeriodError):
        await subject_with_period.tail_hash()
