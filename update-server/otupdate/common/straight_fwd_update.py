import asyncio
import os

from aiohttp import web
import logging

from otupdate.common import config, update_actions
from otupdate.common.session import UpdateSession, Stages
from otupdate.common.update import require_session, _save_file

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
                _begin_straight_fwd_decomp_and_write,
                session,
                config,
                loop,
                rootfs_file,
                actions,
            )

    unzip_future.add_done_callback(unzip_update_package_done)


def _begin_straight_fwd_decomp_and_write(
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
        LOG.info(f"header being currently read ===> {part.headers} in file_upload")
        LOG.info(
            f"Part {part.name} being saved to "
            f"{session.download_path}, in file_upload"
        )
        if part.name != "ot3_update.zip":
            LOG.info(f"Unknown field name {part.name} in file_upload, ignoring")
            await part.release()
        else:
            LOG.info("_save_file called from file_upload")
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

    _begin_unzip_update_package(
        session,
        config.config_from_request(request),
        asyncio.get_event_loop(),
        os.path.join(session.download_path, "ot3_update.zip"),
        maybe_actions,
    )

    return web.json_response(data=session.state, status=201)
