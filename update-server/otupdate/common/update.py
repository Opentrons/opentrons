"""
endpoints for running software updates

This has endpoints like update session management, validation, and execution
"""
import asyncio
import functools
import logging
import os
from pathlib import Path

from subprocess import CalledProcessError

from typing import Optional
from typing_extensions import Protocol

from aiohttp import web, BodyPartReader

from . import config, update_actions
from .constants import APP_VARIABLE_PREFIX, RESTART_LOCK_NAME
from .handler_type import Handler
from .session import UpdateSession, Stages

from otupdate.openembedded.update_actions import UPDATE_PKG_OE
from otupdate.buildroot.update_actions import UPDATE_PKG_BR

VALID_UPDATE_PKG = UPDATE_PKG_OE + UPDATE_PKG_BR

SESSION_VARNAME = APP_VARIABLE_PREFIX + "session"
LOG = logging.getLogger(__name__)


class _HandlerWithSession(Protocol):
    """The type signature of an aiohttp request handler that also has a session arg.

    See require_session().
    """

    async def __call__(
        self, request: web.Request, session: UpdateSession
    ) -> web.Response:
        ...


def session_from_request(request: web.Request) -> Optional[UpdateSession]:
    return request.app.get(SESSION_VARNAME, None)


def require_session(handler: _HandlerWithSession) -> Handler:
    """Decorator to ensure a session is properly in the request"""

    @functools.wraps(handler)
    async def decorated(request: web.Request) -> web.Response:
        request_session_token = request.match_info["session"]
        session = session_from_request(request)
        if not session or request_session_token != session.token:
            LOG.warning(f"request for invalid session {request_session_token}")
            return web.json_response(
                data={
                    "error": "bad-token",
                    "message": f"No such session {request_session_token}",
                },
                status=404,
            )
        return await handler(request, session)

    return decorated


async def begin(request: web.Request) -> web.Response:
    """Begin a session"""
    if None is not session_from_request(request):
        LOG.warning("begin: requested with active session")
        return web.json_response(
            data={
                "message": "An update session is already active on this robot",
                "error": "session-already-active",
            },
            status=409,
        )

    session = UpdateSession(config.config_from_request(request).download_storage_path)
    request.app[SESSION_VARNAME] = session
    return web.json_response(data={"token": session.token}, status=201)


async def cancel(request: web.Request) -> web.Response:
    request.app.pop(SESSION_VARNAME, None)
    return web.json_response(data={"message": "Session cancelled"}, status=200)


@require_session
async def status(request: web.Request, session: UpdateSession) -> web.Response:
    return web.json_response(data=session.state, status=200)


async def _save_file(part: BodyPartReader, path: str) -> None:
    # making sure directory exists first
    Path(path).mkdir(parents=True, exist_ok=True)
    with open(os.path.join(path, part.name), "wb") as write:
        while not part.at_eof():
            chunk = await part.read_chunk()
            decoded = part.decode(chunk)
            write.write(decoded)
    try:
        for file in os.listdir(path):
            LOG.info(f"file written, {file} to path, {path}")
    except Exception:
        LOG.exception("File not written")


def _begin_write(
    session: UpdateSession,
    loop: asyncio.AbstractEventLoop,
    rootfs_file_path: str,
    actions: update_actions.UpdateActionsInterface,
) -> None:
    """Start the write process."""
    session.set_progress(0)
    session.set_stage(Stages.WRITING)
    write_future = asyncio.ensure_future(
        loop.run_in_executor(
            None,
            actions.write_update,
            rootfs_file_path,
            session.set_progress,
        )
    )

    def write_done(fut):
        exc = fut.exception()
        if exc:
            session.set_error(getattr(exc, "short", str(type(exc))), str(exc))
        else:
            LOG.info(f"Finished update session {session}")
            session.set_stage(Stages.DONE)

    write_future.add_done_callback(write_done)


def _begin_validation(
    session: UpdateSession,
    config: config.Config,
    loop: asyncio.AbstractEventLoop,
    downloaded_update_path: str,
    actions: update_actions.UpdateActionsInterface,
) -> "asyncio.futures.Future[Optional[str]]":
    """Start the validation process."""
    session.set_stage(Stages.VALIDATING)
    cert_path = config.update_cert_path if config.signature_required else None

    validation_future = asyncio.ensure_future(
        loop.run_in_executor(
            None,
            actions.validate_update,
            downloaded_update_path,
            session.set_progress,
            cert_path,
        )
    )

    def validation_done(fut):
        exc = fut.exception()
        if exc:
            session.set_error(getattr(exc, "short", str(type(exc))), str(exc))
        else:
            rootfs_file = fut.result()
            loop.call_soon_threadsafe(_begin_write, session, loop, rootfs_file, actions)

    validation_future.add_done_callback(validation_done)
    return validation_future


@require_session
async def file_upload(request: web.Request, session: UpdateSession) -> web.Response:
    """Serves /update/:session/file

    Requires multipart (encoding doesn't matter) with a file field in the
    body called 'system-update.zip'. NOTE: OT2 will also support 'ot2-system.zip'
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
        if part.name not in VALID_UPDATE_PKG:
            LOG.info(f"Unknown field name {part.name} in file_upload, ignoring")
            await part.release()
        else:
            LOG.info(f"Writing {part.name}")
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

    _begin_validation(
        session,
        config.config_from_request(request),
        asyncio.get_event_loop(),
        os.path.join(session.download_path, part.name),
        maybe_actions,
    )

    return web.json_response(data=session.state, status=201)


@require_session
async def commit(request: web.Request, session: UpdateSession) -> web.Response:
    """Serves /update/:session/commit"""
    if session.stage != Stages.DONE:
        return web.json_response(
            data={
                "error": "not-ready",
                "message": f"System is not ready to commit the update "
                f"(currently {session.stage.value.short})",
            },
            status=409,
        )

    actions = update_actions.UpdateActionsInterface.from_request(request)
    if not actions:
        return web.json_response(
            data={
                "error": "no-actions-set",
                "message": "Internal error: no actions object for hardware",
            },
            status=500,
        )

    async with request.app[RESTART_LOCK_NAME]:
        try:
            with actions.mount_update() as new_part:
                actions.write_machine_id("/", new_part)
        except (OSError, CalledProcessError):
            LOG.exception("Failed to update machine-id")
        actions.commit_update()

        # Clean up stale update files from the download dir
        actions.clean_up(session.download_path)

        session.set_stage(Stages.READY_FOR_RESTART)

    return web.json_response(data=session.state, status=200)
