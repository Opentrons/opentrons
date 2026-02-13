"""Request and response models for the `/settings` endpoints."""

from textwrap import dedent
from typing import Annotated, Literal

import pydantic


class _StrictBaseModel(pydantic.BaseModel):
    model_config = {"strict": True}


class SettingsResponseData(_StrictBaseModel):
    """A response with the current settings."""

    accessControlEnabled: Annotated[
        bool,
        pydantic.Field(
            description=dedent(
                """\
                When enabled, authorization is enforced throughout the robot's HTTP APIs.
                Protected endpoints are blocked unless the request carries an
                OAuth 2 access token with the appropriate scopes. See the `/auth/oauth2`
                endpoints.

                When disabled (the default), all endpoints allow unauthenticated access.
                """
            )
        ),
    ]


class PatchSettingsRequestData(_StrictBaseModel):
    """A request to change the settings."""

    accessControlEnabled: Annotated[
        Literal[True] | None,
        pydantic.Field(
            description=dedent(
                """
                Set to `true` to enable access control. Omit or set to `null` to leave it unchanged.

                **Warning:** Once enabled, access control cannot be disabled without assistance from Opentrons!
                """
            )
        ),
    ]
