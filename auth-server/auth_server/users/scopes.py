from enum import StrEnum


class Scope(StrEnum):
    """Authorization scopes, i.e. the possible permissions that someone can have."""

    # todo(mm, 2026-01-28): Replace these placeholder scopes with real ones.

    USERS_WRITE = "users.write"
    """Read, write, and edit users."""

    RUNS_READ = "runs.read"
    """Retrieve information about protocol runs."""

    RUNS_WRITE = "runs.write"
    """Create and control protocol runs."""
