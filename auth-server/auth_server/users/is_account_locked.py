def is_account_locked(
    *,
    failed_login_count: int,
    max_attempts: int | None,
) -> tuple[bool, int | None]:
    """Return True if failed_login_count meets or exceeds the configured limit.

    Returns a tuple `(is_currently_locked, attempts_remaining)`.
    """
    if max_attempts is None:
        return False, None
    else:
        attempts_remaining = max(0, max_attempts - failed_login_count)
        return attempts_remaining <= 0, attempts_remaining
