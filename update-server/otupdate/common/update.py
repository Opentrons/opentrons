"""
endpoints for running software updates

This has endpoints like update session management, validation, and execution
"""

import asyncio
import dataclasses
import json
import logging
import os
from subprocess import CalledProcessError
from typing import Annotated, Optional, Self

import fastapi
from fastapi.responses import JSONResponse

from server_utils.audit.audit_server import (
    Client as AuditClient,
)
from server_utils.audit.audit_server import (
    SubmitAuditLogMessageData,
)
from server_utils.audit.fastapi import get_audit_client, get_audit_logger
from server_utils.auth.resource_server.fastapi import (
    RequireAuthenticationResult,
    require_admin_creds,
    require_authentication,
    require_scopes,
)
from server_utils.auth.resource_server.types import AuthenticatedResult
from server_utils.auth.scopes import Scope
from server_utils.fastapi_utils.app_state import AppState, get_app_state

from . import config, multipart, update_actions
from .api_error import APIError, ErrorBody
from .control import get_restart_lock, no_actions_set_error
from .session import Stages, UpdateSession, get_current_session, set_current_session
from otupdate.openembedded.update_actions import UPDATE_PKG_OE

VALID_UPDATE_PKG = UPDATE_PKG_OE
_UPDATE_SERVER_SYSTEM_NAME = "system"
_UPDATE_SERVER_SYSTEM_FULLNAME = "authentication subsystem"

LOG = logging.getLogger(__name__)

router = fastapi.APIRouter()


def get_session(
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
) -> Optional[UpdateSession]:
    """A FastAPI dependency for the active update session, if there is one.

    Use this in endpoints that tolerate there being no session. Endpoints that
    name a session in their path should use `require_session()` instead.
    """
    return get_current_session(app_state)


def require_session(
    session: str,
    current_session: Annotated[Optional[UpdateSession], fastapi.Depends(get_session)],
) -> UpdateSession:
    """A FastAPI dependency to look up the session named by the request's path."""
    if not current_session or session != current_session.token:
        LOG.warning(f"request for invalid session {session}")
        raise APIError(
            404,
            ErrorBody(error="bad-token", message=f"No such session {session}"),
        )
    return current_session


@router.post(
    "/server/update/begin",
    status_code=201,
    summary="Create an update session.",
    dependencies=[
        fastapi.Depends(require_scopes(Scope.UPDATES_WRITE)),
        fastapi.Depends(
            require_admin_creds("requireAdminCredsWhenUpdatingRobotSoftware")
        ),
        fastapi.Depends(get_audit_logger("start update session")),
    ],
)
async def begin(
    request: fastapi.Request,
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
    current_session: Annotated[Optional[UpdateSession], fastapi.Depends(get_session)],
    server_config: Annotated[config.Config, fastapi.Depends(config.get_config)],
) -> JSONResponse:
    """Begin (create) a session.

    The request body may be empty, or it may be a JSON object like:

    {
      // If false, the client must manually call `POST /server/update/{session}/commit`
      // and `POST /server/restart` at the appropriate times. If true, the server
      // will do those automatically, making the update fire-and-forget.
      //
      // The default is false.
      //
      // Older servers will not process this field and will always behave as if it's
      // false.
      auto_commit_and_restart: boolean
    }

    The response body will be like:

    {
      // A token identifying the newly-created session, for use in other endpoints.
      token: string

      // If the server is new enough to understand the auto_commit_and_restart input,
      // it will be reflected here.
      //
      // Clients should use this to detect whether they need to commit the update and
      // restart explicitly, or if they can rely on the server.
      auto_commit_and_restart?: boolean
    }
    """
    if current_session is not None:
        LOG.warning("begin: requested with active session")
        raise APIError(
            409,
            ErrorBody(
                error="session-already-active",
                message="An update session is already active on this robot",
            ),
        )
        # fixme(mm, 2026-07-06): There's a concurrency hazard here because we're checking
        # for a preexisting session and setting the new session non-atomically. Two
        # concurrent requests can result in two simultaneous active sessions.

    try:
        options = await _BeginSessionOptions.parse_from_request(request)
    except _BeginSessionOptions.ParseError as e:
        raise APIError(
            400,
            ErrorBody(error="invalid-request", message=e.message_for_response),
        ) from e

    session = UpdateSession(
        storage_path=server_config.download_storage_path,
        auto_commit_and_restart=options.auto_commit_and_restart,
    )
    set_current_session(app_state, session)
    return JSONResponse(
        status_code=201,
        content={
            "token": session.token,
            "auto_commit_and_restart": session.auto_commit_and_restart,
        },
    )


