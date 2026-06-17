"""Code for managing log storage and export."""

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.engine import Engine as SQLEngine
from sqlalchemy.orm import Session, sessionmaker

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

    async def store_log(
        self,
        log: StoredLog,
    ) -> None:
        """Store a log message."""
        with self._session() as session:
            with session.begin():
                latest_log = await self._tail_log(session)
                await self._do_store_log(
                    session, log, latest_log.period_ordinal + 1, latest_log.log_period
                )

    async def _do_store_log(
        self,
        session: Session,
        log: StoredLog,
        ordinal: int,
        log_period: LogPeriod,
        end_at: datetime | None = None,
    ) -> None:
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

    async def end_period(self, end_period_log: StoredLog) -> None:
        """End a period, with the required end message."""
        with self._session() as session:
            with session.begin():
                current_period = await self._current_period(session)
                try:
                    latest_log = await self._tail_log_of_period(session, current_period)
                    ordinal = latest_log.period_ordinal + 1
                except NoLogInPeriodError:
                    ordinal = 0
                await self._do_store_log(
                    session,
                    end_period_log,
                    ordinal,
                    latest_log.log_period,
                    datetime.now(timezone.utc),
                )

    async def start_period(self, start_period_log: StoredLog) -> None:
        """Begin a new log period."""
        with self._session() as session:
            with session.begin():
                new_period = LogPeriod(started_at=datetime.now(timezone.utc))
                await self._do_store_log(session, start_period_log, 0, new_period)

    async def _current_period(self, session: Session) -> LogPeriod:
        latest_period = session.scalar(
            select(LogPeriod).where(LogPeriod.ended_at == None)  # noqa: E711
        )
        if latest_period is None:
            raise NoActivePeriodError()
        return latest_period

    async def _tail_log_of_period(
        self,
        session: Session,
        period: LogPeriod,
    ) -> LogEntry:
        if len(period.log_entries) == 0:
            raise NoLogInPeriodError()
        latest_log = period.log_entries[-1]
        if latest_log is None:
            raise NoLogInPeriodError()
        return latest_log

    async def _tail_log(self, session: Session) -> LogEntry:
        """Get the most recently logged message in the period."""
        latest_period = await self._current_period(session)
        latest_log = await self._tail_log_of_period(session, latest_period)
        return latest_log

    async def tail_hash(self) -> str:
        """Get the message hash of the most recently logged message in the period."""
        with self._session() as session:
            latest_record = await self._tail_log(session)
            return latest_record.message_hash
