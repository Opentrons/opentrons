"""
Protocol engine command models.

The `protocol_engine.commands` module contains the data models of all
command requests and results the engine is able to handle. It also contains
models and type definitions for command resources, where a command:

- May be pending, running, completed, or failed
- Contains request and, if applicable, result data
- Has timestamps for when it was created, started, completed, and/or failed

Request and result models in the module are defined using Pydantic, because
they are part of the public input / output of the engine, and need validation
and/or schema generation.
"""

from typing import Union

from .command import PendingCommand, RunningCommand, CompletedCommand, FailedCommand

from .load_labware import LoadLabwareRequest, LoadLabwareResult
from .load_pipette import LoadPipetteRequest, LoadPipetteResult
from .move_to_well import MoveToWellRequest, MoveToWellResult
from .pick_up_tip import PickUpTipRequest, PickUpTipResult


CommandRequestType = Union[
    LoadLabwareRequest,
    LoadPipetteRequest,
    MoveToWellRequest,
    PickUpTipRequest,
]

CommandResultType = Union[
    LoadLabwareResult,
    LoadPipetteResult,
    MoveToWellResult,
    PickUpTipResult,
]

PendingCommandType = Union[
    PendingCommand[LoadLabwareRequest, LoadLabwareResult],
    PendingCommand[LoadPipetteRequest, LoadPipetteResult],
    PendingCommand[MoveToWellRequest, MoveToWellResult],
    PendingCommand[PickUpTipRequest, PickUpTipResult],
]

RunningCommandType = Union[
    RunningCommand[LoadLabwareRequest, LoadLabwareResult],
    RunningCommand[LoadPipetteRequest, LoadPipetteResult],
    RunningCommand[MoveToWellRequest, MoveToWellResult],
    RunningCommand[PickUpTipRequest, PickUpTipResult],
]

CompletedCommandType = Union[
    CompletedCommand[LoadLabwareRequest, LoadLabwareResult],
    CompletedCommand[LoadPipetteRequest, LoadPipetteResult],
    CompletedCommand[MoveToWellRequest, MoveToWellResult],
    CompletedCommand[PickUpTipRequest, PickUpTipResult],
]

FailedCommandType = Union[
    FailedCommand[LoadLabwareRequest],
    FailedCommand[LoadPipetteRequest],
    FailedCommand[MoveToWellRequest],
    FailedCommand[PickUpTipRequest],
]

CommandType = Union[
    PendingCommandType,
    RunningCommandType,
    CompletedCommandType,
    FailedCommandType,
]

__all__ = [
    # command lifecycle state models
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

    # equipment request/result models
    "LoadLabwareRequest",
    "LoadLabwareResult",
    "LoadPipetteRequest",
    "LoadPipetteResult",

    # pipetting request/result models
    "MoveToWellRequest",
    "MoveToWellResult",
    "PickUpTipRequest",
    "PickUpTipResult",
]
