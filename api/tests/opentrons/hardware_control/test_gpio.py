from unittest.mock import MagicMock

import pytest

from opentrons import hardware_control as hc
from opentrons.drivers import rpi_drivers
from opentrons.drivers.rpi_drivers.gpio_simulator import SimulatingGPIOCharDev
from opentrons.hardware_control.types import BoardRevision


async def test_gpio_setup() -> None:
    # Test without DTOVERLAY path
    # Board revision should be defaulted to 2.1
    backend = await hc.Controller.build(config=None)
    assert str(backend.board_revision) == "2.1"


@pytest.mark.parametrize(
    "revision,a_current",
    [
        (hc.types.BoardRevision.OG, 0.8),
        (hc.types.BoardRevision.A, 0.5),
        (hc.types.BoardRevision.B, 0.5),
        (hc.types.BoardRevision.C, 0.5),
    ],
)
async def test_current_setting(
    monkeypatch: pytest.MonkeyPatch, revision: BoardRevision, a_current: float
) -> None:
    mock_gpio = MagicMock(spec=SimulatingGPIOCharDev)

    async def fake_side_effect() -> None:
        pass

    mock_gpio.setup.side_effect = fake_side_effect
    mock_gpio.board_rev = revision
    mock_build = MagicMock(spec=rpi_drivers, return_value=mock_gpio)
    monkeypatch.setattr(hc.backends.controller, "build_gpio_chardev", mock_build)
    backend = await hc.Controller.build(config=None)
    assert backend.board_revision == revision
    assert backend._smoothie_driver._active_current_settings.now["A"] == a_current
