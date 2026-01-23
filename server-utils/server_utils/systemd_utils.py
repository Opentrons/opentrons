"""Utilities for interacting with systemd."""


def notify_up() -> None:
    """Notify systemd that the current service is up and running.

    On dev machines without systemd, this will no-op. On dev machines that happen to be
    running Linux and systemd, this will actually send the notification, but that
    should be harmless.
    """
    try:
        import systemd.daemon  # type: ignore

        # `unset_environment=True` prevents a problem with shelling out to systemd commands
        # like `hostnamectl`. For some reason, they send `EXIT_STATUS=` notifications to
        # systemd. systemd associates those notifications with our service, but ignores
        # them because they didn't come from our main PID. systemd logs warnings about this,
        # which flood our logs.
        systemd.daemon.notify("READY=1", unset_environment=True)

    except ImportError:
        pass