@router.get("/server/update/{session}/status", summary="Report an update's progress.")
async def status(
    session: Annotated[UpdateSession, fastapi.Depends(require_session)],
) -> JSONResponse:
    return JSONResponse(status_code=200, content=dict(session.state))


@router.post(
    "/server/update/{session}/file",
    status_code=201,
    summary="Upload a system update file.",
    dependencies=[
        fastapi.Depends(require_scopes(Scope.UPDATES_WRITE)),
        fastapi.Depends(
            require_admin_creds("requireAdminCredsWhenUpdatingRobotSoftware")
        ),
        fastapi.Depends(get_audit_logger("upload update file")),
    ],
)
async def file_upload(
    request: fastapi.Request,
    session: Annotated[UpdateSession, fastapi.Depends(require_session)],
    server_config: Annotated[config.Config, fastapi.Depends(config.get_config)],
    actions: Annotated[
        Optional[update_actions.UpdateActionsInterface],
        fastapi.Depends(update_actions.get_update_actions),
    ],
    restart_lock: Annotated[asyncio.Lock, fastapi.Depends(get_restart_lock)],
    authentication: Annotated[
        RequireAuthenticationResult, fastapi.Depends(require_authentication)
    ],
    audit_client: Annotated[AuditClient, fastapi.Depends(get_audit_client)],
) -> JSONResponse:
    """Serves /update/:session/file

    Requires multipart (encoding doesn't matter) with a file field in the
    body called 'system-update.zip'. NOTE: the OT-2 variant (no longer in
    this repo) also supported 'ot2-system.zip'.
    """
    if session.stage != Stages.AWAITING_FILE:
        raise APIError(
            409,
            ErrorBody(
                error="file-already-uploaded",
                message="A file has already been sent for this update",
            ),
        )

    found_names = await multipart.save_parts_to_directory(
        request,
        accepted_field_names=VALID_UPDATE_PKG,
        destination_directory=session.download_path,
    )

    if not actions:
        raise no_actions_set_error()

    if not found_names:
        raise APIError(
            400,
            ErrorBody(
                error="no-file-name",
                message="Request error: no field name for system zip",
            ),
        )
    # set stage now to make sure that it takes effect in the response
    # we're about to send, since we're now doing the validation in a
    # background task that won't get a chance to run before the response is
    # created
    session.set_stage(Stages.VALIDATING)

    # Only one file can be validated and written. If the request carried several
    # acceptable parts, the last one is the one left on disk.
    _begin_validate_and_write(
        session,
        server_config,
        os.path.join(session.download_path, found_names[-1]),
        actions,
        restart_lock,
        audit_client,
        authentication,
    )

    return JSONResponse(status_code=201, content=dict(session.state))


@router.post(
    "/server/update/{session}/commit",
    summary="Commit a validated update.",
    dependencies=[
        fastapi.Depends(require_scopes(Scope.UPDATES_WRITE)),
        fastapi.Depends(
            require_admin_creds("requireAdminCredsWhenUpdatingRobotSoftware")
        ),
        fastapi.Depends(get_audit_logger("commit update")),
    ],
)
async def commit(
    session: Annotated[UpdateSession, fastapi.Depends(require_session)],
    actions: Annotated[
        Optional[update_actions.UpdateActionsInterface],
        fastapi.Depends(update_actions.get_update_actions),
    ],
    restart_lock: Annotated[asyncio.Lock, fastapi.Depends(get_restart_lock)],
) -> JSONResponse:
    """Serves /update/:session/commit"""
    if session.stage != Stages.DONE:
        # fixme(mm, 2026-07-07): This stage check is insufficient; it can allow
        # multiple commits to run concurrently on a single session, because we
        # non-atomically enforce Stages.DONE, do commit process, and then set
        # Stages.READY_FOR_RESTART.
        raise APIError(
            409,
            ErrorBody(
                error="not-ready",
                message=f"System is not ready to commit the update "
                f"(currently {session.stage.value.short})",
            ),
        )

    if not actions:
        raise no_actions_set_error()

    await _commit(restart_lock, actions, session)

    return JSONResponse(status_code=200, content=dict(session.state))


