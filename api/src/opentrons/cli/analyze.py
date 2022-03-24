"""Opentrons analyze CLI."""
import click
import contextlib
import json
import shutil
import tempfile
from anyio import run
from pathlib import Path
from pydantic.json import pydantic_encoder
from typing import Callable, Iterator, List, Sequence, Tuple

from opentrons.protocol_reader import ProtocolReader, InputFile
from opentrons.protocol_runner import ProtocolRunData, create_simulating_runner
from opentrons.protocol_runner.legacy_command_mapper import LegacyCommandParams
from opentrons.protocol_engine import (
    DeckSlotLocation,
    LoadedLabware,
    LoadedModule,
    LoadedPipette,
    commands,
)


@click.command()
@click.argument(
    "files",
    nargs=-1,
    required=True,
    type=click.Path(exists=True, path_type=Path, file_okay=True, dir_okay=True),
)
@click.option(
    "--json/--no-json",
    default=False,
    help="Return analysis results as machine-readable JSON.",
)
def analyze(files: Sequence[Path], json: bool) -> None:
    """Analyze a protocol.

    You can use `opentrons analyze` to get a protocol's expected
    equipment and commands.
    """
    run(_analyze, files, json)


async def _analyze(files: Sequence[Path], json_mode: bool) -> None:
    protocol_dir = Path(tempfile.gettempdir()) / "opentrons-protocols"
    source_files = []

    for p in files:
        if p.is_dir():
            dir_files = p.glob("**/*")
            for sub_p in dir_files:
                source_files.append(InputFile.from_path(sub_p))
        else:
            source_files.append(InputFile.from_path(p))

    reader = ProtocolReader(directory=protocol_dir)
    protocol_source = await reader.read("protocol", source_files)
    runner = await create_simulating_runner()
    results = await runner.run(protocol_source)

    if json_mode:
        click.echo(json.dumps(results, default=pydantic_encoder))
        return

    data_formatter = _RunDataFormatter(run_data=results)

    with _print_section("Files") as echo:
        for f in protocol_source.files:
            role_label = data_formatter.format_label(f.role)
            echo(role_label, f.name)

    with _print_section("Errors") as echo:
        for index, error in enumerate(results.errors):
            index_label = data_formatter.format_label(f"{index+1}")
            echo(index_label, f"{error.errorType} - {error.detail}")

    with _print_section("Modules") as echo:
        for mod in results.modules:
            slot_name, module_name = data_formatter.format_module(mod)
            slot_label = data_formatter.format_label(f"slot {slot_name}")
            echo(slot_label, module_name)

    with _print_section("Labware") as echo:
        for lw in results.labware:
            slot_name, labware_name = data_formatter.format_labware(lw)
            slot_label = data_formatter.format_label(f"slot {slot_name}")
            echo(slot_label, labware_name)

    with _print_section("Pipettes") as echo:
        for pip in results.pipettes:
            mount, pipette_name = data_formatter.format_pipette(pip)
            mount_label = data_formatter.format_label(mount)
            echo(mount_label, pipette_name)

    with _print_section("Commands") as echo:
        for index, command in enumerate(results.commands):
            index_label = data_formatter.format_label(f"{index+1}")
            command_msg = data_formatter.format_command(command)
            echo(index_label, command_msg)


@contextlib.contextmanager
def _print_section(heading: str) -> Iterator[Callable[..., None]]:
    lines: List[str] = []

    def _echo(*line: str) -> None:
        nonlocal lines
        lines.append("".join(line))

    yield _echo

    if len(lines) > 0:
        n_columns, n_lines = shutil.get_terminal_size()
        click.echo()
        click.echo(heading)
        click.echo("=" * n_columns)
        for line in lines:
            click.echo(line)
        click.echo("-" * n_columns)


