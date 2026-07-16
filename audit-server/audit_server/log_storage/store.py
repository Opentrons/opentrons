"""Code for managing log storage and export."""

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.engine import Engine as SQLEngine
from sqlalchemy.orm import Session, sessionmaker

from .models import (
    LogPeriodEntries,
    LogPeriodSummary,
    RobotLogPaths,
    UserLogEntry,
    UserLogForExport,
)
from .types import StoredLog
from audit_server.persistence.orm_models import LogEntry, LogPeriod


class NoLogInPeriodError(Exception):
    """A log period has no logs associated."""


class NoActivePeriodError(Exception):
    """There is no currently-active log period."""


class LogStore:
    """Manages log storage and export operations."""

    def __init__(self, sql_engine: SQLEngine) -> None:
        """Initialize the database connection details."""
        self._sql_engine = sql_engine
        self._session_factory = sessionmaker(bind=sql_engine, expire_on_commit=True)

    def _session(self) -> Session:
        return self._session_factory()

    def store_log(
        self,
        log: StoredLog,
    ) -> str | NoActivePeriodError | NoLogInPeriodError:
        """Store a log message. Returns the hash of the stored message."""
        with self._session() as session:
            with session.begin():
                latest_log = self._tail_log(session)
                if not isinstance(latest_log, LogEntry):
                    return latest_log
                return self._do_store_log(
                    session, log, latest_log.period_ordinal + 1, latest_log.log_period
                )

    def _do_store_log(
        self,
        session: Session,
        log: StoredLog,
        ordinal: int,
        log_period: LogPeriod,
        end_at: datetime | None = None,
    ) -> str:
        entry = LogEntry(
            period_ordinal=ordinal,
            log_period=log_period,
            message=log.message,
            message_hash=log.message_hash,
            message_sig=log.message_sig,
            sig_version=log.sig_version,
        )

        if end_at is not None:
            log_period.ended_at = end_at

        session.add(entry)
        session.add(log_period)
        return log.message_hash

    def end_period(self, end_period_logs: list[StoredLog]) -> str | NoActivePeriodError:
        """End a period, with the required end message and some previous supplemental messages.

        Returns the hash of the final message in the period.
        """
        with self._session() as session:
            with session.begin():
                current_period = self._current_period(session)
                if isinstance(current_period, NoActivePeriodError):
                    return current_period
                latest_log = self._tail_log_of_period(session, current_period)
                if isinstance(latest_log, NoLogInPeriodError):
                    ordinal = 0
                else:
                    ordinal = latest_log.period_ordinal + 1
                latest_hash = ""
                for log in end_period_logs:
                    latest_hash = self._do_store_log(
                        session,
                        log,
                        ordinal,
                        current_period,
                        datetime.now(timezone.utc),
                    )
                    ordinal += 1
                return latest_hash

    def start_period(self, start_period_logs: list[StoredLog]) -> str:
        """Begin a new log period.

        Returns the hash of the latest message in the period.
        """
        with self._session() as session:
            with session.begin():
                new_period = LogPeriod(started_at=datetime.now(timezone.utc))
                latest_hash = ""
                ordinal = 0
                for log in start_period_logs:
                    latest_hash = self._do_store_log(session, log, ordinal, new_period)
                    ordinal += 1
                return latest_hash

    def _current_period(self, session: Session) -> LogPeriod | NoActivePeriodError:
        latest_period = session.scalar(
            select(LogPeriod).where(LogPeriod.ended_at == None)  # noqa: E711
        )
        if latest_period is None:
            return NoActivePeriodError()
        return latest_period

    def _tail_log_of_period(
        self,
        session: Session,
        period: LogPeriod,
    ) -> LogEntry | NoLogInPeriodError:
        if len(period.log_entries) == 0:
            return NoLogInPeriodError()
        latest_log = period.log_entries[-1]
        if latest_log is None:
            return NoLogInPeriodError()
        return latest_log

    def _tail_log(
        self, session: Session
    ) -> LogEntry | NoLogInPeriodError | NoActivePeriodError:
        """Get the most recently logged message in the period."""
        latest_period = self._current_period(session)
        if isinstance(latest_period, NoActivePeriodError):
            return latest_period
        return self._tail_log_of_period(session, latest_period)

    def tail_hash(self) -> str | NoLogInPeriodError | NoActivePeriodError:
        """Get the message hash of the most recently logged message in the period."""
        with self._session() as session:
            latest_record = self._tail_log(session)
            if not isinstance(latest_record, LogEntry):
                return latest_record
            return latest_record.message_hash

    def get_period_entries(self, period_id: str) -> LogPeriodEntries:
        """Get the given log period's user and robot log entries."""
        with self._session() as session:
            log_period = session.scalar(
                select(LogPeriod).where(LogPeriod.id == int(period_id))
            )
            if log_period is None:
                raise NoLogInPeriodError()
            user_log_entries = [
                UserLogEntry(
                    message=user_log.message,
                    message_hash=user_log.message_hash,
                    message_sig=user_log.message_sig,
                    sig_version=user_log.sig_version,
                )
                for user_log in log_period.log_entries
            ]
            robot_log_entries = [
                RobotLogPaths(
                    file_path=robot_log.file_path,
                    file_hash=robot_log.file_hash,
                    file_sig=robot_log.file_sig,
                    file_sig_version=robot_log.file_sig_version,
                )
                for robot_log in log_period.robot_logs
            ]
            return LogPeriodEntries(
                user_log=UserLogForExport(
                    user_log_entries=user_log_entries,
                    startedAt=log_period.started_at,
                    endedAt=log_period.ended_at,
                ),
                robot_log_entries=robot_log_entries,
            )

    def list_periods(self) -> list[LogPeriodSummary]:
        """Return all log periods, oldest first, with their entry IDs in ordinal order."""
        with self._session() as session:
            periods = session.scalars(
                select(LogPeriod).order_by(LogPeriod.started_at.asc())
            ).all()
            return [
                LogPeriodSummary(
                    id=period.id,
                    startedAt=period.started_at,
                    endedAt=period.ended_at,
                )
                for period in periods
            ]
