"""Translate events from a legacy ``ProtocolContext`` into Protocol Engine commands."""

from collections import defaultdict
from datetime import datetime
from typing import Dict, List, Optional, Union

from opentrons_shared_data.pipette.dev_types import PipetteNameType
from opentrons.types import MountType, DeckSlotName, Location
from opentrons.commands import types as legacy_command_types
from opentrons.protocol_engine import (
    ProtocolEngineError,
    actions as pe_actions,
    commands as pe_commands,
    types as pe_types,
)
from opentrons.protocol_engine.resources import ModelUtils, ModuleDataProvider
from opentrons_shared_data.labware.labware_definition import LabwareDefinition
from opentrons.protocols.geometry.deck import FIXED_TRASH_ID

from .legacy_wrappers import (
    LegacyLoadInfo,
    LegacyInstrumentLoadInfo,
    LegacyLabwareLoadInfo,
    LegacyModuleLoadInfo,
    LegacyPipetteContext,
    LegacyWell,
    LegacyModuleModel,
    LegacyMagneticModuleModel,
    LegacyTemperatureModuleModel,
    LegacyThermocyclerModuleModel,
    LegacyHeaterShakerModuleModel,
)


class LegacyCommandParams(pe_commands.CustomParams):
    """Custom command data payload for mapped legacy commands."""

    legacyCommandType: str
    legacyCommandText: str


class LegacyContextCommandError(ProtocolEngineError):
    """An error returned when a PAPIv2 ProtocolContext command fails."""


_LEGACY_TO_PE_MODULE: Dict[LegacyModuleModel, pe_types.ModuleModel] = {
    LegacyMagneticModuleModel.MAGNETIC_V1: pe_types.ModuleModel.MAGNETIC_MODULE_V1,
    LegacyMagneticModuleModel.MAGNETIC_V2: pe_types.ModuleModel.MAGNETIC_MODULE_V2,
    LegacyTemperatureModuleModel.TEMPERATURE_V1: pe_types.ModuleModel.TEMPERATURE_MODULE_V1,
    LegacyTemperatureModuleModel.TEMPERATURE_V2: pe_types.ModuleModel.TEMPERATURE_MODULE_V2,
    LegacyThermocyclerModuleModel.THERMOCYCLER_V1: pe_types.ModuleModel.THERMOCYCLER_MODULE_V1,
    LegacyThermocyclerModuleModel.THERMOCYCLER_V2: pe_types.ModuleModel.THERMOCYCLER_MODULE_V2,
    LegacyHeaterShakerModuleModel.HEATER_SHAKER_V1: pe_types.ModuleModel.HEATER_SHAKER_MODULE_V1,
}

_HIGHER_ORDER_COMMAND_TYPES = {
    legacy_command_types.MIX,
    legacy_command_types.CONSOLIDATE,
    legacy_command_types.DISTRIBUTE,
    legacy_command_types.TRANSFER,
    legacy_command_types.RETURN_TIP,
}


