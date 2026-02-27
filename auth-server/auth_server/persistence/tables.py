"""ORM table definitions and supporting column types."""

from __future__ import annotations

from enum import StrEnum
from typing import Any, List

import sqlalchemy
import sqlalchemy.types as types
from sqlalchemy import Column, Enum, Integer, String
from sqlalchemy.orm import relationship

from server_utils.auth.scopes import Scope

from auth_server.persistence.database import Base
from auth_server.users.models import AccountType

ACCOUNT_TYPE_SCOPES = {
    AccountType.ADMIN: list(Scope),  # all scopes
    AccountType.USER: [Scope.RUNS_WRITE],  # limited scopes
    AccountType.AUDITOR: [Scope.USERS_READ],
    AccountType.SERVICE: [Scope.RUNS_WRITE],
}


class AccountTypeScope(Base):
    """Maps each account type to its allowed scopes."""

    __tablename__ = "account_type_scopes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    account_type = Column(String, nullable=False)
    scope = Column(String, nullable=False)

    __table_args__ = (sqlalchemy.UniqueConstraint("account_type", "scope"),)


class User(Base):
    """ORM model for user accounts."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    account_type = Column(Enum(AccountType), nullable=False)
    # we can also just query it when needed.
    scope_mappings: List[AccountTypeScope] = relationship(
        "AccountTypeScope",
        primaryjoin="User.account_type == foreign(AccountTypeScope.account_type)",
        viewonly=True,
        lazy="joined",
    )

    @property
    def scopes(self) -> list[Scope]:
        return [Scope.from_api_name(m.scope) for m in self.scope_mappings]

    def __repr__(self) -> str:  # noqa: D105
        return f"<User(username={self.username!r})>"
