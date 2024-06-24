"""Command models to close the lid on an Absorbance Reader."""
from __future__ import annotations
from typing import Optional, Literal, TYPE_CHECKING
from typing_extensions import Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ..move_labware import MoveLabwareResult
from ...errors.error_occurrence import ErrorOccurrence
from opentrons.protocol_engine.types import (
    LabwareOffsetVector,
    LabwareMovementOffsetData,
    AddressableAreaLocation,
)
from opentrons.protocol_engine.resources import labware_validation

if TYPE_CHECKING:
    from opentrons.protocol_engine.state import StateView
    from opentrons.protocol_engine.execution import (
        EquipmentHandler,
        LabwareMovementHandler,
    )


OpenLidCommandType = Literal["absorbanceReader/openLid"]


class OpenLidParams(BaseModel):
    """Input parameters to open the lid on an absorbance reading."""

    moduleId: str = Field(..., description="Unique ID of the absorbance reader.")
    pickUpOffset: Optional[LabwareOffsetVector] = Field(
        None,
        description="Offset to use when picking up labware. "
        "Experimental param, subject to change",
    )
    dropOffset: Optional[LabwareOffsetVector] = Field(
        None,
        description="Offset to use when dropping off labware. "
        "Experimental param, subject to change",
    )


class OpenLidResult(MoveLabwareResult):
    """Result data from opening the lid on an aborbance reading."""


class OpenLidImpl(AbstractCommandImpl[OpenLidParams, SuccessData[OpenLidResult, None]]):
    """Execution implementation of opening the lid on an Absorbance Reader."""

    def __init__(
        self,
        state_view: StateView,
        equipment: EquipmentHandler,
        labware_movement: LabwareMovementHandler,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment
        self._labware_movement = labware_movement

    async def execute(self, params: OpenLidParams) -> SuccessData[OpenLidResult, None]:
        """Move the absorbance reader lid from the module to the lid dock."""
        abs_reader_substate = self._state_view.modules.get_absorbance_reader_substate(
            module_id=params.moduleId
        )
        abs_reader_substate.raise_if_lid_status_not_expected(lid_on_expected=True)

        # lid is on the module
        lid_id = self._state_view.labware.get_id_by_module(
            abs_reader_substate.module_id
        )
        current_lid = self._state_view.labware.get(lid_id)
        assert labware_validation.is_absorbance_reader_lid(current_lid.loadName)

        # lid_dock_loc = self._state_view.modules.get_lid_dock_slot(abs_reader_substate.module_id)
        lid_dock_loc = AddressableAreaLocation(
            addressableAreaName="absorbanceReaderV1LidDockD4"
        )

        new_offset_id = None
        # new_offset_id = self._equipment.find_applicable_labware_offset_id(
        #     labware_definition_uri=current_lid.definitionUri,
        #     labware_location=lid_dock_loc,
        # )

        validated_current_loc = self._state_view.geometry.ensure_valid_gripper_location(
            current_lid.location
        )
        validated_new_loc = self._state_view.geometry.ensure_valid_gripper_location(
            lid_dock_loc
        )
        # TODO (AA): we probably don't need this, but let's keep it until we're sure
        user_offset_data = LabwareMovementOffsetData(
            pickUpOffset=params.pickUpOffset or LabwareOffsetVector(x=0, y=0, z=0),
            dropOffset=params.dropOffset or LabwareOffsetVector(x=0, y=0, z=0),
        )

        # Allow propagation of ModuleNotAttachedError.
        abs_reader = self._equipment.get_module_hardware_api(
            abs_reader_substate.module_id
        )

        new_offset_id = None
        if abs_reader is not None:

            # Skips gripper moves when using virtual gripper
            await self._labware_movement.move_labware_with_gripper(
                labware_id=current_lid.id,
                current_location=validated_current_loc,
                new_location=validated_new_loc,
                user_offset_data=user_offset_data,
                post_drop_slide_offset=None,
            )
        return SuccessData(
            public=OpenLidResult(offsetId=new_offset_id),
            private=None,
        )


class OpenLid(BaseCommand[OpenLidParams, OpenLidResult, ErrorOccurrence]):
    """A command to open the lid on an Absorbance Reader."""

    commandType: OpenLidCommandType = "absorbanceReader/openLid"
    params: OpenLidParams
    result: Optional[OpenLidResult]

    _ImplementationCls: Type[OpenLidImpl] = OpenLidImpl


class OpenLidCreate(BaseCommandCreate[OpenLidParams]):
    """A request to execute an Absorbance Reader open lid command."""

    commandType: OpenLidCommandType = "absorbanceReader/openLid"
    params: OpenLidParams

    _CommandCls: Type[OpenLid] = OpenLid
