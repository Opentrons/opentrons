""" Tests for behaviors specific to the OT3 hardware controller.
"""
from typing import cast, Iterator
import pytest
from mock import AsyncMock, patch
from opentrons.types import Point
from opentrons.config.types import GantryLoad, CapacitivePassSettings
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.hardware_control.types import OT3Mount
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control import ThreadManager


@pytest.fixture
def mock_move_to(ot3_hardware: ThreadManager[OT3API]) -> Iterator[AsyncMock]:
    with patch.object(
        ot3_hardware.managed_obj,
        "move_to",
        AsyncMock(
            spec=ot3_hardware.managed_obj.move_to,
            wraps=ot3_hardware.managed_obj.move_to,
        ),
    ) as mock_move:
        yield mock_move


@pytest.mark.parametrize(
    "attached,load",
    (
        (
            {OT3Mount.RIGHT: {"channels": 8}, OT3Mount.LEFT: {"channels": 1}},
            GantryLoad.TWO_LOW_THROUGHPUT,
        ),
        ({}, GantryLoad.NONE),
        ({OT3Mount.LEFT: {"channels": 1}}, GantryLoad.LOW_THROUGHPUT),
        ({OT3Mount.RIGHT: {"channels": 8}}, GantryLoad.LOW_THROUGHPUT),
        ({OT3Mount.RIGHT: {"channels": 96}}, GantryLoad.HIGH_THROUGHPUT),
    ),
)
def test_gantry_load_transform(attached, load):
    assert OT3API._gantry_load_from_instruments(cast(PipetteDict, attached)) == load


@pytest.fixture
def mock_backend_capacitive_probe(
    ot3_hardware: ThreadManager[OT3API],
) -> Iterator[AsyncMock]:
    backend = ot3_hardware.managed_obj._backend
    with patch.object(
        backend, "capacitive_probe", AsyncMock(spec=backend.capacitive_probe)
    ) as mock_probe:
        mock_probe.return_value = Point(1, 2, 3)
        yield mock_probe


async def test_capacitive_probe(
    ot3_hardware: ThreadManager[OT3API],
    mock_move_to: AsyncMock,
    mock_backend_capacitive_probe: AsyncMock,
) -> None:
    await ot3_hardware.home()
    here = await ot3_hardware.gantry_position(OT3Mount.RIGHT)
    fake_settings = CapacitivePassSettings(
        prep_distance_mm=1,
        max_overrun_distance_mm=2,
        speed_mm_per_s=4,
        sensor_threshold_pf=1.0,
    )

    res = await ot3_hardware.capacitive_probe(OT3Mount.RIGHT, 2, fake_settings)
    assert res == pytest.approx(3)
    mock_backend_capacitive_probe.assert_called_once_with(OT3Mount.RIGHT, 3, 4)
    for call in mock_move_to.call_args_list:
        assert call[0][1].x == here.x
        assert call[0][1].y == here.y
