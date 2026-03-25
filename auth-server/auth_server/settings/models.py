"""Request and response models for the `/settings` endpoints."""

from datetime import timedelta
from typing import Annotated, Any, ClassVar, Literal, get_args

import pydantic


class _StrictBaseModel(pydantic.BaseModel):
    model_config = {"strict": True}


class _BaseSettings(_StrictBaseModel):
    """Canonical setting definitions.

    Field defaults define the system defaults for all settings.
    These are used to seed the database and to reset settings.
    Do not change them without coordinating.
    """

    # TODO(tz, 2026-03-24): https://opentrons.atlassian.net/browse/EXEC-2468
    accessControlEnabled: bool = pydantic.Field(
        default=False,
        description="When enabled, authorization is enforced throughout the robot's HTTP APIs. "
        "Protected endpoints are blocked unless the request carries an OAuth 2 access token "
        "with the appropriate scopes. See the `/auth/oauth2` endpoints. "
        "When disabled (the default), all endpoints allow unauthenticated access.",
    )
    maxNumberOfLoginAttempts: int | None = pydantic.Field(
        default=5,
        description="Max number of login attempts before account deactivation.",
    )
    passwordResetTime: timedelta | None = pydantic.Field(
        default=None,
        description="Duration until password must be changed.",
    )
    passwordComplexityMinimumLength: int | None = pydantic.Field(
        default=None,
        description="Minimum length of password.",
    )
    passwordComplexitySpecialCharacters: bool | None = pydantic.Field(
        default=None,
        description="Require special characters in password.",
    )
    idleLogout: timedelta = pydantic.Field(
        default=timedelta(minutes=3),
        description="Duration until account is logged out due to inactivity.",
    )
    requireReasonForInteraction: bool = pydantic.Field(
        default=True,
        description="Require reason for interaction.",
    )
    minLengthOfReasonForInteraction: int | None = pydantic.Field(
        default=None,
        description="Minimum length of reason for interaction.",
    )


class SettingsResponseData(_BaseSettings):
    """A response with the current settings."""

    pass


def _make_all_fields_optional(
    source: type[pydantic.BaseModel],
) -> dict[str, Any]:
    """Derive field definitions from `source` with every default set to None and type made Optional."""
    fields: dict[str, Any] = {}
    for name, info in source.model_fields.items():
        ann: Any = info.annotation
        args = get_args(ann) or ()
        needs_lax = timedelta in args or ann is timedelta  # check BEFORE modifying ann
        if type(None) not in args:
            ann = ann | None
        field_kwargs: dict[str, Any] = {"description": info.description}
        if needs_lax:
            field_kwargs["strict"] = False
        fields[name] = (Annotated[ann, pydantic.Field(**field_kwargs)], None)
    return fields


_PatchSettingsBase = pydantic.create_model(
    "_PatchSettingsBase",
    __base__=_StrictBaseModel,
    **_make_all_fields_optional(_BaseSettings),
)


class PatchSettingsRequestData(_PatchSettingsBase):  # type: ignore[valid-type,misc]
    """A request to change the settings.

    All fields default to ``None``, meaning "leave unchanged".
    Only fields explicitly provided in the request body will be updated.
    """

    accessControlEnabled: Annotated[
        Literal[True] | None,
        pydantic.Field(
            description="Set to `true` to enable access control. "
            "Once enabled, access control cannot be disabled without assistance from Opentrons."
        ),
    ] = None

    _NON_NULLABLE_FIELDS: ClassVar[frozenset[str]] = frozenset(
        {
            name
            for name, info in _BaseSettings.model_fields.items()
            if type(None) not in (get_args(info.annotation) or ())
        }
    )

    @pydantic.model_validator(mode="before")
    @classmethod
    def reject_explicit_nulls(cls, data: Any) -> Any:
        """Reject explicit nulls for non-nullable fields."""
        if isinstance(data, dict):
            for field in cls._NON_NULLABLE_FIELDS:
                if field in data and data[field] is None:
                    raise ValueError(f"{field} cannot be null")
        return data
