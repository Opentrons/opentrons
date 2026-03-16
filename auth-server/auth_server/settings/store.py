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

    def add(
        self,
        access_control_enabled: bool,
        max_number_of_login_attempts: int,
        password_reset_time_in_days: int,
        idle_lockout_in_minutes: int,
        require_admin_creds_when_updating_robot_software: bool,
        require_admin_creds_when_sending_protocol_to_robot: bool,
        require_admin_creds_for_signoff_protocol: bool,
        require_signoff_for_protocol_log: bool,
        require_reason_for_interaction: bool,
        min_length_of_reason_for_interaction: int,
        require_logs_to_be_saved_in_app: bool,
        delete_over_max_on_disk_protocols: bool,
    ) -> Settings:
        """Create a user's settings, persist it, and return it."""
        # should the defaults exist in the pydantic or the db?
        new_settings = Settings(
            access_control_enabled=access_control_enabled,
            max_number_of_login_attempts=max_number_of_login_attempts,
            password_reset_time_in_days=password_reset_time_in_days,
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
