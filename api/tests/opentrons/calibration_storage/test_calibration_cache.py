import json
import os
import pytest
import importlib

from typing import Generator, no_type_check, Any, Tuple
from types import ModuleType
from opentrons.types import MountType, Point
from opentrons import config
from opentrons.util.helpers import utc_now


@no_type_check
@pytest.fixture
def _cache(
    request: pytest.FixtureRequest,
) -> Generator[Tuple[ModuleType, str], None, None]:
    """
    Cache module fixture.

    Returns the correct module based on requested robot type and the requested
        robot type.
    """
    robot_type = request.param
    if robot_type == "ot3":
        yield importlib.import_module("opentrons.calibration_storage.ot3.cache"), "ot3"
    else:
        yield importlib.import_module("opentrons.calibration_storage.ot2.cache"), "ot2"


@no_type_check
@pytest.fixture
def modify(request: pytest.FixtureRequest) -> Generator[ModuleType, None, None]:
    """
    Modify module fixture.

    Returns the correct module based on requested robot type.
    """
    robot_type = request.param
    if robot_type == "ot3":
        yield importlib.import_module("opentrons.calibration_storage.ot3.modify")
    else:
        yield importlib.import_module("opentrons.calibration_storage.ot2.modify")


@no_type_check
@pytest.fixture
def schema(request: pytest.FixtureRequest) -> Generator[ModuleType, None, None]:
    """
    Schema module fixture.

    Returns the correct module based on requested robot type.
    """
    robot_type = request.param
    if robot_type == "ot3":
        yield importlib.import_module("opentrons.calibration_storage.ot3.schemas")
    else:
        yield importlib.import_module("opentrons.calibration_storage.ot2.schemas")


@no_type_check
@pytest.mark.parametrize(
    argnames=["_cache", "schema"],
    argvalues=[["ot2", "ot2"], ["ot3", "ot3"]],
    indirect=True,
)
def test_cache_pipette_offsets(
    ot_config_tempdir: Any, _cache: Tuple[ModuleType, str], schema: ModuleType
) -> None:
    """
    Test tip length calibration cache.

    Ensure that the shape returned from the tip length calibration cache is expected, and
    busting the cache works as expected.
    """
    cache, robot_type = _cache
    assert cache._pipette_offset_calibrations() == {
        MountType.LEFT: {},
        MountType.RIGHT: {},
    }
    pip_dir = config.get_opentrons_path("pipette_calibration_dir")
    if robot_type == "ot3":
        pipette_data = schema.v1.InstrumentOffsetSchema(
            offset=Point(1, 1, 1), lastModified=utc_now()
        )
    else:
        pipette_data = schema.v1.InstrumentOffsetSchema(
            offset=Point(1, 1, 1),
            tiprack="hash",
            uri="urioflabware",
            last_modified=utc_now(),
        )
    os.makedirs(pip_dir / "left", exist_ok=True)
    os.makedirs(pip_dir / "right", exist_ok=True)
    with open(pip_dir / "left" / "pip1.json", "w") as f:
        f.write(pipette_data.json())
    with open(pip_dir / "right" / "pip1.json", "w") as f:
        f.write(pipette_data.json())

    # added things, but the cache wasn't busted
    assert cache._pipette_offset_calibrations() == {
        MountType.LEFT: {},
        MountType.RIGHT: {},
    }

    cache._pipette_offset_calibrations.cache_clear()
    # remove stuff w/o busting cash
    # bust cache and see it is updated
    assert cache._pipette_offset_calibrations() == {
        MountType.LEFT: {"pip1": pipette_data},
        MountType.RIGHT: {"pip1": pipette_data},
    }


@no_type_check
@pytest.mark.parametrize(
    argnames=["_cache", "schema"],
    argvalues=[["ot2", "ot2"], ["ot3", "ot3"]],
    indirect=True,
)
def test_cache_tip_lengths(
    ot_config_tempdir: Any, _cache: Tuple[ModuleType, str], schema: ModuleType
) -> None:
    """
    Test tip length calibration cache.

    Ensure that the shape returned from the tip length calibration cache is expected, and
    busting the cache works as expected.
    """
    cache, _ = _cache
    # check nothing exists in tip length calibrations
    assert cache._tip_length_calibrations() == {}
    tip_dir = config.get_opentrons_path("tip_length_calibration_dir")

    tip_length_data = schema.v1.TipLengthSchema(
        tipLength=22.0, lastModified=utc_now(), uri="opentrons/tiprack/1"
    )
    os.makedirs(tip_dir, exist_ok=True)
    # workaround for pydantic since they don't have proper dict encoders/decoders
    # we cannot directly convert to a dict object by calling `tip_length_data.dict()`
    tip_length_dict = json.loads(tip_length_data.json())
    # add stuff
    with open(tip_dir / "pip1.json", "w") as f:
        json.dump({"tiprackhash": tip_length_dict}, f)

    # bust cache and see it is updated
    cache._tip_length_calibrations.cache_clear()
    assert cache._tip_length_calibrations() == {
        "pip1": {"tiprackhash": tip_length_data}
    }


@no_type_check
@pytest.mark.parametrize(
    argnames=["_cache", "schema"],
    argvalues=[["ot2", "ot2"], ["ot3", "ot3"]],
    indirect=True,
)
def test_cache_deck_calibration(
    ot_config_tempdir: Any, _cache: Tuple[ModuleType, str], schema: ModuleType
) -> None:
    """
    Test deck calibration cache.

    Ensure that the shape returned from the deck calibration cache is expected, and
    busting the cache works as expected.
    """
    cache, robot_type = _cache
    assert cache._deck_calibration() == None
    if robot_type == "ot3":
        deck_cal = schema.v1.DeckCalibrationSchema(
            attitude=[[1, 0, 0], [0, 1, 0], [0, 0, 1]], lastModified=utc_now()
        )
    else:
        deck_cal = schema.v1.DeckCalibrationSchema(
            attitude=[[1, 0, 0], [0, 1, 0], [0, 0, 1]], last_modified=utc_now()
        )

    deck_dir = config.get_opentrons_path("robot_calibration_dir")
    os.makedirs(deck_dir, exist_ok=True)
    with open(deck_dir / "deck_calibration.json", "w") as f:
        f.write(deck_cal.json())
    cache._deck_calibration.cache_clear()
    assert cache._deck_calibration() == deck_cal


@no_type_check
def test_cache_gripper_offsets(ot_config_tempdir: Any) -> None:
    """
    Test gripper offsets cache.

    Ensure that the shape returned from the gripper offset cache is expected, and
    busting the cache works as expected.
    """
    cache = importlib.import_module("opentrons.calibration_storage.ot3.cache")
    schema = importlib.import_module("opentrons.calibration_storage.ot3.schemas")

    # assert no data is in the cache
    assert cache._gripper_offset_calibrations() == {}

    gripper_dir = config.get_opentrons_path("gripper_calibration_dir")

    gripper_data = schema.v1.InstrumentOffsetSchema(
        offset=Point(1, 1, 1), lastModified=utc_now()
    )

    os.makedirs(gripper_dir, exist_ok=True)
    with open(gripper_dir / "gripper1.json", "w") as f:
        f.write(gripper_data.json())

    cache._gripper_offset_calibrations.cache_clear()
    assert cache._gripper_offset_calibrations() == {"gripper1": gripper_data}
