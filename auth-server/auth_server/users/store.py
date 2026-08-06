"""User store – pure data access layer for user persistence."""

import datetime

from sqlalchemy import select
from sqlalchemy.engine import Engine as SQLEngine
from sqlalchemy.orm import Session, sessionmaker

from auth_server.persistence.orm_models import FailedLogin, User
from auth_server.users.models import AccountType


class UserStore:
    """Manages user CRUD operations against the database."""

    def __init__(self, sql_engine: SQLEngine) -> None:
        """Initialize with a SQLAlchemy engine."""
        self._sql_engine = sql_engine
        self._session_factory = sessionmaker(
            bind=sql_engine,
            expire_on_commit=False,
        )

    def _session(self) -> Session:
        return self._session_factory()

    def seed(self, users: list[User]) -> None:
        """Insert users that don't already exist (matched by username)."""
        with self._session() as session:
            for user in users:
                existing = session.scalar(
                    select(User).where(User.username == user.username)
                )
                if existing is None:
                    session.add(user)
            session.commit()

    def get(self, username: str) -> User | None:
        """Look up a user by username. Returns the User or None."""
        with self._session() as session:
            user = session.scalar(select(User).where(User.username == username))
            if user is not None:
                session.expunge(user)
            return user

    def get_all(self) -> list[User]:
        """Return all users, ordered by username."""
        with self._session() as session:
            users = session.scalars(select(User).order_by(User.username)).all()
            for user in users:
                session.expunge(user)
            return list(users)

    def add(
        self,
        username: str,
        hashed_password: str,
        full_name: str,
        account_type: str,
        now: datetime.datetime,
        reset_password: bool,
    ) -> User:
        """Create a user, persist it, and return it."""
        new_user = User(
            username=username,
            hashed_password=hashed_password,
            full_name=full_name,
            account_type=AccountType(account_type),
            password_set_at=now,
            reset_password=reset_password,
        )
        with self._session() as session:
            session.add(new_user)
            session.commit()
            session.expunge(new_user)
        return new_user

    def remove(self, username: str) -> None:
        """Delete a user by username.

        Raises ``ValueError`` if the user does not exist.
        """
        with self._session() as session:
            user = session.scalar(select(User).where(User.username == username))
            if user is None:
                raise ValueError(f"User {username!r} not found")
            session.delete(user)
            session.commit()

    def update(
        self,
        username: str,
        new_username: str | None = None,
        hashed_password: str | None = None,
        full_name: str | None = None,
        account_type: str | None = None,
        reset_password: bool | None = None,
        *,
        now: datetime.datetime,
    ) -> User:
        """Update a user's fields and return the updated User.

        Raises ``ValueError`` if the user does not exist.
        """
        with self._session() as session:
            user = session.scalar(select(User).where(User.username == username))
            if user is None:
                raise ValueError(f"User {username!r} not found")

            if new_username is not None:
                user.username = new_username
            if hashed_password is not None:
                user.hashed_password = hashed_password
                user.password_set_at = now
            if full_name is not None:
                user.full_name = full_name
            if account_type is not None:
                user.account_type = AccountType(account_type)
            if reset_password is not None:
                user.reset_password = reset_password

            session.commit()
            session.expunge(user)
            return user

    def record_failed_login(self, username: str, now: datetime.datetime) -> int:
        """Store a failed login timestamp for the given user."""
        with self._session() as session:
            user = session.scalar(select(User).where(User.username == username))
            if user is None:
                raise ValueError(f"User {username!r} not found")
            user.failed_logins.append(FailedLogin(attempted_at=now))
            session.commit()
            return len(user.failed_logins)

    def get_failed_login_count(self, username: str) -> int:
        """Return how many times the given user has failed to log in."""
        with self._session() as session:
            user = session.scalar(select(User).where(User.username == username))
            if user is None:
                raise ValueError(f"User {username!r} not found")
            return len(user.failed_logins)

    def clear_failed_logins(self, username: str) -> None:
        """Reset the number of times the given user has failed to log in back to 0."""
        with self._session() as session:
            user = session.scalar(select(User).where(User.username == username))
            if user is None:
                raise ValueError(f"User {username!r} not found")
            user.failed_logins.clear()
            session.commit()
