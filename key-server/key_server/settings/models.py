"""Request and response models for the `/settings` endpoints."""

import pydantic


class _StrictBaseModel(pydantic.BaseModel):
    model_config = {"strict": True}


class SettingsResponseData(_StrictBaseModel):
    """A response with the current settings."""


class PatchSettingsRequestData(_StrictBaseModel):
    """A request to change the settings."""
