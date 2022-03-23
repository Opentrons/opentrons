from datetime import datetime, timezone


def utc_now() -> datetime:
    """Return the current time in the UTC timezone."""
    return datetime.now(tz=timezone.utc)
