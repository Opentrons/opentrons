"""Test legacy module command mapping in an end-to-end environment."""

import pytest
import textwrap
from datetime import datetime
from decoy import matchers
from pathlib import Path

from opentrons.protocol_engine import ModuleModel, commands

from opentrons.protocol_reader import ProtocolReader
from opentrons.protocol_runner import create_simulating_runner


@pytest.fixture()
def modules_legacy_python_protocol_file(tmp_path: Path) -> Path:
    """Get an on-disk, minimal fixture of legacy python protocol w/ modules."""
    path = tmp_path / "protocol-name.py"
    path.write_text(
        textwrap.dedent(
            """
            # my protocol
            metadata = {
                "apiLevel": "2.11",
            }
            def run(ctx):
                tip_rack = ctx.load_labware(
                    load_name="opentrons_96_tiprack_300ul",
                    location="2",
                )
                temp_module = ctx.load_module(
                    module_name="temperature module",
                    location="3"
                )
                mag_module = ctx.load_module(
                    module_name="magnetic module",
                    location="6"
                )
                thermocycler = ctx.load_module(
                    module_name="thermocycler"
                )
                heater_shaker = ctx.load_module(
                    module_name="heaterShakerModuleV1",
                    location="1"
                )
            """
        )
    )

    return path


async def test_runner_with_modules_in_legacy_python(
    modules_legacy_python_protocol_file: Path,
) -> None:
    """It should map legacy module commands."""
    protocol_reader = ProtocolReader()
    protocol_source = await protocol_reader.read_saved(
        files=[modules_legacy_python_protocol_file],
        directory=None,
    )

    subject = await create_simulating_runner(
        robot_type="OT-2 Standard",
        protocol_config=protocol_source.config,
    )
    result = await subject.run(protocol_source)
    commands_result = result.commands

    assert len(commands_result) == 6

    temp_module_result_captor = matchers.Captor()
    mag_module_result_captor = matchers.Captor()
    thermocycler_result_captor = matchers.Captor()
    heater_shaker_result_captor = matchers.Captor()

    assert commands_result[0] == commands.Home.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.HomeParams(axes=None),
        result=commands.HomeResult(),
    )
    assert commands_result[1] == commands.LoadLabware.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=matchers.Anything(),
        result=matchers.Anything(),
    )

    assert commands_result[2] == commands.LoadModule.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=matchers.Anything(),
        result=temp_module_result_captor,
    )

    assert commands_result[3] == commands.LoadModule.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=matchers.Anything(),
        result=mag_module_result_captor,
    )

    assert commands_result[4] == commands.LoadModule.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=matchers.Anything(),
        result=thermocycler_result_captor,
    )

    assert commands_result[5] == commands.LoadModule.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=matchers.Anything(),
        result=heater_shaker_result_captor,
    )

    assert temp_module_result_captor.value["model"] == ModuleModel.TEMPERATURE_MODULE_V1
    assert mag_module_result_captor.value["model"] == ModuleModel.MAGNETIC_MODULE_V1
    assert (
        thermocycler_result_captor.value["model"] == ModuleModel.THERMOCYCLER_MODULE_V1
    )
    assert (
        heater_shaker_result_captor.value["model"]
        == ModuleModel.HEATER_SHAKER_MODULE_V1
    )
