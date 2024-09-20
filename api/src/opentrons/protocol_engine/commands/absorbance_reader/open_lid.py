"""Command models to close the lid on an Absorbance Reader."""
from __future__ import annotations
from typing import Optional, Literal, TYPE_CHECKING
from typing_extensions import Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ...errors.error_occurrence import ErrorOccurrence
from ...errors import CannotPerformModuleAction

from .types import MoveLidResult
from opentrons.protocol_engine.resources import labware_validation
from opentrons.protocol_engine.types import AddressableAreaLocation

from opentrons.drivers.types import AbsorbanceReaderLidStatus

from ...state.update_types import StateUpdate, BaseLabwareData


if TYPE_CHECKING:
    from opentrons.protocol_engine.state.state import StateView
    from opentrons.protocol_engine.execution import (
        EquipmentHandler,
        LabwareMovementHandler,
    )


OpenLidCommandType = Literal["absorbanceReader/openLid"]


class OpenLidParams(BaseModel):
    """Input parameters to open the lid on an absorbance reading."""

    moduleId: str = Field(..., description="Unique ID of the absorbance reader.")


class OpenLidResult(MoveLidResult):
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
        state_update = StateUpdate()

        mod_substate = self._state_view.modules.get_absorbance_reader_substate(
            module_id=params.moduleId
        )
        # lid should currently be on the module
        assert mod_substate.lid_id is not None
        loaded_lid = self._state_view.labware.get(mod_substate.lid_id)
        assert labware_validation.is_absorbance_reader_lid(loaded_lid.loadName)

        hardware_lid_status = AbsorbanceReaderLidStatus.ON
        # If the lid is closed, if the lid is open No-op out
        if not self._state_view.config.use_virtual_modules:
            abs_reader = self._equipment.get_module_hardware_api(mod_substate.module_id)

            if abs_reader is not None:
                result = await abs_reader.get_current_lid_status()
                hardware_lid_status = result
            else:
                raise CannotPerformModuleAction(
                    "Could not reach the Hardware API for Opentrons Plate Reader Module."
                )

        # If the lid is already OFF, no-op the lid removal
        if hardware_lid_status is AbsorbanceReaderLidStatus.OFF:
            assert isinstance(loaded_lid.location, AddressableAreaLocation)
            new_location = loaded_lid.location
            new_offset_id = self._equipment.find_applicable_labware_offset_id(
                labware_definition_uri=loaded_lid.definitionUri,
                labware_location=loaded_lid.location,
            )
        else:
            # Allow propagation of ModuleNotAttachedError.
            _ = self._equipment.get_module_hardware_api(mod_substate.module_id)

            absorbance_model = self._state_view.modules.get_requested_model(
                params.moduleId
            )
            assert absorbance_model is not None
            current_location = AddressableAreaLocation(
                addressableAreaName=self._state_view.modules.ensure_and_convert_module_fixture_location(
                    deck_slot=self._state_view.modules.get_location(
                        params.moduleId
                    ).slotName,
                    deck_type=self._state_view.config.deck_type,
                    model=absorbance_model,
                )
            )

            # we need to move the lid to the lid dock
            new_location = self._state_view.modules.absorbance_reader_dock_location(
                mod_substate.module_id
            )

            lid_gripper_offsets = self._state_view.labware.get_labware_gripper_offsets(
                loaded_lid.id, None
            )
            if lid_gripper_offsets is None:
                raise ValueError(
                    "Gripper Offset values for Absorbance Reader Lid labware must not be None."
                )

            # Skips gripper moves when using virtual gripper
            await self._labware_movement.move_labware_with_gripper(
                labware_id=loaded_lid.id,
                current_location=current_location,
                new_location=new_location,
                user_offset_data=lid_gripper_offsets,
                post_drop_slide_offset=None,
            )
            new_offset_id = self._equipment.find_applicable_labware_offset_id(
                labware_definition_uri=loaded_lid.definitionUri,
                labware_location=new_location,
            )

        state_update.lid_status = BaseLabwareData(
            id=loaded_lid.id, new_location=new_location, offset_id=new_offset_id
        )

        return SuccessData(
            public=OpenLidResult(
                lidId=loaded_lid.id,
                newLocation=new_location,
                offsetId=new_offset_id,
            ),
            private=None,
            state_update=state_update,
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
