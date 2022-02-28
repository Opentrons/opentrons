from opentrons import config
import os
import logging

log = logging.getLogger(__name__)
lock_file_path = "/tmp/resin/resin-updates.lock"


def lock_updates() -> None:
    if config.IS_ROBOT:
        import fcntl

        try:
            with open(lock_file_path, "w") as fd:
                fd.write("a")
                fcntl.flock(fd, fcntl.LOCK_EX)
                fd.close()
        except OSError:
            log.warning("Unable to create resin-update lock file")


def unlock_updates() -> None:
    if config.IS_ROBOT and os.path.exists(lock_file_path):
        os.remove(lock_file_path)
