"""User store – pure data access layer for user persistence."""

from sqlalchemy.engine import Engine as SQLEngine
from sqlalchemy.orm import Session, sessionmaker

from .models import PatchSettingsRequestData


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

    def get(self) -> None:
        """Look up a setting by username. Returns the Setting or None."""
        # with self._session() as session:
        #     user = session.query(User).filter(User.username == username).first()
        #     if user is not None:
        #         session.expunge(user)
        #     return user

    def add(
        self,
        username: str,
    ) -> None:
        """Create a user's settings, persist it, and return it."""
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

    def reset(self) -> None:
        """Reset the settings to their defaults.

        Raises ``ValueError`` if the username does not exist.
        """
        pass  # TODO: Implement

    def update(
        self,
        # TODO: Extract to args
        settings: PatchSettingsRequestData | None = None,
    ) -> None:
        """Update a settings's fields and return the updated Settings.

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