class _RunDataFormatter:
    _LEFT_ALIGN_WIDTH = 10

    def __init__(self, run_data: ProtocolRunData) -> None:
        self._labware = run_data.labware
        self._pipettes = run_data.pipettes
        self._modules = run_data.modules

    def _get_labware(self, labware_id: str) -> LoadedLabware:
        for labware in self._labware:
            if labware.id == labware_id:
                return labware
        assert False, "Error retrieving loaded labware"

    def _get_module(self, module_id: str) -> LoadedModule:
        for module in self._modules:
            if module.id == module_id:
                return module
        assert False, "Error retrieving loaded module"

    def _get_pipette(self, pipette_id: str) -> LoadedPipette:
        for pipette in self._pipettes:
            if pipette.id == pipette_id:
                return pipette
        assert False, "Error retrieving loaded pipette"

    def format_label(self, label: str) -> str:
        return f"{label.capitalize()}:".ljust(self._LEFT_ALIGN_WIDTH)

    def format_module(self, module: LoadedModule) -> Tuple[str, str]:
        return (module.location.slotName, module.model)

    def format_labware(self, labware: LoadedLabware) -> Tuple[str, str]:
        if isinstance(labware.location, DeckSlotLocation):
            slot_name = labware.location.slotName
            labware_name = labware.loadName
        else:
            module = self._get_module(labware.location.moduleId)
            slot_name = module.location.slotName
            labware_name = f"{labware.loadName} on {module.model}"

        return (slot_name, labware_name)

    def format_pipette(self, pipette: LoadedPipette) -> Tuple[str, str]:
        return (pipette.mount.value, pipette.pipetteName)

    def format_command(self, command: commands.Command) -> str:
        params = command.params
        result = command.result

        if isinstance(params, LegacyCommandParams):
            return params.legacyCommandText

        elif isinstance(params, commands.AspirateParams):
            pipette = self._get_pipette(params.pipetteId)
            labware = self._get_labware(params.labwareId)
            mount_name, pipette_name = self.format_pipette(pipette)
            slot_name, labware_name = self.format_labware(labware)
            return (
                f"Aspirate {params.volume} µL"
                f" from {params.wellName} of {labware_name} in slot {slot_name}"
                f" with {mount_name} {pipette_name}"
            )

        elif isinstance(params, commands.DispenseParams):
            pipette = self._get_pipette(params.pipetteId)
            labware = self._get_labware(params.labwareId)
            mount_name, pipette_name = self.format_pipette(pipette)
            slot_name, labware_name = self.format_labware(labware)
            return (
                f"Dispense {params.volume} µL"
                f" into {params.wellName} of {labware_name} in slot {slot_name}"
                f" with {mount_name} {pipette_name}"
            )

        elif isinstance(params, commands.PickUpTipParams):
            pipette = self._get_pipette(params.pipetteId)
            labware = self._get_labware(params.labwareId)
            mount_name, pipette_name = self.format_pipette(pipette)
            slot_name, labware_name = self.format_labware(labware)
            return (
                f"Pick up tip"
                f" from {params.wellName} of {labware_name} in slot {slot_name}"
                f" with {mount_name} {pipette_name}"
            )

        elif isinstance(params, commands.DropTipParams):
            pipette = self._get_pipette(params.pipetteId)
            labware = self._get_labware(params.labwareId)
            mount_name, pipette_name = self.format_pipette(pipette)
            slot_name, labware_name = self.format_labware(labware)
            return (
                f"Drop tip"
                f" into {params.wellName} of {labware_name} in slot {slot_name}"
                f" with {mount_name} {pipette_name}"
            )

        elif isinstance(params, commands.HomeParams):
            pass

        elif isinstance(result, commands.LoadLabwareResult):
            labware = self._get_labware(result.labwareId)
            slot_name, labware_name = self.format_labware(labware)
            return f"Load labware {labware_name} in slot {slot_name}"

        elif isinstance(result, commands.LoadModuleResult):
            module = self._get_module(result.moduleId)
            slot_name, module_name = self.format_module(module)
            return f"Load module {module_name} in slot {slot_name}"

        elif isinstance(result, commands.LoadPipetteResult):
            pipette = self._get_pipette(result.pipetteId)
            mount_name, pipette_name = self.format_pipette(pipette)
            return f"Load pipette {pipette_name} on {mount_name} mount"

        elif isinstance(params, commands.MoveRelativeParams):
            pass

        elif isinstance(params, commands.MoveToWellParams):
            pass

        elif isinstance(params, commands.PauseParams):
            pass

        elif isinstance(params, commands.SavePositionParams):
            pass

        elif isinstance(params, commands.SetRailLightsParams):
            pass

        elif isinstance(params, commands.heater_shaker.AwaitTemperatureParams):
            pass

        elif isinstance(params, commands.heater_shaker.CloseLatchParams):
            pass

        elif isinstance(params, commands.heater_shaker.DeactivateHeaterParams):
            pass

        elif isinstance(params, commands.heater_shaker.OpenLatchParams):
            pass

        elif isinstance(params, commands.heater_shaker.SetTargetShakeSpeedParams):
            pass

        elif isinstance(params, commands.heater_shaker.StartSetTargetTemperature):
            pass

        elif isinstance(params, commands.heater_shaker.StopShake):
            pass

        elif isinstance(params, commands.magnetic_module.EngageParams):
            pass

        return ""
