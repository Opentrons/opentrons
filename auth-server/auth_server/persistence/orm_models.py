"""SQLAlchemy ORM models, defining the current schema of our database."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import ForeignKey, false
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
    relationship,
)

from server_utils.sql_utils import JsonPythonValue, JsonValue, UTCDateTime


class Base(DeclarativeBase):
    """The base of all of this server's ORM models.

    Subclassing this does SQLAlchemy magic to keep track of all the ORM models that
    exist in our server.
    """

    type_annotation_map = {
        # Configure datetime fields to get serialized/deserialized via UTCDateTime.
        datetime: UTCDateTime
    }


class User(Base):
    """ORM model for user accounts."""

    __tablename__ = "user"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(unique=True)
    hashed_password: Mapped[str]
    full_name: Mapped[str]
    account_type: Mapped[str]
    # A flag that this user must reset their password for reasons other than time-based expiration.
    reset_password: Mapped[bool] = mapped_column(server_default=false(), default=False)
    # When the user's current password was set. Used for time-based password expiration.
    password_set_at: Mapped[datetime]

    failed_logins: Mapped[list[FailedLogin]] = relationship(
        order_by="FailedLogin.attempted_at",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:  # noqa: D105
        return f"<User(username={self.username!r})>"


class FailedLogin(Base):
    """Keeps track of a failed login, so we can lock accounts with too many failed logins.

    This is *not* sufficient for a long-lived audit log of failed logins, since this has
    a SQLAlchemy relationship to the `User` model and thus needs to be deleted if the
    underlying `User` is deleted.
    """

    __tablename__ = "failed_login"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    user: Mapped[User] = relationship(back_populates="failed_logins")

    attempted_at: Mapped[datetime] = mapped_column(index=True)
    """When the failed login attempt happened.

    We don't use this for anything yet, but we're storing it in case we someday want to
    implement time-based lockouts or rate limiting.
    """


class Setting(Base):
    """ORM model for a single setting."""

    __tablename__ = "setting"

    key: Mapped[str] = mapped_column(primary_key=True)
    value: Mapped[JsonPythonValue] = mapped_column(JsonValue, nullable=False)


class AccessControlEnabled(Base):
    """ORM model for the access control enabled setting."""

    __tablename__ = "access_control_enabled"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    enabled: Mapped[bool]
