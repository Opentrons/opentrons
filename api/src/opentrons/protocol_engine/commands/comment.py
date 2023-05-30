"""Comment command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, Type
from typing_extensions import Literal

from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

CommentCommandType = Literal["comment"]


class CommentParams(BaseModel):
    """Payload required to annotate execution with a comment."""

    message: str = Field(
        ...,
        description="A user-facing message",
    )


class CommentResult(BaseModel):
    """Result data from the execution of a Comment command."""


class CommentImplementation(AbstractCommandImpl[CommentParams, CommentResult]):
    """Comment command implementation."""

    def __init__(self, **kwargs: object) -> None:
        pass

    async def execute(self, params: CommentParams) -> CommentResult:
        """No operation taken other than capturing message in command."""
        return CommentResult()


class Comment(BaseCommand[CommentParams, CommentResult]):
    """Comment command model."""

    commandType: CommentCommandType = "comment"
    params: CommentParams
    result: Optional[CommentResult]

    _ImplementationCls: Type[CommentImplementation] = CommentImplementation


class CommentCreate(BaseCommandCreate[CommentParams]):
    """Comment command request model."""

    commandType: CommentCommandType = "comment"
    params: CommentParams

    _CommandCls: Type[Comment] = Comment
