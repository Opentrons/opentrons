"""SQLAlchemy ORM models, defining the current schema of our database.

This module currently exists as a skeleton: it declares the shared
``DeclarativeBase`` subclass that all audit-server ORM models will inherit
from, but no concrete tables are mapped yet. Add tables as new features
require persistent storage.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import DeclarativeBase

from server_utils.sql_utils import UTCDateTime


class Base(DeclarativeBase):
    """The base of all of this server's ORM models.

    Subclassing this does SQLAlchemy magic to keep track of all the ORM models that
    exist in our server, so they all show up in ``Base.metadata`` for Alembic's
    autogeneration and ``create_all()``.
    """

    type_annotation_map = {
        # Configure datetime fields to get serialized/deserialized via UTCDateTime.
        datetime: UTCDateTime
    }
