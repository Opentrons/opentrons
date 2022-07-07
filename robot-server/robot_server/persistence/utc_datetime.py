"""A SQL column type to store UTC datetimes."""


from datetime import datetime, timezone
from typing import Optional
import sqlalchemy


class UTCDateTime(sqlalchemy.types.TypeDecorator[datetime]):
    """A SQL column type to store UTC datetimes.

    Usage example:

        table = sqlalchemy.Table(
            ...
            sqlalchemy.Column("my_datetime_column", UTCDateTime)
        )

    Opentrons robot-server code should always use this instead of SQLAlchemy's
    built-in DateTime type.

    Motivation:

    We generally want our datetimes to have a UTC timezone so they're unambiguous.
    Unfortunately, when we use SQLAlchemy's built-in DateTime type with SQLite,
    the timezone gets stripped upon insertion, and subsequent reads return a naive
    (timezone-less) datetime.

    Using this class instead preserves datetimes' UTC-ness.

    * When a Python datetime object gets inserted into SQL:

      This first asserts that the Python object has its timezone set to UTC,
      because we don't currently have any good reason try to store non-UTC datetimes.

      Then, it inserts the timestamp into the database without any explicit timezone.
      This matches how sqlalchemy.DateTime would store it.

    * When a datetime is extracted from SQL:

      The raw timestamp from the database will be naive (timezone-less).
      This marks it with the UTC timezone before returning it.
    """

    impl = sqlalchemy.types.DateTime
    cache_ok = True

    def process_bind_param(
        self, value: Optional[datetime], dialect: object
    ) -> Optional[datetime]:
        """Prepare a Python datetime object to inserted into SQL via SQLAlchemy."""
        if value is not None:
            assert value.tzinfo == timezone.utc, f"Expected '{value}' to be UTC"

        # Pass the value to sqlalchemy.DateTime,
        # which will strip .tzinfo and store the timestamp as-is.
        return value

    def process_result_value(
        self, value: Optional[datetime], dialect: object
    ) -> Optional[datetime]:
        """Process a Python datetime object that SQLAlchemy just extracted from SQL."""
        if value is not None:
            assert value.tzinfo is None
            return value.replace(tzinfo=timezone.utc)
        return None
