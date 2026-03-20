"""User store – pure data access layer for user persistence."""

from sqlalchemy.engine import Engine as SQLEngine
from sqlalchemy.orm import Session, sessionmaker

from auth_server.persistence.orm_models import Settings


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

    def get_all(self) -> dict[str, str | None]:
        """Return all settings as a dict."""
        with self._session() as session:
            rows = session.query(Settings).all()
            return {row.key: row.value for row in rows}

    def upsert(self, key: str, value: str | None) -> None:
        """Insert or update a single setting."""
        with self._session() as session:
            row = session.query(Settings).filter(Settings.key == key).first()
            if row is None:
                session.add(Settings(key=key, value=value))
            else:
                row.value = value
            session.commit()

    def upsert_many(self, settings: dict[str, str | None]) -> None:
        """Insert or update multiple settings at once."""
        with self._session() as session:
            for key, value in settings.items():
                row = session.query(Settings).filter(Settings.key == key).first()
                if row is None:
                    session.add(Settings(key=key, value=value))
                else:
                    row.value = value
            session.commit()

    def delete_all(self) -> None:
        """Delete all settings (for reset)."""
        with self._session() as session:
            session.query(Settings).delete()
            session.commit()
