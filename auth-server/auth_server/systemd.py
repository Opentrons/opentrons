"""Systemd bindings with fallbacks for test."""


# todo(mm, 2026-01-20): This is copy-pasted from system-server, which itself copy-pasted
# from update-server. system-server and auth-server should consolidate their copies into
# server-utils. update-server should probably stay self-contained.

try:
    # systemd journal is available, we can use its handler
    import systemd.daemon  # type: ignore

    def notify_up() -> None:
        """Notify systemd that the service is up."""
        systemd.daemon.notify("READY=1")

except ImportError:
    # systemd journal isn't available, probably running tests

    def notify_up() -> None:
        """Notify systemd that the service is up."""
        pass


__all__ = ["notify_up"]
