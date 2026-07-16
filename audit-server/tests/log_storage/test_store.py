"""Tests for the audit log store."""

import pytest
from sqlalchemy import select
from sqlalchemy.engine import Engine as SQLEngine
from sqlalchemy.orm import Session

from audit_server.log_storage.models import LogPeriodEntries, UserLogEntry
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
def subject_with_period(db_engine: SQLEngine) -> LogStore:
    """A LogStore with an open period ready for logs."""
    store = LogStore(sql_engine=db_engine)
    store.start_period(
        [
            StoredLog(
                message="starting tests",
                message_hash="asdasd",
                message_sig="ddddd",
                sig_version="1",
            )
        ]
    )
    return store


def test_end_period_handles_ending_with_no_period(
    subject: LogStore,
) -> None:
    """It should raise an exception if ending a period that does not exist."""
    result = subject.end_period(
        [
            StoredLog(
                message="ending",
                message_hash="asdasd",
                message_sig="asdasd",
                sig_version="2",
            )
        ]
    )
    assert isinstance(result, NoActivePeriodError)


def test_start_period_starts_period(subject: LogStore, db_engine: SQLEngine) -> None:
    """It should add a period entry when commanded."""
    start_logs = [
        StoredLog(
            message="starting",
            message_hash="asads",
            message_sig="dddd",
            sig_version="3",
        ),
        StoredLog(
            message="hello", message_hash="", message_sig="fff", sig_version="22"
        ),
        StoredLog(
            message="goodbye", message_hash="afsd", message_sig="iii", sig_version="i+2"
        ),
    ]
    message_hash = subject.start_period(start_logs)
    assert message_hash == "afsd"
    with Session(db_engine) as session:
        periods = session.scalars(select(LogPeriod)).all()
        assert len(periods) == 1
        assert periods[0].ended_at is None
        period = periods[0]
        assert len(period.log_entries) == 3
        assert period.log_entries[0].message == "starting"
        assert period.log_entries[0].message_hash == "asads"
        assert period.log_entries[0].period_ordinal == 0
        assert period.log_entries[0].message_sig == "dddd"
        assert period.log_entries[0].sig_version == "3"

        assert period.log_entries[1].message == "hello"
        assert period.log_entries[1].message_hash == ""
        assert period.log_entries[1].period_ordinal == 1
        assert period.log_entries[1].message_sig == "fff"
        assert period.log_entries[1].sig_version == "22"

        assert period.log_entries[2].message == "goodbye"
        assert period.log_entries[2].message_hash == "afsd"
        assert period.log_entries[2].period_ordinal == 2
        assert period.log_entries[2].message_sig == "iii"
        assert period.log_entries[2].sig_version == "i+2"


def test_end_period_stops_period(
    subject_with_period: LogStore, db_engine: SQLEngine
) -> None:
    """It should close a period entry when commanded."""
    message_hash = subject_with_period.end_period(
        [
            StoredLog(
                message="stopping",
                message_hash="ffff",
                message_sig="zzzz",
                sig_version="11",
            ),
            StoredLog(
                message="hohoho",
                message_hash="lll",
                message_sig="423",
                sig_version="1",
            ),
            StoredLog(
                message="heeheehee",
                message_hash="pppp",
                message_sig="321",
                sig_version="-1",
            ),
        ],
    )
    assert message_hash == "pppp"
    with Session(db_engine) as session:
        period = session.scalar(select(LogPeriod))
        assert period is not None
        assert period.ended_at is not None
        assert len(period.log_entries) == 4
        assert period.log_entries[1].period_ordinal == 1
        assert period.log_entries[1].message == "stopping"
        assert period.log_entries[2].period_ordinal == 2
        assert period.log_entries[2].message == "hohoho"
        assert period.log_entries[3].period_ordinal == 3
        assert period.log_entries[3].message == "heeheehee"


def test_end_period_handles_ending_with_no_active_period(
    subject_with_period: LogStore,
) -> None:
    """It should fail to end a period if periods exist but none are active."""
    end_result = subject_with_period.end_period(
        [
            StoredLog(
                message="stopping",
                message_hash="fffff",
                message_sig="gggg",
                sig_version="32",
            )
        ]
    )
    assert not isinstance(end_result, NoActivePeriodError)
    bad_end_result = subject_with_period.end_period(
        [
            StoredLog(
                message="blublublu",
                message_hash="fhhff",
                message_sig="gllg",
                sig_version="31",
            )
        ]
    )
    assert isinstance(bad_end_result, NoActivePeriodError)


def test_log_to_period(subject_with_period: LogStore, db_engine: SQLEngine) -> None:
    """It should store a log to a period with an appropriate ordinal."""
    stored_hash = subject_with_period.store_log(
        StoredLog(
            message="hello friend",
            message_hash="asdasdasd",
            message_sig="hrhrh",
            sig_version="13",
        )
    )
    assert stored_hash == "asdasdasd"
    with Session(db_engine) as session:
        period = session.scalar(select(LogPeriod))
        assert period is not None
        assert period.ended_at is None
        assert len(period.log_entries) == 2
        assert period.log_entries[-1].period_ordinal == 1
        assert period.log_entries[-1].message == "hello friend"


