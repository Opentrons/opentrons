"""Utilities for interacting with systemd."""


def notify_up() -> None:
    """Notify systemd that the current service is up and running.

    On dev machines without systemd, this will no-op. On dev machines that happen to be
    running Linux and systemd, this will actually send the notification, but that
    should be harmless.
    """
    try:
        import systemd.daemon  # type: ignore

        systemd.daemon.notify("READY=1")

    except ImportError:
        pass
