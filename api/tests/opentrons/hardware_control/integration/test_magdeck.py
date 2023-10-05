from typing import AsyncIterator, Iterator

import pytest

from opentrons.hardware_control import ExecutionManager
from opentrons.hardware_control.emulation.settings import Settings
from opentrons.hardware_control.modules import MagDeck

from .build_module import build_module


@pytest.fixture
async def magdeck(
    emulation_app: Iterator[None],
    emulator_settings: Settings,
    execution_manager: ExecutionManager,
) -> AsyncIterator[MagDeck]:
    module = await build_module(
        MagDeck,
        port=emulator_settings.magdeck_proxy.driver_port,
        execution_manager=execution_manager,
    )
    yield module
    await module.cleanup()


def test_device_info(magdeck: MagDeck) -> None:
    assert magdeck.device_info == {
        "model": "mag_deck_v20",
        "serial": "magnetic_emulator",
        "version": "2.0.0",
    }


async def test_engage_cycle(magdeck: MagDeck) -> None:
    """It should cycle engage and disengage"""
    await magdeck.engage(1)
    assert magdeck.current_height == 1
    assert magdeck.live_data == {
        "data": {"engaged": True, "height": 1.0},
        "status": "engaged",
    }

    await magdeck.deactivate()
    assert magdeck.current_height == 0
    assert magdeck.live_data == {
        "data": {"engaged": False, "height": 0.0},
        "status": "disengaged",
    }


async def test_engage_from_base_cycle(magdeck: MagDeck) -> None:
    """It should cycle engage/disengage, taking the offset from base into account."""
    await magdeck.engage(height_from_base=1)
    assert magdeck.current_height == 3.5
    assert magdeck.live_data == {
        "data": {"engaged": True, "height": 3.5},
        "status": "engaged",
    }

    await magdeck.deactivate()
    assert magdeck.current_height == 0
    assert magdeck.live_data == {
        "data": {"engaged": False, "height": 0.0},
        "status": "disengaged",
    }


async def test_forcible_deactivate(
    magdeck: MagDeck, execution_manager: ExecutionManager
) -> None:
    """Can override wait_for_is_running."""
    await execution_manager.pause()
    await magdeck.deactivate(must_be_running=False)
