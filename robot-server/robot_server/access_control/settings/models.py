"""HTTP request/response models for access control settings."""

import textwrap
from typing import Annotated

import pydantic


class ResponseData(pydantic.BaseModel):
    """Response body data from the `/accessControl/settings` endpoints."""

    requireSignoffForProtocolLog: Annotated[
        bool,
        pydantic.Field(
            description="Require signoff for the protocol log.",
        ),
    ] = True
    requireLogsToBeSavedInApp: Annotated[
        bool,
        pydantic.Field(
            description="Require logs to be saved in app.",
        ),
    ] = False
    deleteOverMaxOnDiskProtocols: Annotated[
        bool,
        pydantic.Field(
            description="Delete protocol run logs on the robot when there are 20 protocol run records.",
        ),
    ] = True


class RequestData(pydantic.BaseModel):
    """Request body data for `PATCH /accessControl/settings`.

    Omitted fields are left unchanged. A value of ``None`` reverts
    the setting to its default (as defined in `ResponseData`).
    """

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
    requireLogsToBeSavedInApp: Annotated[
        bool | None,
        pydantic.Field(
            description=textwrap.dedent(
                """\
                If provided, sets whether logs should be saved in the app.
                """
            )
        ),
    ] = None
    deleteOverMaxOnDiskProtocols: Annotated[
        bool | None,
        pydantic.Field(
            description=textwrap.dedent(
                """\
                If provided, sets whether protocol run logs should be deleted
                when there are 20 protocol run records.
                """
            )
        ),
    ] = None
