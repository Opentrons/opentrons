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
from .command import (
    PendingCommand,
    RunningCommand,
    CompletedCommand,
    FailedCommand,
    GenericCommandType
)

from .equipment import (
    LoadLabwareRequest,
    LoadLabwareResult,
    LoadPipetteRequest,
    LoadPipetteResult,
)

from .pipetting import (
    MoveToWellRequest,
    MoveToWellResult,
    PickUpTipRequest,
    PickUpTipResult,
    DropTipRequest,
    DropTipResult,
    AspirateRequest,
    AspirateResult,
    DispenseRequest,
    DispenseResult,
)

CommandRequestType = Union[
    LoadLabwareRequest,
    LoadPipetteRequest,
    MoveToWellRequest,
    PickUpTipRequest,
    DropTipRequest,
    AspirateRequest,
    DispenseRequest
]

CommandType = Union[
    GenericCommandType[LoadLabwareRequest, LoadLabwareResult],
    GenericCommandType[LoadPipetteRequest, LoadPipetteResult],
    GenericCommandType[MoveToWellRequest, MoveToWellResult],
    GenericCommandType[PickUpTipRequest, PickUpTipResult],
    GenericCommandType[AspirateRequest, AspirateResult],
    GenericCommandType[DispenseRequest, DispenseResult],
]

PendingCommandType = Union[
    PendingCommand[LoadLabwareRequest, LoadLabwareResult],
    PendingCommand[LoadPipetteRequest, LoadPipetteResult],
    PendingCommand[MoveToWellRequest, MoveToWellResult],
    PendingCommand[PickUpTipRequest, PickUpTipResult],
    PendingCommand[AspirateRequest, AspirateResult],
    PendingCommand[DispenseRequest, DispenseResult],
]

RunningCommandType = Union[
    RunningCommand[LoadLabwareRequest, LoadLabwareResult],
    RunningCommand[LoadPipetteRequest, LoadPipetteResult],
    RunningCommand[MoveToWellRequest, MoveToWellResult],
    RunningCommand[PickUpTipRequest, PickUpTipResult],
    RunningCommand[AspirateRequest, AspirateResult],
    RunningCommand[DispenseRequest, DispenseResult],
]

CompletedCommandType = Union[
    CompletedCommand[LoadLabwareRequest, LoadLabwareResult],
    CompletedCommand[LoadPipetteRequest, LoadPipetteResult],
    CompletedCommand[MoveToWellRequest, MoveToWellResult],
    CompletedCommand[PickUpTipRequest, PickUpTipResult],
    CompletedCommand[AspirateRequest, AspirateResult],
    CompletedCommand[DispenseRequest, DispenseResult],
]

FailedCommandType = Union[
    FailedCommand[LoadLabwareRequest],
    FailedCommand[LoadPipetteRequest],
    FailedCommand[MoveToWellRequest],
    FailedCommand[PickUpTipRequest],
    FailedCommand[AspirateRequest],
    FailedCommand[DispenseRequest],
]

__all__ = [
    # command lifecycle state and union types
    "PendingCommand",
    "RunningCommand",
    "CompletedCommand",
    "FailedCommandType",

    # type unions
    "CommandRequestType",
    "CommandResultType",
    "PendingCommandType",
    "RunningCommandType",
    "CompletedCommandType",
    "CommandType",

    # equipment commands
    "LoadLabwareRequest",
    "LoadLabwareResult",
    "LoadLabwareCommand",
    "LoadPipetteRequest",
    "LoadPipetteResult",
    "LoadPipetteCommand",

    # pipetting commands
    "MoveToWellRequest",
    "MoveToWellResult",
    "MoveToWellCommand",
    "PickUpTipRequest",
    "PickUpTipResult",
    "PickUpTipCommand",
    "DropTipRequest",
    "DropTipResult",
    "DropTipCommand",
    "AspirateRequest",
    "AspirateResult",
    "AspirateCommand",
    "DispenseRequest",
    "DispenseResult",
    "DispenseCommand"
]
