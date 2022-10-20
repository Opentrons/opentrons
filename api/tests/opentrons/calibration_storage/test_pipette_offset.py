import pytest
import importlib
from types import ModuleType
from typing import no_type_check, Generator, Any, Tuple

from opentrons.types import Mount, Point, MountType
from opentrons.calibration_storage import (
    types as cs_types,
)


@no_type_check
@pytest.fixture
def _pipette(
    request: pytest.FixtureRequest,
) -> Generator[Tuple[ModuleType, str], None, None]:
    robot_type = request.param
    if robot_type == "ot3":
        yield importlib.import_module(
            "opentrons.calibration_storage.ot3.pipette_offset"
        ), robot_type
    else:
        yield importlib.import_module(
            "opentrons.calibration_storage.ot2.pipette_offset"
        ), robot_type


@no_type_check
@pytest.fixture
def model(
    request: pytest.FixtureRequest,
) -> Generator[ModuleType, None, None]:
    robot_type = request.param
    if robot_type == "ot3":
        yield importlib.import_module("opentrons.calibration_storage.ot3.models")
    else:
        yield importlib.import_module("opentrons.calibration_storage.ot2.models")


@no_type_check
@pytest.fixture
def starting_calibration_data(_pipette: ModuleType, ot_config_tempdir: Any) -> None:
    """
    Starting calibration data fixture.

    Adds dummy data to a temporary directory to test delete commands against.
    """
    pipette, robot_type = _pipette

    if robot_type == "ot3":
        pipette.save_pipette_calibration(Point(1, 1, 1), "pip1", Mount.LEFT)
        pipette.save_pipette_calibration(Point(1, 1, 1), "pip2", Mount.RIGHT)
    else:
        pipette.save_pipette_calibration(
            Point(1, 1, 1), "pip1", Mount.LEFT, "mytiprack", "opentrons/tip_rack/1"
        )
        pipette.save_pipette_calibration(
            Point(1, 1, 1), "pip2", Mount.RIGHT, "mytiprack", "opentrons/tip_rack/1"
        )


@no_type_check
@pytest.mark.parametrize(
    argnames=["_pipette", "starting_calibration_data"],
    argvalues=[["ot2", "ot2"], ["ot3", "ot3"]],
    indirect=True,
)
def test_delete_all_pipette_calibration(
    starting_calibration_data: Any, _pipette: ModuleType
) -> None:
    """
    Test delete all pipette calibrations.
    """
    pipette, _ = _pipette
    assert pipette._pipette_offset_calibrations() != {}
    pipette.clear_pipette_offset_calibrations()
    assert pipette._pipette_offset_calibrations() == {
        MountType.LEFT: {},
        MountType.RIGHT: {},
    }


@no_type_check
@pytest.mark.parametrize(
    argnames=["_pipette", "starting_calibration_data"],
    argvalues=[["ot2", "ot2"], ["ot3", "ot3"]],
    indirect=True,
)
def test_delete_specific_pipette_offset(
    starting_calibration_data: Any, _pipette: ModuleType
) -> None:
    """
    Test delete a specific pipette calibration.
    """
    pipette, _ = _pipette
    assert pipette._pipette_offset_calibrations() != {}
    assert pipette.get_pipette_offset("pip1", Mount.LEFT) is not None
    pipette.delete_pipette_offset_file("pip1", Mount.LEFT)
    assert pipette.get_pipette_offset("pip1", Mount.LEFT) is None


@no_type_check
@pytest.mark.parametrize(
    argnames=["_pipette"],
    argvalues=[["ot2"], ["ot3"]],
    indirect=True,
)
def test_save_pipette_calibration(ot_config_tempdir: Any, _pipette: ModuleType) -> None:
    """
    Test saving pipette calibrations.
    """
    pipette, robot_type = _pipette
    assert pipette._pipette_offset_calibrations() == {
        MountType.LEFT: {},
        MountType.RIGHT: {},
    }
    if robot_type == "ot3":
        pipette.save_pipette_calibration(Point(1, 1, 1), "pip1", Mount.LEFT)
        pipette.save_pipette_calibration(Point(1, 1, 1), "pip2", Mount.RIGHT)
    else:
        pipette.save_pipette_calibration(
            Point(1, 1, 1), "pip1", Mount.LEFT, "mytiprack", "opentrons/tip_rack/1"
        )
        pipette.save_pipette_calibration(
            Point(1, 1, 1), "pip2", Mount.RIGHT, "mytiprack", "opentrons/tip_rack/1"
        )
    assert pipette._pipette_offset_calibrations() != {}
    assert pipette._pipette_offset_calibrations()[MountType.LEFT] != {}
    assert pipette._pipette_offset_calibrations()[MountType.RIGHT] != {}
    assert pipette._pipette_offset_calibrations()[MountType.LEFT][
        "pip1"
    ].offset == Point(1, 1, 1)
    assert pipette._pipette_offset_calibrations()[MountType.RIGHT][
        "pip2"
    ].offset == Point(1, 1, 1)


@no_type_check
@pytest.mark.parametrize(
    argnames=["_pipette", "starting_calibration_data", "model"],
    argvalues=[["ot2", "ot2", "ot2"], ["ot3", "ot3", "ot3"]],
    indirect=True,
)
def test_get_pipette_calibration(
    _pipette: Tuple[ModuleType, str], starting_calibration_data: Any, model: ModuleType
) -> None:
    """
    Test ability to get a pipette calibration model.
    """
    pipette, robot_type = _pipette
    pipette_data = pipette.get_pipette_offset("pip1", Mount.LEFT)
    if robot_type == "ot3":
        assert pipette_data == model.v1.InstrumentOffsetModel(
            offset=Point(1, 1, 1),
            lastModified=pipette_data.lastModified,
            source=cs_types.SourceType.user,
        )
    else:
        assert pipette_data == model.v1.InstrumentOffsetModel(
            offset=Point(1, 1, 1),
            tiprack="mytiprack",
            uri="opentrons/tip_rack/1",
            last_modified=pipette_data.last_modified,
            source=cs_types.SourceType.user,
        )
