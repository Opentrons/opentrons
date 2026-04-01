"""Minimal typed view of GET /auth/openapi.json (OpenAPI 3 document)."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class OpenApiInfo(BaseModel):
    """``info`` object; extra keys preserved for forward compatibility."""

    model_config = ConfigDict(extra="allow")

    title: str = ""
    version: str = ""
    description: str | None = None


class OpenApiDocument(BaseModel):
    """Top-level OpenAPI document."""

    model_config = ConfigDict(extra="allow")

    openapi: str
    info: OpenApiInfo = Field(default_factory=OpenApiInfo)
    paths: dict[str, Any] = Field(default_factory=dict)
