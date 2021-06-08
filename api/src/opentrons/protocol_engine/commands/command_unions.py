"""Union types of concrete command definitions."""
from typing import Union

from .add_labware_definition import (
    AddLabwareDefinition,
    AddLabwareDefinitionRequest,
    AddLabwareDefinitionResult,
)
from .aspirate import Aspirate, AspirateRequest, AspirateResult
from .dispense import Dispense, DispenseRequest, DispenseResult
from .drop_tip import DropTip, DropTipRequest, DropTipResult
from .load_labware import LoadLabware, LoadLabwareRequest, LoadLabwareResult
from .load_pipette import LoadPipette, LoadPipetteRequest, LoadPipetteResult
from .move_to_well import MoveToWell, MoveToWellRequest, MoveToWellResult
from .pick_up_tip import PickUpTip, PickUpTipRequest, PickUpTipResult

Command = Union[
    AddLabwareDefinition,
    Aspirate,
    Dispense,
    DropTip,
    LoadLabware,
    LoadPipette,
    MoveToWell,
    PickUpTip,
]

CommandRequest = Union[
    AddLabwareDefinitionRequest,
    AspirateRequest,
    DispenseRequest,
    DropTipRequest,
    LoadLabwareRequest,
    LoadPipetteRequest,
    MoveToWellRequest,
    PickUpTipRequest,
]

CommandResult = Union[
    AddLabwareDefinitionResult,
    AspirateResult,
    DispenseResult,
    DropTipResult,
    LoadLabwareResult,
    LoadPipetteResult,
    MoveToWellResult,
    PickUpTipResult,
]
