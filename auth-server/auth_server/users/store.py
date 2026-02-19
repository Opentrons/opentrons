"""User store – pure data access layer for user persistence."""

from sqlalchemy.engine import Engine as SQLEngine
from sqlalchemy.orm import Session, sessionmaker

from server_utils.auth.scopes import Scope

from auth_server.persistence.tables import AccountType, User


class UserStore:
    """Manages user CRUD operations against the database."""

    def __init__(self, sql_engine: SQLEngine) -> None:
        """Initialize with a SQLAlchemy engine."""
        self._sql_engine = sql_engine
        self._session_factory = sessionmaker(
            bind=sql_engine,
            expire_on_commit=False,
        )  # type: ignore[call-overload]

    def _session(self) -> Session:
        return self._session_factory()

    def seed(self, users: list[User]) -> None:
        """Insert users that don't already exist (matched by username)."""
        with self._session() as session:
            for user in users:
                if (
                    session.query(User).filter(User.username == user.username).first()
                    is None
                ):
                    session.add(user)
            session.commit()

    def get(self, username: str) -> User | None:
        """Look up a user by username. Returns the User or None."""
        with self._session() as session:
            user = session.query(User).filter(User.username == username).first()
            if user is not None:
                session.expunge(user)
            return user

    def add(
        self,
        username: str,
        hashed_password: str,
        full_name: str,
        account_type: str,
        scopes: list[Scope],
    ) -> User:
        """Create a user, persist it, and return it."""
        new_user = User(
            username=username,
            hashed_password=hashed_password,
            full_name=full_name,
            account_type=AccountType(account_type),
            scopes=scopes,
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
            user = session.query(User).filter(User.username == username).first()
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
    ) -> User:
        """Update a user's fields and return the updated User.

        Raises ``ValueError`` if the user does not exist.
        """
        with self._session() as session:
            user = session.query(User).filter(User.username == username).first()
            if user is None:
                raise ValueError(f"User {username!r} not found")
            updates: dict[str, object] = {
                "username": new_username,
                "hashed_password": hashed_password,
                "full_name": full_name,
                "account_type": AccountType(account_type)
                if account_type is not None
                else None,
            }
            for attr, value in updates.items():
                if value is not None:
                    setattr(user, attr, value)
            session.commit()
            session.expunge(user)
            return user
