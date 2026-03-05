"""ORM table definitions and supporting column types."""

from sqlalchemy import Column, Integer, String

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