def test_log_to_period_fails_if_no_period_present(subject: LogStore) -> None:
    """It should fail to store a log if no log period is present."""
    store_result = subject.store_log(
        StoredLog(
            message="asda",
            message_hash="ghghgh",
            message_sig="2314",
            sig_version="1",
        )
    )
    assert isinstance(store_result, NoActivePeriodError)


def test_log_to_period_fails_if_no_period_active(
    subject_with_period: LogStore,
) -> None:
    """It should fail to store a log if no log period is active."""
    end_result = subject_with_period.end_period(
        [
            StoredLog(
                message="ending",
                message_hash="adsa",
                message_sig="31113",
                sig_version="h",
            )
        ]
    )
    assert not isinstance(end_result, NoActivePeriodError)
    store_result = subject_with_period.store_log(
        StoredLog(
            message="asda",
            message_hash="ghghgh",
            message_sig="2314",
            sig_version="1",
        )
    )
    assert isinstance(store_result, NoActivePeriodError)


def test_get_tail_hash(subject_with_period: LogStore) -> None:
    """It should get the hash of the last message in the period."""
    starting_hash = subject_with_period.tail_hash()
    assert isinstance(starting_hash, str)
    assert starting_hash == "asdasd"
    subject_with_period.store_log(
        StoredLog(
            message="hfhfhf", message_hash="zzz", message_sig="4141", sig_version="4"
        )
    )
    new_starting_hash = subject_with_period.tail_hash()
    assert isinstance(new_starting_hash, str)
    assert new_starting_hash == "zzz"


def test_get_tail_hash_fails_if_no_period(subject: LogStore) -> None:
    """It should fail to get the last hash if no period exists."""
    hash_result = subject.tail_hash()
    assert isinstance(hash_result, NoActivePeriodError)


def test_get_tail_hash_fails_if_no_period_active(
    subject_with_period: LogStore,
) -> None:
    """It should fail to get the last hash if no period is active."""
    subject_with_period.end_period(
        [
            StoredLog(
                message="ending",
                message_hash="adsa",
                message_sig="31113",
                sig_version="h",
            )
        ]
    )
    hash_result = subject_with_period.tail_hash()
    assert isinstance(hash_result, NoActivePeriodError)


def test_list_periods_returns_empty_when_no_periods(
    subject: LogStore,
) -> None:
    """It should return an empty list when no periods exist."""
    assert subject.list_periods() == []


def test_list_periods_returns_active_period(
    subject_with_period: LogStore,
) -> None:
    """It should return the active period with endedAt as None."""
    periods = subject_with_period.list_periods()
    assert len(periods) == 1
    assert periods[0].endedAt is None
    assert periods[0].startedAt is not None


def test_list_periods_returns_completed_period(
    subject_with_period: LogStore,
) -> None:
    """It should return a completed period with endedAt set."""
    subject_with_period.end_period(
        [
            StoredLog(
                message="ending",
                message_hash="end_hash",
                message_sig="end_sig",
                sig_version="1",
            )
        ]
    )
    periods = subject_with_period.list_periods()
    assert len(periods) == 1
    assert periods[0].endedAt is not None


def test_list_periods_ordered_oldest_first(
    subject: LogStore,
) -> None:
    """It should return periods ordered with the oldest started_at first."""
    subject.start_period(
        [
            StoredLog(
                message="first", message_hash="h1", message_sig="s1", sig_version="1"
            )
        ]
    )
    subject.end_period(
        [
            StoredLog(
                message="end first",
                message_hash="h2",
                message_sig="s2",
                sig_version="1",
            )
        ]
    )
    subject.start_period(
        [
            StoredLog(
                message="second", message_hash="h3", message_sig="s3", sig_version="1"
            )
        ]
    )

    periods = subject.list_periods()
    assert len(periods) == 2
    assert periods[1].startedAt > periods[0].startedAt
    assert periods[0].endedAt is not None
    assert periods[1].endedAt is None


def test_get_period_entries(
    subject_with_period: LogStore,
) -> None:
    """It should return the period entry for the given period"""
    periods = subject_with_period.list_periods()
    assert len(periods) == 1

    period_id = periods[0].id

    log_period_entry = subject_with_period.get_period_entries(str(period_id))
    assert isinstance(log_period_entry, LogPeriodEntries)
    assert log_period_entry.user_log.user_log_entries == [
        UserLogEntry(
            message="starting tests",
            message_hash="asdasd",
            message_sig="ddddd",
            sig_version="1",
        )
    ]
    assert log_period_entry.user_log.startedAt is not None
    assert log_period_entry.user_log.endedAt is None

    assert log_period_entry.robot_log_entries == []
