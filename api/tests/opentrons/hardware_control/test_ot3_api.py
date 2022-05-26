""" Tests for behaviors specific to the OT3 hardware controller.
"""
from typing import cast, Iterator
import pytest
from mock import AsyncMock, patch
from opentrons.types import Point
from opentrons.config.types import GantryLoad, CapacitivePassSettings
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.hardware_control.types import OT3Mount, OT3Axis
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


@pytest.mark.parametrize(
    "mount,moving",
    [
        (OT3Mount.RIGHT, OT3Axis.Z_R),
        (OT3Mount.LEFT, OT3Axis.Z_L),
        (OT3Mount.RIGHT, OT3Axis.X),
        (OT3Mount.LEFT, OT3Axis.X),
        (OT3Mount.RIGHT, OT3Axis.Y),
        (OT3Mount.LEFT, OT3Axis.Y),
    ],
)
async def test_capacitive_probe(
    ot3_hardware: ThreadManager[OT3API],
    mock_move_to: AsyncMock,
    mock_backend_capacitive_probe: AsyncMock,
    mount: OT3Mount,
    moving: OT3Axis,
) -> None:
    await ot3_hardware.home()
    here = await ot3_hardware.gantry_position(mount)
    fake_settings = CapacitivePassSettings(
        prep_distance_mm=1,
        max_overrun_distance_mm=2,
        speed_mm_per_s=4,
        sensor_threshold_pf=1.0,
    )

    res = await ot3_hardware.capacitive_probe(mount, moving, 2, fake_settings)
    assert res == pytest.approx(3 + moving.of_point(here))
    mock_backend_capacitive_probe.assert_called_once_with(mount, moving, 3, 4)
    for call in mock_move_to.call_args_list:
        if moving in [OT3Axis.Z_R, OT3Axis.Z_L]:
            assert call[0][1].x == here.x
            assert call[0][1].y == here.y
        elif moving == OT3Axis.X:
            assert call[0][1].y == here.y
            assert call[0][1].z == here.z
        else:
            assert call[0][1].x == here.x
            assert call[0][1].z == here.z


@pytest.mark.parametrize(
    "mount,moving",
    (
        [OT3Mount.RIGHT, OT3Axis.Z_L],
        [OT3Mount.LEFT, OT3Axis.Z_R],
        [OT3Mount.RIGHT, OT3Axis.P_L],
        [OT3Mount.RIGHT, OT3Axis.P_R],
        [OT3Mount.LEFT, OT3Axis.P_L],
        [OT3Mount.RIGHT, OT3Axis.P_R],
    ),
)
async def test_capacitive_probe_invalid_axes(
    ot3_hardware: ThreadManager[OT3API],
    mock_move_to: AsyncMock,
    mock_backend_capacitive_probe: AsyncMock,
    mount: OT3Mount,
    moving: OT3Axis,
) -> None:
    fake_settings = CapacitivePassSettings(
        prep_distance_mm=1,
        max_overrun_distance_mm=2,
        speed_mm_per_s=4,
        sensor_threshold_pf=1.0,
    )
    with pytest.raises(RuntimeError, match=r"Probing must be done with.*"):
        await ot3_hardware.capacitive_probe(mount, moving, 2, fake_settings)
    mock_move_to.assert_not_called()
    mock_backend_capacitive_probe.assert_not_called()
