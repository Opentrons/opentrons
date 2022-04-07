import asyncio

import logging

from otupdate.common import config, update_actions
from otupdate.common.session import UpdateSession, Stages

from otupdate.openembedded.updater import (
    ROOTFS_SIG_NAME,
    ROOTFS_HASH_NAME,
    ROOTFS_NAME,
    UPDATE_FILES,
)

LOG = logging.getLogger(__name__)


def _begin_unzip_update_package(
    session: UpdateSession,
    config: config.Config,
    loop: asyncio.AbstractEventLoop,
    downloaded_update_path: str,
    actions: update_actions.UpdateActionsInterface,
):
    """Start unzipping the update package

    Remember this only unzips the package not
    the actual update file!
    """
    LOG.info("In _begin_unzip_update_package")
    LOG.info(f"file path, " f"{downloaded_update_path}, in _begin_unzip_update_package")
    session.set_stage(Stages.VALIDATING)
    unzip_future = asyncio.ensure_future(
        loop.run_in_executor(
            None,
            actions.validate_update,
            downloaded_update_path,
            session.set_progress,
            None,
            ROOTFS_NAME,
            ROOTFS_HASH_NAME,
            ROOTFS_SIG_NAME,
            UPDATE_FILES,
            lambda file_path: open(file_path, "rb").read().strip().split()[0],
            "md5",
        )
    )

    def unzip_update_package_done(fut):
        exc = fut.exception()
        if exc:
            session.set_error(getattr(exc, "short", str(type(exc))), str(exc))
        else:
            session.set_stage(Stages.WRITING)
            rootfs_file = fut.result()
            loop.call_soon_threadsafe(
                _begin_decomp_and_write,
                session,
                config,
                loop,
                rootfs_file,
                actions,
            )

    unzip_future.add_done_callback(unzip_update_package_done)


def _begin_decomp_and_write(
    session: UpdateSession,
    config: config.Config,
    loop: asyncio.AbstractEventLoop,
    downloaded_update_path: str,
    actions: update_actions.UpdateActionsInterface,
):
    """Start the write process!"""
    LOG.info("In _begin_straight_fwd_decomp_and_write")
    LOG.info(
        f"file path, "
        f"{downloaded_update_path}, in _begin_straight_fwd_decomp_and_write"
    )
    session.set_stage(Stages.WRITING)
    write_future = asyncio.ensure_future(
        loop.run_in_executor(
            None,
            actions.write_update,
            downloaded_update_path,
            session.set_progress,
        )
    )

    def decomp_and_write_done(fut):
        exc = fut.exception()
        if exc:
            session.set_error(getattr(exc, "short", str(type(exc))), str(exc))
        else:
            session.set_stage(Stages.DONE)

    write_future.add_done_callback(decomp_and_write_done)
