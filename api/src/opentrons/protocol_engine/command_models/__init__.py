"""
Protocol engine command models.

The `protocol_engine.command_models` module contains the data models of all
command requests and results the engine is able to handle. It also contains
models and type definitions for command resources, where a command:

- May be pending, running, completed, or failed
- Contains request and, if applicable, result data
- Has timestamps for when it was created, started, completed, and/or failed
"""

from typing import Union

from .command import (
    PendingCommand,
    RunningCommand,
    CompletedCommand,
    FailedCommand,
    GenericCommandType,
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
    DispenseRequest,
]


CommandResultType = Union[
    LoadLabwareResult,
    LoadPipetteResult,
    MoveToWellResult,
    PickUpTipResult,
    DropTipResult,
    AspirateResult,
    DispenseResult,
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
    "FailedCommand",

    # type unions
    "CommandRequestType",
    "CommandResultType",
    "PendingCommandType",
    "RunningCommandType",
    "CompletedCommandType",
    "FailedCommandType",
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
