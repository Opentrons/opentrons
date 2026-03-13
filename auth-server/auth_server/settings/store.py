"""User store – pure data access layer for user persistence."""

from sqlalchemy.engine import Engine as SQLEngine
from sqlalchemy.orm import Session, sessionmaker


class SettingsStore:
    """Manages settings CRUD operations against the database."""

    def __init__(self, sql_engine: SQLEngine) -> None:
        """Initialize with a SQLAlchemy engine."""
        self._sql_engine = sql_engine
        self._session_factory = sessionmaker(
            bind=sql_engine,
            expire_on_commit=False,
        )

    def _session(self) -> Session:
        return self._session_factory()

    def get(self, username: str) -> None:
        """Look up a setting by username. Returns the Setting or None."""
        # with self._session() as session:
        #     user = session.query(User).filter(User.username == username).first()
        #     if user is not None:
        #         session.expunge(user)
        #     return user

    def add(
        self,
        username: str,
        hashed_password: str,
        full_name: str,
        account_type: str,
    ) -> None:
        """Create a user, persist it, and return it."""
        pass  # TODO: Implement
        # new_user = User(
        #     username=username,
        #     hashed_password=hashed_password,
        #     full_name=full_name,
        #     account_type=AccountType(account_type),
        # )
        # with self._session() as session:
        #     session.add(new_user)
        #     session.commit()
        #     session.expunge(new_user)
        # return new_user

    def remove(self, username: str) -> None:
        """Delete a user by username.

        Raises ``ValueError`` if the user does not exist.
        """
        pass  # TODO: Implement
        # with self._session() as session:
        #     user = session.query(User).filter(User.username == username).first()
        #     if user is None:
        #         raise ValueError(f"User {username!r} not found")
        #     session.delete(user)
        #     session.commit()

    def update(
        self,
    ) -> None:
        """Update a user's fields and return the updated User.

        Raises ``ValueError`` if the user does not exist.
        """
        pass  # TODO: Implement
        # with self._session() as session:
        #     user: User | None = (
        #         session.query(User).filter(User.username == username).first()
        #     )
        #     if user is None:
        #         raise ValueError(f"User {username!r} not found")
        #     updates: dict[str, object] = {
        #         "username": new_username,
        #         "hashed_password": hashed_password,
        #         "full_name": full_name,
        #         "account_type": AccountType(account_type)
        #         if account_type is not None
        #         else None,
        #     }
        #     for attr, value in updates.items():
        #         if value is not None:
        #             setattr(user, attr, value)
        #     session.commit()
        #     session.expunge(user)
        #     return user
