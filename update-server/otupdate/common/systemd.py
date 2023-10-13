"""
systemd bindings with fallbacks for test
"""

try:
    import systemd.daemon

    # By using sd_notify
    # (https://www.freedesktop.org/software/systemd/man/sd_notify.html)
    # and type=notify in the unit file, we can prevent systemd from starting
    # dependent services until we actually say we're ready. By calling this
    # after we change the hostname, we make anything with an After= on us
    # be guaranteed to see the correct hostname
    def notify_up() -> None:
        systemd.daemon.notify("READY=1")

    SOURCE: str = "systemd"

except ImportError:
    # systemd isn't available, probably running tests

    def notify_up() -> None:
        pass

    SOURCE = "dummy"


__all__ = ["notify_up"]
