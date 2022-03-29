import asyncio
import os

from aiohttp import web
import logging

from otupdate.common import config, update_actions
from otupdate.common.session import UpdateSession, Stages
from otupdate.common.update import require_session, _save_file

LOG = logging.getLogger(__name__)


def _begin_straight_fwd_unzip(
    session: UpdateSession,
    config: config.Config,
    loop: asyncio.AbstractEventLoop,
    downloaded_update_path: str,
    actions: update_actions.UpdateActionsInterface,
) -> asyncio.futures.Future:
    """Start the unzip process!"""
    LOG.warning("Entered _begin_straight_fwd_unzip")
    LOG.warning(f"file path, {downloaded_update_path}, in _begin_straight_fwd_unzip")
    session.set_stage(Stages.VALIDATING)
    unzip_future = asyncio.ensure_future(
        loop.run_in_executor(
            None,
            actions.unzip,
            downloaded_update_path,
            session.set_progress,
        )
    )

    def unzip_done(fut):
        exc = fut.exception()
        if exc:
            LOG.exception(exc)
            LOG.warning("exception in unzip")
            session.set_error(getattr(exc, "short", str(type(exc))), str(exc))
        else:
            LOG.warning(f"unzip successful {fut.result()}")
            files, sizes = fut.result()
            loop.call_soon_threadsafe(
                _begin_straight_fwd_write(
                    session,
                    config,
                    loop,
                    "/var/lib/otupdate/downloads"
                    "/Verdin-iMX8MM_opentrons-ot3-image.rootfs.ext4",
                    # "/var/lib/otupdate/downloads/rootfs.ext4",
                    actions,
                )
            )

    unzip_future.add_done_callback(unzip_done)
    return unzip_future


def _begin_straight_fwd_write(
    session: UpdateSession,
    config: config.Config,
    loop: asyncio.AbstractEventLoop,
    downloaded_update_path: str,
    actions: update_actions.UpdateActionsInterface,
):
    """Start the write process!"""
    LOG.warning("In _begin_straight_fwd_write")
    LOG.warning(f"file path, {downloaded_update_path} .in _begin_straight_fwd_write")
    session.set_stage(Stages.WRITING)
    write_future = asyncio.ensure_future(
        loop.run_in_executor(
            None,
            actions.write_update,
            downloaded_update_path,
            session.set_progress,
        )
    )

    def write_done(fut):
        exc = fut.exception()
        if exc:
            session.set_error(getattr(exc, "short", str(type(exc))), str(exc))
        else:
            session.set_stage(Stages.DONE)

    write_future.add_done_callback(write_done)


def _begin_straight_fwd_untar_and_write(
    session: UpdateSession,
    config: config.Config,
    loop: asyncio.AbstractEventLoop,
    downloaded_update_path: str,
    actions: update_actions.UpdateActionsInterface,
):
    """Start the write process!"""
    LOG.warning("In _begin_straight_fwd_untar_and_write")
    LOG.warning(
        f"file path, {downloaded_update_path} .in _begin_straight_fwd_untar_and_write"
    )
    session.set_stage(Stages.WRITING)
    write_future = asyncio.ensure_future(
        loop.run_in_executor(
            None,
            actions.untar_and_write,
            downloaded_update_path,
            session.set_progress,
        )
    )

    def untar_and_write_done(fut):
        exc = fut.exception()
        if exc:
            session.set_error(getattr(exc, "short", str(type(exc))), str(exc))
        else:
            session.set_stage(Stages.DONE)

    write_future.add_done_callback(untar_and_write_done)


@require_session
async def file_upload(request: web.Request, session: UpdateSession) -> web.Response:
    """Serves /update/:session/file

    Requires multipart (encoding doesn't matter) with a file field in the
    body called.
    """
    if session.stage != Stages.AWAITING_FILE:
        return web.json_response(
            data={
                "error": "file-already-uploaded",
                "message": "A file has already been sent for this update",
            },
            status=409,
        )
    reader = await request.multipart()
    async for part in reader:
        LOG.warning(f"header being currently read ===> {part.headers} in file_upload")
        LOG.warning(
            f"Part {part.name} being saved to "
            f"{session.download_path}, in file_upload"
        )
        if part.name != "rootfs.xz":
            LOG.warning(f"Unknown field name {part.name} in file_upload, ignoring")
            await part.release()
        else:
            LOG.warning("_save_file called from file_upload")
            await _save_file(part, session.download_path)

    maybe_actions = update_actions.UpdateActionsInterface.from_request(request)
    if not maybe_actions:
        return web.json_response(
            data={
                "error": "no-actions-set",
                "message": "Internal error: no actions object for hardware",
            },
            status=500,
        )

    _begin_straight_fwd_untar_and_write(
        session,
        config.config_from_request(request),
        asyncio.get_event_loop(),
        os.path.join(session.download_path, "rootfs.xz"),
        maybe_actions,
    )

    return web.json_response(data=session.state, status=201)
