"""ORM table definitions and supporting column types."""

from sqlalchemy import Boolean, Column, Integer, String

from auth_server.persistence.database import Base


class User(Base):
    """ORM model for user accounts."""

    __tablename__ = "user"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    account_type = Column(String, nullable=False)

    def __repr__(self) -> str:  # noqa: D105
        return f"<User(username={self.username!r})>"


class Settings(Base):
    """ORM model for settings."""

    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    access_control_enabled = Column(Boolean, nullable=False)
    max_number_of_login_attempts = Column(Integer, nullable=False)
    password_reset_time_in_days = Column(Integer, nullable=False)
    password_complexity_minimum_length = Column(Integer, nullable=True)
    password_complexity_special_characters = Column(Boolean, nullable=True)
    idle_lockout_in_minutes = Column(Integer, nullable=False)
    require_admin_creds_when_updating_robot_software = Column(Boolean, nullable=False)
    require_admin_creds_when_sending_protocol_to_robot = Column(Boolean, nullable=False)
    require_admin_creds_for_signoff_protocol = Column(Boolean, nullable=False)
    require_signoff_for_protocol_log = Column(Boolean, nullable=False)
    require_reason_for_interaction = Column(Boolean, nullable=False)
    min_length_of_reason_for_interaction = Column(Integer, nullable=True)
    require_logs_to_be_saved_in_app = Column(Boolean, nullable=False)
    delete_over_max_on_disk_protocols = Column(Boolean, nullable=False)
