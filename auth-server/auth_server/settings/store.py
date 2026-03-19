"""User store – pure data access layer for user persistence."""

from sqlalchemy.engine import Engine as SQLEngine
from sqlalchemy.orm import Session, sessionmaker

from .models import PatchSettingsRequestData
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

    def get(self) -> Settings | None:
        """Look up a setting by username. Returns the Setting or None."""
        with self._session() as session:
            settings = session.query(Settings).first()
            if settings is not None:
                session.expunge(settings)
            return settings

    def insert(
        self,
        access_control_enabled: bool,
        max_number_of_login_attempts: int,
        password_reset_time_in_days: int | None,
        password_complexity_minimum_length: int | None,
        password_complexity_special_characters: bool | None,
        idle_lockout_in_minutes: int,
        require_admin_creds_when_updating_robot_software: bool,
        require_admin_creds_when_sending_protocol_to_robot: bool,
        require_admin_creds_for_signoff_protocol: bool,
        require_signoff_for_protocol_log: bool,
        require_reason_for_interaction: bool,
        min_length_of_reason_for_interaction: int | None,
        require_logs_to_be_saved_in_app: bool,
        delete_over_max_on_disk_protocols: bool,
    ) -> Settings:
        """Create the settings row with all values provided."""
        new_settings = Settings(
            access_control_enabled=access_control_enabled,
            max_number_of_login_attempts=max_number_of_login_attempts,
            password_reset_time_in_days=password_reset_time_in_days,
            password_complexity_minimum_length=password_complexity_minimum_length,
            password_complexity_special_characters=password_complexity_special_characters,
            idle_lockout_in_minutes=idle_lockout_in_minutes,
            require_admin_creds_when_updating_robot_software=require_admin_creds_when_updating_robot_software,
            require_admin_creds_when_sending_protocol_to_robot=require_admin_creds_when_sending_protocol_to_robot,
            require_admin_creds_for_signoff_protocol=require_admin_creds_for_signoff_protocol,
            require_signoff_for_protocol_log=require_signoff_for_protocol_log,
            require_reason_for_interaction=require_reason_for_interaction,
            min_length_of_reason_for_interaction=min_length_of_reason_for_interaction,
            require_logs_to_be_saved_in_app=require_logs_to_be_saved_in_app,
            delete_over_max_on_disk_protocols=delete_over_max_on_disk_protocols,
        )
        with self._session() as session:
            session.add(new_settings)
            session.commit()
            session.expunge(new_settings)
        return new_settings

    def update(self, **kwargs: object) -> Settings:
        """Update only the specified fields on the existing settings row."""
        with self._session() as session:
            row: Settings | None = session.query(Settings).first()
            if row is None:
                raise RuntimeError("Settings row missing")
            for attr, value in kwargs.items():
                setattr(row, attr, value)
            session.commit()
            session.expunge(row)
            return row

    def reset(self) -> None:
        """Reset the settings to their defaults.

        Delete the settings record and force settings to defaults.

        """
        with self._session() as session:
            session.query(Settings).delete()
            session.commit()
