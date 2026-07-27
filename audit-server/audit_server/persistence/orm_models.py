"""SQLAlchemy ORM models, defining the current schema of our database.

This module currently exists as a skeleton: it declares the shared
``DeclarativeBase`` subclass that all audit-server ORM models will inherit
from, but no concrete tables are mapped yet. Add tables as new features
require persistent storage.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.schema import UniqueConstraint

from server_utils.sql_utils import JsonPythonValue, JsonValue, UTCDateTime


class Base(DeclarativeBase):
    """The base of all of this server's ORM models.

    Subclassing this does SQLAlchemy magic to keep track of all the ORM models that
    exist in our server, so they all show up in ``Base.metadata`` for Alembic's
    autogeneration and ``create_all()``.
    """

    type_annotation_map = {
        # Configure datetime fields to get serialized/deserialized via UTCDateTime.
        datetime: UTCDateTime
    }


class LogPeriod(Base):
    """A single period of logging.

    A log period is started by either the end of a previous log period, the robot booting, or
    the current unfinished log period being exported.
    A log period ends when a subsequent log period starts.

    A log period that has ended has an endedAt timestamp.
    The first log message of a logPeriod must be logPeriodBegin; the last log message of a
    finished log period must be logPeriodEnd. If either of these is not true, the log
    period has been modified.
    """

    __tablename__ = "logperiod"

    id: Mapped[int] = mapped_column(primary_key=True)
    started_at: Mapped[datetime]
    ended_at: Mapped[datetime | None]
    log_entries: Mapped[list[LogEntry]] = relationship(
        back_populates="log_period",
        foreign_keys="LogEntry.log_period_id",
        order_by="LogEntry.period_ordinal",
    )
    robot_logs: Mapped[list[RobotLog]] = relationship(back_populates="log_period")


class LogEntry(Base):
    """A single log row.

    Each log message belongs to exactly one log period. It contains the log message, the SHA-256
    hash of that message, and a signature over the concatenation of the hash of the previous message
    and the hash of this message. For instance, if the previous message's hash was 0xabcdef0123456789
    and this message's hash is 0x9876543210fedcba, the signature will be over
    0xabcdef01234567899876543210fedcba.
    """

    __tablename__ = "logentry"
    __table_args__ = (
        UniqueConstraint(
            "log_period_id", "period_ordinal", name="uc_period_ordinal_period_id"
        ),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    period_ordinal: Mapped[int]
    log_period_id: Mapped[int] = mapped_column(
        ForeignKey("logperiod.id", name="fk_log_period_for_audit_log")
    )
    log_period: Mapped[LogPeriod] = relationship(
        back_populates="log_entries", foreign_keys=log_period_id
    )
    message: Mapped[str]
    message_hash: Mapped[str]
    message_sig: Mapped[str]
    sig_version: Mapped[str]


class RobotLog(Base):
    """A robot log associated with a log row.

    Each robot log file belongs to exactly one log period.

    Each robot log file has an associated SHA256 hash of its contents which is signed.
    """

    __tablename__ = "robotlog"
    id: Mapped[int] = mapped_column(primary_key=True)
    log_period_id: Mapped[int] = mapped_column(
        ForeignKey("logperiod.id", name="fk_log_period_for_robot_log")
    )
    log_period: Mapped[LogPeriod] = relationship(
        back_populates="robot_logs", foreign_keys=log_period_id
    )
    file_path: Mapped[str]
    file_hash: Mapped[str]
    file_sig: Mapped[str]
    file_sig_version: Mapped[str]


class DeletionKey(Base):
    """A one-time key authorizing deletion of a persisted record.

    A deletion key is minted when a record is exported (for example, when a log
    period is downloaded) and must be presented to later delete that record.

    The linked record is modeled generically: ``foreign_id`` points at the
    record and ``foreign_type`` names what kind of record it is. Today the only
    kind is a log period (see ``DeletionKeyForeignType``), so ``foreign_id`` is
    a foreign key into ``logperiod``; the naming leaves room to generalize to
    other record types later.

    Keys accumulate: each export mints a new key, and previously issued keys
    for the same record remain valid to support multiple potential clients
    interacting with the same log periods.
    """

    __tablename__ = "deletion_key"

    id: Mapped[int] = mapped_column(primary_key=True)
    deletion_key: Mapped[str] = mapped_column(unique=True, index=True)
    foreign_id: Mapped[int] = mapped_column(
        ForeignKey(
            "logperiod.id",
            name="fk_log_period_for_deletion_key",
            ondelete="CASCADE",
        )
    )
    foreign_type: Mapped[str]
    created_at: Mapped[datetime]


class Setting(Base):
    """ORM model for a single generic setting, stored as a JSON-encoded value.

    This is the generic key/value settings table. Settings that don't warrant
    their own dedicated table live here. There are currently no such settings,
    but the table exists so new ones can be added without a schema change.
    """

    __tablename__ = "setting"

    key: Mapped[str] = mapped_column(primary_key=True)
    value: Mapped[JsonPythonValue] = mapped_column(JsonValue, nullable=False)


class LoggingEnabled(Base):
    """ORM model for the logging-enabled setting.

    This setting lives in its own table (rather than the generic ``setting``
    table) because it's a special case that we want to read and write through a
    dedicated, internal-only API.
    """

    __tablename__ = "logging_enabled"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    enabled: Mapped[bool]
