"""HTTP request/response models for error recovery settings."""


import textwrap
from typing import Annotated
import pydantic


class ResponseData(pydantic.BaseModel):
    """Response body data from the `/errorRecovery/settings` endpoints."""

    enabled: Annotated[
        bool,
        pydantic.Field(
            description=textwrap.dedent(
                """\
                Whether error recovery mode is globally enabled.
                See `PATCH /errorRecovery/settings`.
                """
            )
        ),
    ]


class RequestData(pydantic.BaseModel):
    """Request body data for `PATCH /errorRecovery/settings`."""

    enabled: Annotated[
        bool | None,
        pydantic.Field(
            description=textwrap.dedent(
                """\
                If provided, globally enables or disables error recovery mode.

                If this is `true`, a run (see the `/runs` endpoints) will *potentially*
                enter recovery mode when an error happens, depending on the details of
                the error and depending on `/runs/{runId}/errorRecoveryPolicy`.

                If this is `false`, a run will just fail if it encounters an error.

                The default is `true`. This currently only has an effect on Flex robots.
                On OT-2s, error recovery is not supported.
                """
            )
        ),
    ] = None
