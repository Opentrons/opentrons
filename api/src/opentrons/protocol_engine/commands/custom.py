"""Custom protocol command.

A "custom" command contains arbitrary payload and result data.
It can be used by ProtocolEngine plugins to represent external
commands in state that a vanilla ProtocolEngine would not
know about.

This data model serves as a wrapper to ensure custom, arbitrary
data still adheres to the shapes that ProtocolEngine expects.
If you are implementing a custom command, you should probably
put your own disambiguation identifier in the payload.
"""
from pydantic import BaseModel, Extra
from typing import Optional, Type
from typing_extensions import Literal

from .command import BaseCommand, AbstractCommandImpl

CustomCommandType = Literal["custom"]


class CustomParams(BaseModel):
    """Payload used by a custom command."""

    class Config:
        """Allow arbitrary fields."""

        extra = Extra.allow


class CustomResult(BaseModel):
    """Result data from a custom command."""

    class Config:
        """Allow arbitrary fields."""

        extra = Extra.allow


class CustomImplementation(AbstractCommandImpl[CustomParams, CustomResult]):
    """Aspirate command implementation."""

    # TODO(mc, 2021-09-24): figure out how a plugin can specify a custom command
    # implementation. For now, raise so we remember not to allow this to happen.
    async def execute(self, params: CustomParams) -> CustomResult:
        """A custom command cannot be executed directly."""
        raise NotImplementedError("Custom commands cannot be executed directly.")


class Custom(BaseCommand[CustomParams, CustomResult]):
    """Custom command model."""

    commandType: CustomCommandType = "custom"
    params: CustomParams
    result: Optional[CustomResult]

    _ImplementationCls: Type[CustomImplementation] = CustomImplementation
