"""Command models to close the lid on an Absorbance Reader."""
from __future__ import annotations
from typing import Optional, Literal, TYPE_CHECKING
from typing_extensions import Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
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


CloseLidCommandType = Literal["absorbanceReader/closeLid"]


class CloseLidParams(BaseModel):
    """Input parameters to close the lid on an absorbance reading."""

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


class CloseLidResult(BaseModel):
    """Result data from closing the lid on an aborbance reading."""

    offsetId: Optional[str] = Field(
        # Default `None` instead of `...` so this field shows up as non-required in
        # OpenAPI. The server is allowed to omit it or make it null.
        None,
        description=(
            "An ID referencing the labware offset that will apply to this labware"
            " now that it's in the new location."
            " This offset will be in effect until the labware is moved"
            " with another `moveLabware` command."
            " Null or undefined means no offset applies,"
            " so the default of (0, 0, 0) will be used."
        ),
    )


class CloseLidImpl(
    AbstractCommandImpl[CloseLidParams, SuccessData[CloseLidResult, None]]
):
    """Execution implementation of closing the lid on an Absorbance Reader."""

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

    async def execute(
        self, params: CloseLidParams
    ) -> SuccessData[CloseLidResult, None]:
        """Execute the close lid command."""

        mod_substate = self._state_view.modules.get_absorbance_reader_substate(
            module_id=params.moduleId
        )
        # Make sure the lid is open
        mod_substate.raise_if_lid_status_not_expected(lid_on_expected=False)

        # Allow propagation of ModuleNotAttachedError.
        mod_hw = self._equipment.get_module_hardware_api(mod_substate.module_id)

        # lid should currently be docked

        lid_dock_slot = self._state_view.modules.get_lid_dock_slot(
            mod_substate.module_id
        )
        loaded_lid = self._state_view.labware.get_by_slot(lid_dock_slot)
        assert (
            loaded_lid is not None
        ), "Absorbance Reader lid is not present in the lid dock."
        assert labware_validation.is_absorbance_reader_lid(loaded_lid.loadName)

        current_location = loaded_lid.location
        validated_current_location = (
            self._state_view.geometry.ensure_valid_gripper_location(current_location)
        )

        # we need to move the lid onto the module
        new_location = self._state_view.modules.get_location(mod_substate.module_id)
        validated_new_location = (
            self._state_view.geometry.ensure_valid_gripper_location(new_location)
        )

        # TODO (AA): we probably don't need this, but let's keep it until we're sure
        user_offset_data = LabwareMovementOffsetData(
            pickUpOffset=params.pickUpOffset or LabwareOffsetVector(x=0, y=0, z=0),
            dropOffset=params.dropOffset or LabwareOffsetVector(x=0, y=0, z=0),
        )

        # Skips gripper moves when using virtual gripper
        await self._labware_movement.move_labware_with_gripper(
            labware_id=loaded_lid.id,
            current_location=validated_current_location,
            new_location=validated_new_location,
            user_offset_data=user_offset_data,
            post_drop_slide_offset=None,
        )

        new_offset_id = self._equipment.find_applicable_labware_offset_id(
            labware_definition_uri=loaded_lid.definitionUri,
            labware_location=new_location,
        )
        return SuccessData(
            public=CloseLidResult(offsetId=new_offset_id),
            private=None,
        )


class CloseLid(BaseCommand[CloseLidParams, CloseLidResult, ErrorOccurrence]):
    """A command to close the lid on an Absorbance Reader."""

    commandType: CloseLidCommandType = "absorbanceReader/closeLid"
    params: CloseLidParams
    result: Optional[CloseLidResult]

    _ImplementationCls: Type[CloseLidImpl] = CloseLidImpl


class CloseLidCreate(BaseCommandCreate[CloseLidParams]):
    """A request to execute an Absorbance Reader close lid command."""

    commandType: CloseLidCommandType = "absorbanceReader/closeLid"
    params: CloseLidParams

    _CommandCls: Type[CloseLid] = CloseLid
