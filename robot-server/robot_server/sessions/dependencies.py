"""Session router dependency wire-up."""
from datetime import datetime

from .session_store import SessionStore
from .session_runner import SessionRunner


def get_session_store() -> SessionStore:
    """Get an interface to retrieve session data."""
    raise NotImplementedError()


def get_session_runner() -> SessionRunner:
    """Get an interface to control the session's run lifecycle."""
    raise NotImplementedError()


def get_unique_id() -> str:
    """Generate a unique identifier string."""
    raise NotImplementedError()


def get_current_time() -> datetime:
    """Get the current system time."""
    raise NotImplementedError()
