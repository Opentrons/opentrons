"""ORM table definitions and supporting column types."""

from __future__ import annotations

from enum import StrEnum
from typing import Any

import sqlalchemy
import sqlalchemy.types as types
from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from server_utils.auth.scopes import Scope

from auth_server.persistence.database import Base


class ScopeListType(types.TypeDecorator[Any]):
    """Store a ``list[Scope]`` as a JSON array of scope API-name strings."""

    impl = types.JSON
    cache_ok = True

    def process_bind_param(
        self, value: Any, dialect: sqlalchemy.engine.Dialect
    ) -> list[str]:
        if not value:
            return []
        return sorted(s.api_name for s in value)

    def process_result_value(
        self, value: Any, dialect: sqlalchemy.engine.Dialect
    ) -> list[Scope]:
        if not value:
            return []
        return [Scope.from_api_name(s) for s in value]


class AccountType(StrEnum):
    """The type of account."""

    ADMIN = "admin"
    USER = "user"
    AUDITOR = "auditor"
    SERVICE = "service"


class User(Base):
    """ORM model for user accounts."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String, unique=True)
    hashed_password: Mapped[str] = mapped_column(String)
    full_name: Mapped[str] = mapped_column(String)
    account_type: Mapped[AccountType] = mapped_column(Enum(AccountType))
    scopes: Mapped[list[Scope]] = mapped_column(ScopeListType)

    def __repr__(self) -> str:  # noqa: D105
        return f"<User(username={self.username!r})>"
