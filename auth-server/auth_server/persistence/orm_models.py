"""ORM table definitions and supporting column types."""

import json
from typing import Any, TypeAlias

from sqlalchemy import String, TypeDecorator
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """The base of all of this server's ORM models.

    Subclassing this does SQLAlchemy magic to keep track of all the ORM models that
    exist in our server.
    """

    pass


class User(Base):
    """ORM model for user accounts."""

    __tablename__ = "user"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(unique=True)
    hashed_password: Mapped[str]
    full_name: Mapped[str]
    account_type: Mapped[str]

    def __repr__(self) -> str:  # noqa: D105
        return f"<User(username={self.username!r})>"


JsonPythonValue: TypeAlias = (
    str
    | int
    | float
    | bool
    | None
    | list["JsonPythonValue"]
    | dict[str, "JsonPythonValue"]
)
"""The output of `json.dumps()` / the input of `json.loads()`."""


class JsonValue(TypeDecorator[object]):
    """Transparently serializes Python values to/from JSON strings in the DB."""

    impl = String
    cache_ok = True

    def process_bind_param(self, value: object | None, dialect: Any) -> str | None:
        """Python → DB: json.dumps before writing."""
        return json.dumps(value)

    def process_result_value(self, value: str | None, dialect: Any) -> object | None:
        """DB → Python: json.loads after reading."""
        if value is not None:
            result: object = json.loads(value)
            return result
        return None


class Setting(Base):
    """ORM model for a single setting."""

    __tablename__ = "setting"

    key: Mapped[str] = mapped_column(primary_key=True)
    value: Mapped[JsonPythonValue] = mapped_column(JsonValue)


class AccessControlEnabled(Base):
    """ORM model for the access control enabled setting."""

    __tablename__ = "access_control_enabled"

    id = Column(Integer, primary_key=True, autoincrement=True)
    enabled = Column(Boolean, nullable=True, default=None)