@router.post(
    "/server/update/cancel",
    summary="Cancel the active update session.",
    dependencies=[
        fastapi.Depends(require_scopes(Scope.UPDATES_WRITE)),
        fastapi.Depends(
            require_admin_creds("requireAdminCredsWhenUpdatingRobotSoftware")
        ),
        fastapi.Depends(get_audit_logger("cancel update")),
    ],
)
async def cancel(
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
    session: Annotated[Optional[UpdateSession], fastapi.Depends(get_session)],
) -> JSONResponse:
    if session is not None:
        # fixme(mm, 2026-07-06):
        #   * This is a concurrency hazard: it might close a session and delete its
        #     storage while a background task is still using it.
        #   * session.close() currently only cleans up storage. We also need to clean
        #     up background tasks.
        session.close()
        set_current_session(app_state, None)
    return JSONResponse(status_code=200, content={"message": "Session cancelled"})


@dataclasses.dataclass
class _BeginSessionOptions:
    """Client-provided options from a "create session" request body."""

    auto_commit_and_restart: bool

    @classmethod
    async def parse_from_request(cls, request: fastapi.Request) -> Self:
        text = (await request.body()).decode()

        if text.strip() == "":
            return cls(auto_commit_and_restart=False)

        try:
            parsed_json = json.loads(text)
        except json.JSONDecodeError as e:
            # str(e) is bad practice in general, but it's good for JSONDecodeError.
            raise cls.ParseError(str(e)) from e

        if not isinstance(parsed_json, dict):
            raise cls.ParseError("Request body must be a JSON object")

        if "auto_commit_and_restart" in parsed_json:
            auto_commit_and_restart = parsed_json["auto_commit_and_restart"]
            if not isinstance(auto_commit_and_restart, bool):
                raise cls.ParseError("auto_commit_and_restart must be a boolean")
        else:
            auto_commit_and_restart = False

        return cls(auto_commit_and_restart=auto_commit_and_restart)

    class ParseError(Exception):
        """Raised for invalid request bodies."""

        def __init__(self, message_for_response: str) -> None:
            super().__init__(message_for_response)
            self.message_for_response = message_for_response


def _begin_validate_and_write(
    session: UpdateSession,
    config: config.Config,
    downloaded_update_path: str,
    actions: update_actions.UpdateActionsInterface,
    restart_lock: asyncio.Lock,
    audit_client: AuditClient,
    authentication: RequireAuthenticationResult,
) -> None:
    """Start validating and writing the file in the background.

    Depending on the parameters passed in when the session was created, it may
    then auto-commit and auto-restart, or it may wait for explicit confirmation from
    the client.
    """

    async def background_task() -> None:
        session.set_stage(Stages.VALIDATING)
        cert_path = config.update_cert_path if config.signature_required else None
        rootfs_file = await asyncio.to_thread(
            actions.validate_update,
            downloaded_update_path,
            session.set_progress,
            cert_path,
        )

        session.set_progress(0)
        session.set_stage(Stages.WRITING)
        await asyncio.to_thread(actions.write_update, rootfs_file, session.set_progress)

        LOG.info(f"Finished update session {session}")
        session.set_stage(Stages.DONE)

        if not session.auto_commit_and_restart:
            return
        await _commit(
            restart_lock,
            actions,
            session,
        )
        if isinstance(authentication, AuthenticatedResult):
            auth_string = f", update started by user={authentication.username} name={authentication.fullname}"
        else:
            auth_string = ""
        await audit_client.submit_log_message(
            SubmitAuditLogMessageData(
                action="autocommit update",
                accountName=_UPDATE_SERVER_SYSTEM_NAME,
                legalName=_UPDATE_SERVER_SYSTEM_FULLNAME,
                message="Committing update file and rebooting" + auth_string,
                reason=None,
            )
        )
        actions.restart()

    async def background_task_with_error_handling() -> None:
        try:
            await background_task()
        except Exception as exc:
            LOG.exception(
                f"Error in background task for session {session.token}.", exc_info=exc
            )
            session.set_error(getattr(exc, "short", str(type(exc))), str(exc))

    asyncio.create_task(background_task_with_error_handling())


async def _commit(
    restart_lock: asyncio.Lock,
    actions: update_actions.UpdateActionsInterface,
    session: UpdateSession,
) -> None:
    # todo(mm, 2026-06-26): What is the "restart lock" protecting?
    # Do we also need the "shutdown lock" here?
    async with restart_lock:
        try:
            with actions.mount_update() as new_part:
                actions.write_machine_id("/", new_part)
        except (OSError, CalledProcessError):
            LOG.exception("Failed to update machine-id")
        actions.commit_update()

        # Clean up stale update files from the download dir
        actions.clean_up(session.download_path)

        session.set_stage(Stages.READY_FOR_RESTART)
