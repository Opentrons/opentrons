"""Base data models.

Convenience wrappers and re-exports around Pydantic classes
for usage in our JSON HTTP API.
"""
from typing import Any, Dict
from pydantic import BaseModel as PydanticBaseModel, Field, Extra


class BaseModel(PydanticBaseModel):
    """A base data model.

    This model has the following behaviors / configuration:

    - Mutation is disallowed
    - `None` values are excluded when serializing to dicts/JSON
    """

    def dict(self, *args: Any, **kwargs: Any) -> Dict[str, Any]:
        """Always exclude `None` when serializing to an object."""
        kwargs["exclude_none"] = True
        return super().dict(*args, **kwargs)

    class Config:
        """Disallow mutation."""

        allow_mutation = False


__all__ = ["BaseModel", "Field", "Extra"]
