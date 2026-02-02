from typing import AsyncGenerator, Iterator

import pytest

from opentrons import _find_smoothie_file
from opentrons.config.robot_configs import build_config
from opentrons.config.types import RobotConfig
from opentrons.hardware_control import Controller
from opentrons.hardware_control.emulation.settings import Settings
from opentrons.types import Mount


@pytest.fixture
async def subject(
    emulation_app: Iterator[None],
    emulator_settings: Settings,
) -> AsyncGenerator[Controller, None]:
    conf = build_config({})
    port = f"socket://127.0.0.1:{emulator_settings.smoothie.port}"
    assert isinstance(conf, RobotConfig)
    hc = await Controller.build(config=conf)
    await hc.connect(port=port)
    try:
        yield hc
    finally:
        await hc.clean_up()
        await hc._smoothie_driver.disconnect()


async def test_get_fw_version(subject: Controller) -> None:
    """It should be set."""
    _, fw_version = _find_smoothie_file()
    assert subject._cached_fw_version == fw_version


async def test_get_attached_instruments(subject: Controller) -> None:
    """It should get the attached instruments."""
    instruments = await subject.get_attached_instruments({})
    assert instruments[Mount.RIGHT]["id"] == "P20SV202020070101"
    right_config = instruments[Mount.RIGHT]["config"]
    assert right_config is not None
    assert right_config.display_name == "P20 Single-Channel GEN2"
    assert instruments[Mount.LEFT]["id"] == "P3HMV202020041605"
    left_config = instruments[Mount.LEFT]["config"]
    assert left_config is not None
    assert left_config.display_name == "P20 8-Channel GEN2"


async def test_move(subject: Controller) -> None:
    """It should move."""
    new_position = {"X": 1.0, "Z": 2.0, "Y": 3.0, "A": 4.0, "B": 5.0, "C": 6.0}

    await subject.move(target_position=new_position)

    updated_position = await subject.update_position()

    assert updated_position == {"X": 1, "Z": 2, "Y": 3, "A": 4, "B": 5, "C": 6}
