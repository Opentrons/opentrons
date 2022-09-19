import json
import os

import pytest
import importlib
from types import ModuleType
from typing import no_type_check, Generator, Any, Tuple

from opentrons.types import Mount, Point
from opentrons.calibration_storage import (
    types as cs_types,
    helpers,
)


MOCK_HASH = "mock_hash"
PIPETTE_ID = "pipette_id"
URI = "custom/minimal_labware_def/1"

minimalLabwareDef = {
    "metadata": {"displayName": "minimal labware"},
    "cornerOffsetFromSlot": {"x": 10, "y": 10, "z": 5},
    "parameters": {
        "isTiprack": True,
        "tipLength": 55.3,
        "tipOverlap": 2.8,
        "loadName": "minimal_labware_def",
    },
    "ordering": [["A1"], ["A2"]],
    "wells": {
        "A1": {
            "depth": 40,
            "totalLiquidVolume": 100,
            "diameter": 30,
            "x": 0,
            "y": 0,
            "z": 0,
            "shape": "circular",
        },
        "A2": {
            "depth": 40,
            "totalLiquidVolume": 100,
            "diameter": 30,
            "x": 10,
            "y": 0,
            "z": 0,
            "shape": "circular",
        },
    },
    "dimensions": {"xDimension": 1.0, "yDimension": 2.0, "zDimension": 3.0},
    "namespace": "custom",
    "version": 1,
}


@no_type_check
@pytest.fixture
def schema(request: pytest.FixtureRequest) -> Generator[ModuleType, None, None]:
    robot_type = request.param
    if robot_type == "ot3":
        yield importlib.import_module("opentrons.calibration_storage.ot3.get")
    else:
        yield importlib.import_module("opentrons.calibration_storage.ot2.get")


@no_type_check
@pytest.fixture
def _get(request: pytest.FixtureRequest) -> Generator[Tuple[ModuleType, str], None, None]:
    robot_type = request.param
    if robot_type == "ot3":
        yield importlib.import_module("opentrons.calibration_storage.ot3.get"), robot_type
    else:
        yield importlib.import_module("opentrons.calibration_storage.ot2.get"), robot_type


@no_type_check
@pytest.fixture
def starting_calibration_data(request: pytest.FixtureRequest, ot_config_tempdir: Any) -> None:
    """
    Starting calibration data fixture.

    Adds dummy data to a temporary directory to test delete commands against.
    """
    robot_type = request.param

    if robot_type == 'ot3':
        modify = importlib.import_module('opentrons.calibration_storage.ot3.modify')
    else:
        modify = importlib.import_module('opentrons.calibration_storage.ot2.modify')

    tip_length1 = modify.create_tip_length_data(minimalLabwareDef, 22.0)
    tip_length2 = modify.create_tip_length_data(minimalLabwareDef, 31.0)
    modify.save_tip_length_calibration('pip1', tip_length1)
    modify.save_tip_length_calibration('pip2', tip_length2)
    if robot_type == "ot3":
        modify.save_robot_deck_attitude([[1, 0, 0], [0, 1, 0], [0, 0, 1]], 'pip1')
        modify.save_pipette_calibration(Point(1, 1, 1), 'pip1', Mount.LEFT)
        modify.save_pipette_calibration(Point(1, 1, 1), 'pip2', Mount.RIGHT)
        modify.save_gripper_calibration(Point(1, 1, 1), 'gripper1')
    else:
        modify.save_robot_deck_attitude([[1, 0, 0], [0, 1, 0], [0, 0, 1]], 'pip1', 'mytiprack')
        modify.save_pipette_calibration(Point(1, 1, 1), 'pip1', Mount.LEFT, 'mytiprack', 'opentrons/tip_rack/1')
        modify.save_pipette_calibration(Point(1, 1, 1), 'pip2', Mount.RIGHT, 'mytiprack', 'opentrons/tip_rack/1')