class LegacyCommandMapper:
    """Map broker commands to protocol engine commands.

    Each protocol should use its own instance of this class.
    """

    def __init__(
        self, module_data_provider: Optional[ModuleDataProvider] = None
    ) -> None:
        """Initialize the command mapper."""
        # commands keyed by broker message ID
        self._commands_by_broker_id: Dict[str, pe_commands.Command] = {}

        # running count of each legacy command type, to construct IDs
        self._command_count: Dict[str, int] = defaultdict(lambda: 0)

        # equipment IDs by physical location
        self._labware_id_by_slot: Dict[DeckSlotName, str] = {
            DeckSlotName.FIXED_TRASH: FIXED_TRASH_ID
        }
        self._labware_id_by_module_id: Dict[str, str] = {}
        self._pipette_id_by_mount: Dict[MountType, str] = {}
        self._module_id_by_slot: Dict[DeckSlotName, str] = {}

        # module definition state and provider depedency
        self._module_definition_by_model: Dict[
            pe_types.ModuleModel, pe_types.ModuleDefinition
        ] = {}
        self._module_data_provider = module_data_provider or ModuleDataProvider()

    def map_command(  # noqa: C901
        self,
        command: legacy_command_types.CommandMessage,
    ) -> List[pe_actions.Action]:
        """Map a legacy Broker command to a ProtocolEngine command.

        A "before" message from the Broker
        is mapped to a ``RUNNING`` ProtocolEngine command.

        An "after" message from the Broker
        is mapped to a ``SUCCEEDED`` ProtocolEngine command.
        It has the same ID as the original ``RUNNING`` command,
        so when you send it to the ProtocolEngine, it will update the original
        command's status in-place.
        """
        command_type = command["name"]

        if command_type in _HIGHER_ORDER_COMMAND_TYPES:
            return []

        command_error = command["error"]
        stage = command["$"]
        # TODO(mc, 2021-12-08): use message ID as command ID directly once
        # https://github.com/Opentrons/opentrons/issues/8986 is resolved
        broker_id = command["id"]
        now = ModelUtils.get_timestamp()

        results: List[pe_actions.Action] = []

        if stage == "before":
            count = self._command_count[command_type]
            command_id = f"{command_type}-{count}"
            engine_command = self._build_initial_command(command, command_id, now)

            self._command_count[command_type] = count + 1
            self._commands_by_broker_id[broker_id] = engine_command

            results.append(pe_actions.UpdateCommandAction(engine_command))

        elif stage == "after":
            running_command = self._commands_by_broker_id[broker_id]
            completed_command: pe_commands.Command
            if command_error is None:
                if isinstance(running_command, pe_commands.PickUpTip):
                    completed_command = running_command.copy(
                        update={
                            "result": pe_commands.PickUpTipResult.construct(),
                            "status": pe_commands.CommandStatus.SUCCEEDED,
                            "completedAt": now,
                        }
                    )
                elif isinstance(running_command, pe_commands.DropTip):
                    completed_command = running_command.copy(
                        update={
                            "result": pe_commands.DropTipResult.construct(),
                            "status": pe_commands.CommandStatus.SUCCEEDED,
                            "completedAt": now,
                        }
                    )
                elif isinstance(running_command, pe_commands.Aspirate):
                    completed_command = running_command.copy(
                        update={
                            # Don't .construct() result, because we want to validate
                            # volume.
                            "result": pe_commands.AspirateResult(
                                volume=running_command.params.volume
                            ),
                            "status": pe_commands.CommandStatus.SUCCEEDED,
                            "completedAt": now,
                        }
                    )
                elif isinstance(running_command, pe_commands.Dispense):
                    completed_command = running_command.copy(
                        update={
                            # Don't .construct() result, because we want to validate
                            # volume.
                            "result": pe_commands.DispenseResult(
                                volume=running_command.params.volume
                            ),
                            "status": pe_commands.CommandStatus.SUCCEEDED,
                            "completedAt": now,
                        }
                    )
                elif isinstance(running_command, pe_commands.BlowOut):
                    completed_command = running_command.copy(
                        update={
                            "result": pe_commands.BlowOutResult.construct(),
                            "status": pe_commands.CommandStatus.SUCCEEDED,
                            "completedAt": now,
                        }
                    )
                elif isinstance(running_command, pe_commands.Custom):
                    completed_command = running_command.copy(
                        update={
                            "result": pe_commands.CustomResult.construct(),
                            "status": pe_commands.CommandStatus.SUCCEEDED,
                            "completedAt": now,
                        }
                    )
                else:
                    completed_command = running_command.copy(
                        update={
                            "status": pe_commands.CommandStatus.SUCCEEDED,
                            "completedAt": now,
                        }
                    )
                results.append(pe_actions.UpdateCommandAction(completed_command))

                if isinstance(completed_command, pe_commands.WaitForResume):
                    results.append(
                        pe_actions.PauseAction(source=pe_actions.PauseSource.PROTOCOL)
                    )

            else:
                results.append(
                    pe_actions.FailCommandAction(
                        command_id=running_command.id,
                        error_id=ModelUtils.generate_id(),
                        failed_at=now,
                        error=LegacyContextCommandError(str(command_error)),
                    )
                )

        return results

    def map_equipment_load(self, load_info: LegacyLoadInfo) -> pe_commands.Command:
        """Map a labware, instrument (pipette), or module load to a PE command."""
        if isinstance(load_info, LegacyLabwareLoadInfo):
            return self._map_labware_load(load_info)
        elif isinstance(load_info, LegacyInstrumentLoadInfo):
            return self._map_instrument_load(load_info)
        elif isinstance(load_info, LegacyModuleLoadInfo):
            return self._map_module_load(load_info)

    def _build_initial_command(
        self,
        command: legacy_command_types.CommandMessage,
        command_id: str,
        now: datetime,
    ) -> pe_commands.Command:
        engine_command: pe_commands.Command
        if command["name"] == legacy_command_types.PICK_UP_TIP:
            engine_command = self._build_pick_up_tip_command(
                command=command, command_id=command_id, now=now
            )
        elif command["name"] == legacy_command_types.DROP_TIP:
            engine_command = self._build_drop_tip_command(
                command=command, command_id=command_id, now=now
            )

        elif (
            command["name"] == legacy_command_types.ASPIRATE
            or command["name"] == legacy_command_types.DISPENSE
        ):
            engine_command = self._build_liquid_handling_command(
                command=command, command_id=command_id, now=now
            )
        elif command["name"] == legacy_command_types.BLOW_OUT:
            engine_command = self._build_blow_out_command(
                command=command, command_id=command_id, now=now
            )
        elif command["name"] == legacy_command_types.PAUSE:
            engine_command = pe_commands.WaitForResume.construct(
                id=command_id,
                key=command_id,
                status=pe_commands.CommandStatus.RUNNING,
                createdAt=now,
                startedAt=now,
                params=pe_commands.WaitForResumeParams.construct(
                    message=command["payload"]["userMessage"],
                ),
            )
        else:
            engine_command = pe_commands.Custom.construct(
                id=command_id,
                key=command_id,
                status=pe_commands.CommandStatus.RUNNING,
                createdAt=now,
                startedAt=now,
                params=LegacyCommandParams.construct(
                    legacyCommandType=command["name"],
                    legacyCommandText=command["payload"]["text"],
                ),
            )

        return engine_command

    def _build_drop_tip_command(
        self,
        command: legacy_command_types.DropTipMessage,
        command_id: str,
        now: datetime,
    ) -> pe_commands.Command:
        pipette: LegacyPipetteContext = command["payload"]["instrument"]
        location = command["payload"]["location"]
        assert location.labware.is_well
        well = location.labware.as_well()
        mount = MountType(pipette.mount)
        #   the following type checking suppression assumes the tiprack is not loaded on top of a module
        slot = DeckSlotName.from_primitive(well.parent.parent)  # type: ignore[arg-type]
        well_name = well.well_name
        labware_id = self._labware_id_by_slot[slot]
        pipette_id = self._pipette_id_by_mount[mount]
        return pe_commands.DropTip.construct(
            id=command_id,
            key=command_id,
            status=pe_commands.CommandStatus.RUNNING,
            createdAt=now,
            startedAt=now,
            params=pe_commands.DropTipParams.construct(
                pipetteId=pipette_id,
                labwareId=labware_id,
                wellName=well_name,
            ),
        )

    def _build_pick_up_tip_command(
        self,
        command: legacy_command_types.PickUpTipMessage,
        command_id: str,
        now: datetime,
    ) -> pe_commands.Command:
        pipette: LegacyPipetteContext = command["payload"]["instrument"]
        location = command["payload"]["location"]
        assert isinstance(location, LegacyWell)
        well = location
        mount = MountType(pipette.mount)
        #   the following type checking suppression assumes the tiprack is not loaded on top of a module
        slot = DeckSlotName.from_primitive(well.parent.parent)  # type: ignore[arg-type]
        well_name = well.well_name
        labware_id = self._labware_id_by_slot[slot]
        pipette_id = self._pipette_id_by_mount[mount]

        return pe_commands.PickUpTip.construct(
            id=command_id,
            key=command_id,
            status=pe_commands.CommandStatus.RUNNING,
            createdAt=now,
            startedAt=now,
            params=pe_commands.PickUpTipParams.construct(
                pipetteId=pipette_id,
                labwareId=labware_id,
                wellName=well_name,
            ),
        )

    def _build_liquid_handling_command(
        self,
        command: Union[
            legacy_command_types.AspirateMessage, legacy_command_types.DispenseMessage
        ],
        command_id: str,
        now: datetime,
    ) -> pe_commands.Command:
        pipette: LegacyPipetteContext = command["payload"]["instrument"]
        location = command["payload"]["location"]
        volume = command["payload"]["volume"]
        # TODO:(jr, 15.08.2022): aspirate and dispense commands with no specified labware
        # get filtered into custom. Refactor this in followup legacy command mapping
        if location.labware.is_well:
            well = location.labware.as_well()
            slot = DeckSlotName(location.labware.first_parent())
            parent_module_id = self._module_id_by_slot.get(slot)
            labware_id = (
                self._labware_id_by_module_id[parent_module_id]
                if parent_module_id is not None
                else self._labware_id_by_slot[slot]
            )
            mount = MountType(pipette.mount)
            well_name = well.well_name
            pipette_id = self._pipette_id_by_mount[mount]

            if volume == 0:
                # In edge cases, it's possible for a Python protocol to do dispense()
                # or aspirate() with a volume of 0, which behaves roughly like
                # move_to(). Protocol Engine aspirate and dispense commands must have
                # volume > 0, so we can't map into those.
                return pe_commands.MoveToWell.construct(
                    id=command_id,
                    key=command_id,
                    status=pe_commands.CommandStatus.RUNNING,
                    createdAt=now,
                    startedAt=now,
                    params=pe_commands.MoveToWellParams.construct(
                        pipetteId=pipette_id,
                        labwareId=labware_id,
                        wellName=well_name,
                    ),
                )
            elif command["name"] == legacy_command_types.ASPIRATE:
                flow_rate = command["payload"]["rate"] * pipette.flow_rate.aspirate
                return pe_commands.Aspirate.construct(
                    id=command_id,
                    key=command_id,
                    status=pe_commands.CommandStatus.RUNNING,
                    createdAt=now,
                    startedAt=now,
                    # Don't .construct() params, because we want to validate
                    # volume and flowRate.
                    params=pe_commands.AspirateParams(
                        pipetteId=pipette_id,
                        labwareId=labware_id,
                        wellName=well_name,
                        volume=volume,
                        flowRate=flow_rate,
                    ),
                )
            else:
                flow_rate = command["payload"]["rate"] * pipette.flow_rate.dispense
                return pe_commands.Dispense.construct(
                    id=command_id,
                    key=command_id,
                    status=pe_commands.CommandStatus.RUNNING,
                    createdAt=now,
                    startedAt=now,
                    # Don't .construct params, because we want to validate
                    # volume and flowRate.
                    params=pe_commands.DispenseParams(
                        pipetteId=pipette_id,
                        labwareId=labware_id,
                        wellName=well_name,
                        volume=volume,
                        flowRate=flow_rate,
                    ),
                )
        else:
            return pe_commands.Custom.construct(
                id=command_id,
                key=command_id,
                status=pe_commands.CommandStatus.RUNNING,
                createdAt=now,
                startedAt=now,
                params=LegacyCommandParams.construct(
                    legacyCommandType=command["name"],
                    legacyCommandText=command["payload"]["text"],
                ),
            )

    def _build_blow_out_command(
        self,
        command: legacy_command_types.BlowOutMessage,
        command_id: str,
        now: datetime,
    ) -> pe_commands.Command:
        pipette: LegacyPipetteContext = command["payload"]["instrument"]
        location = command["payload"]["location"]
        flow_rate = pipette.flow_rate.blow_out
        #   TODO:(jr, 15.08.2022): blow_out commands with no specified labware get filtered
        #   into custom. Remove location.labware.is_empty is False when refactor is complete
        if isinstance(location, Location) and location.labware.is_well:
            well = location.labware.as_well()
            slot = DeckSlotName(location.labware.first_parent())
            parent_module_id = self._module_id_by_slot.get(slot)
            labware_id = (
                self._labware_id_by_module_id[parent_module_id]
                if parent_module_id is not None
                else self._labware_id_by_slot[slot]
            )
            mount = MountType(pipette.mount)
            well_name = well.well_name
            pipette_id = self._pipette_id_by_mount[mount]
            return pe_commands.BlowOut.construct(
                id=command_id,
                key=command_id,
                status=pe_commands.CommandStatus.RUNNING,
                createdAt=now,
                startedAt=now,
                # Don't .construct() params, because we want to validate flowRate.
                params=pe_commands.BlowOutParams(
                    pipetteId=pipette_id,
                    labwareId=labware_id,
                    wellName=well_name,
                    flowRate=flow_rate,
                ),
            )
        #   TODO:(jr, 15.08.2022): blow_out commands with no specified labware get filtered
        #   into custom. Refactor this in followup legacy command mapping
        else:
            return pe_commands.Custom.construct(
                id=command_id,
                key=command_id,
                status=pe_commands.CommandStatus.RUNNING,
                createdAt=now,
                startedAt=now,
                params=LegacyCommandParams.construct(
                    legacyCommandType=command["name"],
                    legacyCommandText=command["payload"]["text"],
                ),
            )

    def _map_labware_load(
        self, labware_load_info: LegacyLabwareLoadInfo
    ) -> pe_commands.Command:
        """Map a legacy labware load to a ProtocolEngine command."""
        now = ModelUtils.get_timestamp()
        count = self._command_count["LOAD_LABWARE"]
        slot = labware_load_info.deck_slot
        location: pe_types.LabwareLocation
        if labware_load_info.on_module:
            location = pe_types.ModuleLocation.construct(
                moduleId=self._module_id_by_slot[slot]
            )
        else:
            location = pe_types.DeckSlotLocation.construct(slotName=slot)

        command_id = f"commands.LOAD_LABWARE-{count}"
        labware_id = f"labware-{count}"

        load_labware_command = pe_commands.LoadLabware.construct(
            id=command_id,
            key=command_id,
            status=pe_commands.CommandStatus.SUCCEEDED,
            createdAt=now,
            startedAt=now,
            completedAt=now,
            params=pe_commands.LoadLabwareParams.construct(
                location=location,
                loadName=labware_load_info.labware_load_name,
                namespace=labware_load_info.labware_namespace,
                version=labware_load_info.labware_version,
                displayName=labware_load_info.labware_display_name,
            ),
            result=pe_commands.LoadLabwareResult.construct(
                labwareId=labware_id,
                definition=LabwareDefinition.parse_obj(
                    labware_load_info.labware_definition
                ),
                offsetId=labware_load_info.offset_id,
            ),
        )

        self._command_count["LOAD_LABWARE"] = count + 1
        if isinstance(location, pe_types.DeckSlotLocation):
            self._labware_id_by_slot[location.slotName] = labware_id
        elif isinstance(location, pe_types.ModuleLocation):
            self._labware_id_by_module_id[location.moduleId] = labware_id
        return load_labware_command

    def _map_instrument_load(
        self,
        instrument_load_info: LegacyInstrumentLoadInfo,
    ) -> pe_commands.Command:
        """Map a legacy instrument (pipette) load to a ProtocolEngine command."""
        now = ModelUtils.get_timestamp()
        count = self._command_count["LOAD_PIPETTE"]
        command_id = f"commands.LOAD_PIPETTE-{count}"
        pipette_id = f"pipette-{count}"
        mount = MountType(str(instrument_load_info.mount).lower())

        load_pipette_command = pe_commands.LoadPipette.construct(
            id=command_id,
            key=command_id,
            status=pe_commands.CommandStatus.SUCCEEDED,
            createdAt=now,
            startedAt=now,
            completedAt=now,
            params=pe_commands.LoadPipetteParams.construct(
                pipetteName=PipetteNameType(instrument_load_info.instrument_load_name),
                mount=mount,
            ),
            result=pe_commands.LoadPipetteResult.construct(pipetteId=pipette_id),
        )

        self._command_count["LOAD_PIPETTE"] = count + 1
        self._pipette_id_by_mount[mount] = pipette_id
        return load_pipette_command

    def _map_module_load(
        self, module_load_info: LegacyModuleLoadInfo
    ) -> pe_commands.Command:
        """Map a legacy module load to a Protocol Engine command."""
        now = ModelUtils.get_timestamp()

        count = self._command_count["LOAD_MODULE"]
        command_id = f"commands.LOAD_MODULE-{count}"
        module_id = f"module-{count}"
        requested_model = _LEGACY_TO_PE_MODULE[module_load_info.requested_model]
        loaded_model = _LEGACY_TO_PE_MODULE[module_load_info.loaded_model]

        # This will fetch a V2 definition only. PAPI < v2.3 use V1 definitions.
        # When running a < v2.3 protocol, there will be a mismatch of definitions used
        # during analysis+LPC (V2) and protocol execution (V1).
        # But this shouldn't result in any problems since V2 and V1 definitions
        # have similar info, with V2 having additional info fields.
        loaded_definition = self._module_definition_by_model.get(
            loaded_model
        ) or self._module_data_provider.get_definition(loaded_model)

        load_module_command = pe_commands.LoadModule.construct(
            id=command_id,
            key=command_id,
            status=pe_commands.CommandStatus.SUCCEEDED,
            createdAt=now,
            startedAt=now,
            completedAt=now,
            params=pe_commands.LoadModuleParams.construct(
                model=requested_model,
                location=pe_types.DeckSlotLocation(
                    slotName=module_load_info.deck_slot,
                ),
                moduleId=module_id,
            ),
            result=pe_commands.LoadModuleResult.construct(
                moduleId=module_id,
                serialNumber=module_load_info.module_serial,
                definition=loaded_definition,
                model=loaded_model,
            ),
        )
        self._command_count["LOAD_MODULE"] = count + 1
        self._module_id_by_slot[module_load_info.deck_slot] = module_id
        self._module_definition_by_model[loaded_model] = loaded_definition
        return load_module_command
