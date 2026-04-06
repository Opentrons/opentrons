"""HTTP request/response models for access control settings."""

import textwrap
from typing import Annotated

import pydantic


class ResponseData(pydantic.BaseModel):
    """Response body data from the `/accessControl/settings` endpoints."""

    requireAdminCredsWhenUpdatingRobotSoftware: Annotated[
        bool,
        pydantic.Field(
            description="Whether admin credentials are required when updating robot software.",
        ),
    ] = True
    requireAdminCredsWhenSendingProtocolToRobot: Annotated[
        bool,
        pydantic.Field(
            description="Whether admin credentials are required when sending a protocol to the robot.",
        ),
    ] = True
    requireAdminCredsForSignoffProtocol: Annotated[
        bool,
        pydantic.Field(
            description="Whether admin credentials are required for signing off on a protocol.",
        ),
    ] = True
    requireSignoffForProtocolLog: Annotated[
        bool,
        pydantic.Field(
            description="Whether signoff is required for the protocol log.",
        ),
    ] = False


class RequestData(pydantic.BaseModel):
    """Request body data for `PATCH /accessControl/settings`.

    Omitted fields are left unchanged. A value of ``None`` reverts
    the setting to its default (as defined in `ResponseData`).
    """

    requireAdminCredsWhenUpdatingRobotSoftware: Annotated[
        bool | None,
        pydantic.Field(
            description=textwrap.dedent(
                """\
                If provided, sets whether admin credentials are required
                when updating robot software.
                """
            )
        ),
    ] = None
    requireAdminCredsWhenSendingProtocolToRobot: Annotated[
        bool | None,
        pydantic.Field(
            description=textwrap.dedent(
                """\
                If provided, sets whether admin credentials are required
                when sending a protocol to the robot.
                """
            )
        ),
    ] = None
    requireAdminCredsForSignoffProtocol: Annotated[
        bool | None,
        pydantic.Field(
            description=textwrap.dedent(
                """\
                If provided, sets whether admin credentials are required
                for signing off on a protocol.
                """
            )
        ),
    ] = None
    requireSignoffForProtocolLog: Annotated[
        bool | None,
        pydantic.Field(
            description=textwrap.dedent(
                """\
                If provided, sets whether signoff is required
                for the protocol log.
                """
            )
        ),
    ] = None