@no_type_check
@pytest.mark.parametrize(
    argnames=["_get", "starting_calibration_data", "schema"],
    argvalues=[["ot2", "ot2", "ot2"], ["ot3", "ot3", "ot3"]],
    indirect=True)
def test_get_deck_calibration(_get: Tuple[ModuleType, str], starting_calibration_data: Any, schema: ModuleType) -> None:
    """
    Test ability to get a deck calibration schema.
    """
    get, robot_type = _get
    robot_deck = get.get_robot_deck_attitude()
    if robot_type == "ot3":
        assert robot_deck == schema.v1.DeckCalibrationSchema(
            attitude=[[1, 0, 0], [0, 1, 0], [0, 0, 1]],
            lastModified=robot_deck.lastModified,
            source=cs_types.SourceType.user,
            pipetteCalibratedWith='pip1',
            status=schema.v1.CalibrationStatus()
            )
    else:
        assert robot_deck == schema.v1.DeckCalibrationSchema(
            attitude=[[1, 0, 0], [0, 1, 0], [0, 0, 1]],
            last_modified=robot_deck.last_modified,
            source=cs_types.SourceType.user,
            pipette_calibrated_with='pip1',
            status=schema.v1.CalibrationStatus(),
            tiprack='mytiprack')


@no_type_check
@pytest.mark.parametrize(
    argnames=["_get", "starting_calibration_data", "schema"],
    argvalues=[["ot2", "ot2", "ot2"], ["ot3", "ot3", "ot3"]],
    indirect=True)
def test_get_pipette_calibration(_get: Tuple[ModuleType, str], starting_calibration_data: Any, schema: ModuleType) -> None:
    """
    Test ability to get a pipette calibration schema.
    """
    get, robot_type = _get
    pipette_data = get.get_pipette_offset('pip1', Mount.LEFT)
    if robot_type == "ot3":
        assert pipette_data == schema.v1.InstrumentOffsetSchema(
            offset=[1, 1, 1],
            lastModified=pipette_data.lastModified,
            source=cs_types.SourceType.user)
    else:
        assert pipette_data == schema.v1.InstrumentOffsetSchema(
            offset=[1, 1, 1],
            tiprack='mytiprack',
            uri='opentrons/tip_rack/1',
            last_modified=pipette_data.last_modified,
            source=cs_types.SourceType.user)


@no_type_check
@pytest.mark.parametrize(
    argnames=["_get", "starting_calibration_data", "schema"],
    argvalues=[["ot3", "ot3", "ot3"]],
    indirect=True)
def test_get_gripper_calibration(_get: Tuple[ModuleType, str], starting_calibration_data: Any, schema: ModuleType, enable_ot3_hardware_controller: Any) -> None:
    """
    Test ability to get a gripper calibration schema.
    """
    get, _ = _get
    gripper_data = get.get_gripper_calibration_offset('gripper1')
    assert gripper_data == schema.v1.InstrumentOffsetSchema(offset=[1, 1, 1], lastModified=gripper_data.lastModified, source=cs_types.SourceType.user)


@no_type_check
@pytest.mark.parametrize(
    argnames=["_get", "starting_calibration_data", "schema"],
    argvalues=[["ot2", "ot2", "ot2"], ["ot3", "ot3", "ot3"]],
    indirect=True)
def test_get_tip_length_calibration(_get: Tuple[ModuleType, str], starting_calibration_data: Any, schema: ModuleType) -> None:
    """
    Test ability to get a tip length calibration schema.
    """
    get, _ = _get
    tip_length_data = get.load_tip_length_calibration('pip1', minimalLabwareDef)
    assert tip_length_data == schema.v1.TipLengthSchema(
        tipLength=22.0,
        source=cs_types.SourceType.user,
        lastModified=tip_length_data.lastModified,
        uri='custom/minimal_labware_def/1'
    )

    with pytest.raises(cs_types.TipLengthCalNotFound):
        get.load_tip_length_calibration('nopipette', minimalLabwareDef)
