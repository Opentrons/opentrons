"""Translate events from a legacy ``ProtocolContext`` into Protocol Engine commands."""

from collections import defaultdict
from typing import Dict, List

from opentrons.types import MountType
from opentrons.util.helpers import utc_now
from opentrons.commands.types import CommandMessage as LegacyCommand
from opentrons.protocol_engine import commands as pe_commands, types as pe_types
from opentrons.protocols.models.labware_definition import LabwareDefinition

from .legacy_wrappers import (
    LegacyInstrumentLoadInfo,
    LegacyLabwareLoadInfo,
)


class LegacyCommandData(pe_commands.CustomData):
    """Custom command data payload for mapped legacy commands."""

    legacyCommandType: str
    legacyCommandText: str


class LegacyCommandMapper:
    """Map broker commands to protocol engine commands."""

    def __init__(self) -> None:
        """Initialize the command mapper."""
        self._running_commands: Dict[str, List[pe_commands.Command]] = defaultdict(list)
        self._command_count: Dict[str, int] = defaultdict(lambda: 0)

    def map_brokered_command(
        self,
        command: LegacyCommand,
    ) -> List[pe_commands.Command]:
        """Map a legacy Broker command to ProtocolEngine commands."""
        command_type = command["name"]
        command_text = command["payload"]["text"]
        stage = command["$"]

        command_id = f"{command_type}-0"
        now = utc_now()
        results: List[pe_commands.Command] = []

        if stage == "before":
            count = self._command_count[command_type]
            command_id = f"{command_type}-{count}"
            engine_command = pe_commands.Custom(
                id=command_id,
                status=pe_commands.CommandStatus.RUNNING,
                createdAt=now,
                startedAt=now,
                data=LegacyCommandData(
                    legacyCommandType=command_type,
                    legacyCommandText=command_text,
                ),
            )

            self._command_count[command_type] = count + 1
            self._running_commands[command_type].append(engine_command)

            results.append(engine_command)

        else:
            running_command = self._running_commands[command_type].pop()
            completed_command = running_command.copy(
                update={
                    "status": pe_commands.CommandStatus.SUCCEEDED,
                    "completedAt": now,
                }
            )

            results.append(completed_command)

        return results

    def map_labware_loaded(
        self,
        labware_load_info: LegacyLabwareLoadInfo,
    ) -> List[pe_commands.Command]:
        """Map a legacy labware load to Protocol Engine commands."""
        now = utc_now()

        count = self._command_count["LOAD_LABWARE"]

        load_labware_command = pe_commands.LoadLabware(
            id=f"commands.LOAD_LABWARE-{count}",
            status=pe_commands.CommandStatus.SUCCEEDED,
            createdAt=now,
            startedAt=now,
            completedAt=now,
            data=pe_commands.LoadLabwareData(
                location=pe_types.DeckSlotLocation(slot=labware_load_info.deck_slot),
                loadName=labware_load_info.labware_load_name,
                namespace=labware_load_info.labware_namespace,
                version=labware_load_info.labware_version,
            ),
            result=pe_commands.LoadLabwareResult(
                labwareId=f"labware-{count}",
                definition=LabwareDefinition.parse_obj(
                    labware_load_info.labware_definition
                ),
                calibration=pe_types.CalibrationOffset(x=0, y=0, z=0),
            ),
        )

        self._command_count["LOAD_LABWARE"] = count + 1
        return [load_labware_command]

    def map_instrument_loaded(
        self, instrument_load_info: LegacyInstrumentLoadInfo
    ) -> List[pe_commands.Command]:
        """Map a legacy instrument (pipette) load to Protocol Engine commands."""
        now = utc_now()

        count = self._command_count["LOAD_PIPETTE"]

        load_pipette_command = pe_commands.LoadPipette(
            id=f"commands.LOAD_PIPETTE-{count}",
            status=pe_commands.CommandStatus.SUCCEEDED,
            createdAt=now,
            startedAt=now,
            completedAt=now,
            data=pe_commands.LoadPipetteData(
                pipetteName=pe_types.PipetteName(
                    instrument_load_info.instrument_load_name
                ),
                mount=MountType(instrument_load_info.mount),
            ),
            result=pe_commands.LoadPipetteResult(
                pipetteId=f"pipette-{count}",
            ),
        )

        self._command_count["LOAD_PIPETTE"] = count + 1
        return [load_pipette_command]
