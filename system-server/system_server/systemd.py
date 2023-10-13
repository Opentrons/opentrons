"""Systemd bindings with fallbacks for test."""

try:
    # systemd is available, we can use its handler
    import systemd.daemon

    # By using sd_notify
    # (https://www.freedesktop.org/software/systemd/man/sd_notify.html)
    # and type=notify in the unit file, we can prevent systemd from starting
    # dependent services until we actually say we're ready. By calling this
    # after we change the hostname, we make anything with an After= on us
    # be guaranteed to see the correct hostname
    def notify_up() -> None:
        """Notify systemd that the service is up."""
        systemd.daemon.notify("READY=1")

    SOURCE: str = "systemd"

except ImportError:
    # systemd journal isn't available, probably running tests

    def notify_up() -> None:
        """Notify systemd that the service is up."""
        pass

    SOURCE = "dummy"


__all__ = ["notify_up"]
