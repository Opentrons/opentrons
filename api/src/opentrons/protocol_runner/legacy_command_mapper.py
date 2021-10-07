"""Translate events from a legacy ``ProtocolContext`` into Protocol Engine commands."""

from collections import defaultdict
from typing import Any, Dict, List, Set
import logging

from opentrons.types import DeckSlotName, MountType
from opentrons.util.helpers import utc_now
from opentrons.commands.types import CommandMessage as LegacyCommand
from opentrons.protocol_engine import commands as pe_commands, types as pe_types
from opentrons.protocols.models.labware_definition import LabwareDefinition

from .legacy_wrappers import LegacyPipetteContext, LegacyModuleContext, LegacyLabware


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
        self._loaded_pipette_mounts: Set[str] = set()
        self._loaded_labware_slots: Set[int] = set()
        self._loaded_module_slots: Set[int] = set()

    def map_brokered_command(
        self,
        command: LegacyCommand,
        loaded_pipettes: Dict[str, LegacyPipetteContext],
        loaded_modules: Dict[int, LegacyModuleContext[Any]],
        loaded_labware: Dict[int, LegacyLabware],
    ) -> List[pe_commands.Command]:
        """Map a legacy Broker command to ProtocolEngine commands."""
        command_type = command["name"]
        command_text = command["payload"]["text"]
        stage = command["$"]

        command_id = f"{command_type}-0"
        now = utc_now()
        results: List[pe_commands.Command] = []

        if stage == "before":
            # TODO(mc, 2021-09-28): equipment mapping behavior seems
            # best tested e2e, but current smoke tests won't remain sufficient
            # for very long. Figure out a better testing strategy
            results += self._load_new_pipettes(loaded_pipettes)

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
        self, loaded_labware: LegacyLabware
    ) -> List[pe_commands.Command]:
        now = utc_now()

        namespace, load_name, version = loaded_labware.uri.split("/")

        labware_parent = loaded_labware.parent
        if not isinstance(labware_parent, str):
            # todo(mm, 2021-10-05): Implement this when Protocol Engine supports
            # loading labware onto modules.
            logging.warning(
                f"Labware {repr(loaded_labware)} "
                f"has parent {repr(labware_parent)}, "
                f"which doesn't seem like a deck slot. "
                f"Currently, only labware loaded onto a deck slot can be mapped to "
                f"Protocol Engine commands, "
                f"so this labware will not show up in the Protocol Engine state."
            )
            return []

        count = self._command_count["LOAD_LABWARE"]

        load_labware_command = pe_commands.LoadLabware(
            id=f"commands.LOAD_LABWARE-{count}",
            status=pe_commands.CommandStatus.SUCCEEDED,
            createdAt=now,
            startedAt=now,
            completedAt=now,
            data=pe_commands.LoadLabwareData(
                location=pe_types.DeckSlotLocation(
                    slot=DeckSlotName.from_primitive(labware_parent)
                ),
                loadName=load_name,
                namespace=namespace,
                version=int(version),
            ),
            result=pe_commands.LoadLabwareResult(
                labwareId=f"labware-{count}",
                definition=LabwareDefinition.parse_obj(
                    loaded_labware._implementation.get_definition()
                ),
                calibration=pe_types.CalibrationOffset(x=0, y=0, z=0),
            ),
        )

        self._command_count["LOAD_LABWARE"] = count + 1
        return [load_labware_command]

    def map_pipette_load(self) -> None:
        raise NotImplementedError()

    def map_module_load(self) -> None:
        raise NotImplementedError()

    def _load_new_pipettes(
        self,
        loaded_pipettes: Dict[str, LegacyPipetteContext],
    ) -> List[pe_commands.Command]:
        results: List[pe_commands.Command] = []

        for mount, pipette in loaded_pipettes.items():
            if mount not in self._loaded_pipette_mounts:
                self._loaded_pipette_mounts.add(mount)
                now = utc_now()

                results.append(
                    pe_commands.LoadPipette(
                        id=f"commands.LOAD_PIPETTE-{mount}",
                        status=pe_commands.CommandStatus.SUCCEEDED,
                        createdAt=now,
                        startedAt=now,
                        completedAt=now,
                        data=pe_commands.LoadPipetteData(
                            pipetteName=pe_types.PipetteName(pipette.name),
                            mount=MountType(mount),
                        ),
                        result=pe_commands.LoadPipetteResult(
                            pipetteId=f"pipette-{mount}",
                        ),
                    )
                )

        return results
