"""
Protocol engine commands.

The `protocol_engine.commands` module contains the data models of all commands
that the engine is able to handle. A command consists of:

- A unique identifier for a single instance of a command request
- An identifying type
- A payload

A command is executed by the `protocol_engine`. Command execution has the
following lifecycle:

0. Command created and assigned an identifier
1. Command state added to protocol state
2. Command side-effects executed based on type and payload; e.g.
    - Calls made to the `hardware_control` module
    - Data read from the filesystem
3. Relevent data is from side-effects is loaded into a command result
4. Command result is added to protocol state
"""
from typing import Union
from .command import PendingCommand, RunningCommand, CompletedCommand

from .equipment import (
    LoadLabwareRequest,
    LoadLabwareResponse,
    LoadLabwareCommand,
    LoadPipetteRequest,
    LoadPipetteResponse,
    LoadPipetteCommand,
)

from .pipetting import (
    MoveToWellRequest,
    MoveToWellResponse,
    MoveToWellCommand,
    PickUpTipRequest,
    PickUpTipResponse,
    PickUpTipCommand,
    DropTipRequest,
    DropTipResponse,
    DropTipCommand,
    AspirateRequest,
    AspirateResponse,
    AspirateCommand,
    DispenseRequest,
    DispenseResponse,
    DispenseCommand
)

CommandRequest = Union[
    LoadLabwareRequest,
    LoadPipetteRequest,
    MoveToWellRequest,
    PickUpTipRequest,
    DropTipRequest,
    AspirateRequest,
    DispenseRequest
]

CommandResponse = Union[
    LoadLabwareResponse,
    LoadPipetteResponse,
    MoveToWellResponse,
    PickUpTipResponse,
    DropTipResponse,
    AspirateResponse,
    DispenseResponse
]

Command = Union[
    LoadLabwareCommand,
    LoadPipetteCommand,
    MoveToWellCommand,
    PickUpTipCommand,
    DropTipCommand,
    AspirateCommand,
    DispenseCommand,
]

__all__ = [
    # command lifecycle state
    "PendingCommand",
    "RunningCommand",
    "CompletedCommand",

    # type unions
    "CommandRequest",
    "CommandResponse",
    "Command",

    # equipment commands
    "LoadLabwareRequest",
    "LoadLabwareResponse",
    "LoadLabwareCommand",
    "LoadPipetteRequest",
    "LoadPipetteResponse",
    "LoadPipetteCommand",

    # pipetting commands
    "MoveToWellRequest",
    "MoveToWellResponse",
    "MoveToWellCommand",
    "PickUpTipRequest",
    "PickUpTipResponse",
    "PickUpTipCommand",
    "DropTipRequest",
    "DropTipResponse",
    "DropTipCommand",
    "AspirateRequest",
    "AspirateResponse",
    "AspirateCommand",
    "DispenseRequest",
    "DispenseResponse",
    "DispenseCommand"
]
