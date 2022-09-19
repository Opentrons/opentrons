import json
import os

import pytest

from opentrons_shared_data.pipette.dev_types import LabwareUri
from opentrons.protocol_api import labware
from opentrons.protocol_api.core.protocol_api.labware import LabwareImplementation
from opentrons.types import Point, Location


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


def test_wells_rebuilt_with_offset():
    test_labware = labware.Labware(
        implementation=LabwareImplementation(
            minimalLabwareDef, Location(Point(0, 0, 0), "deck")  # type: ignore[arg-type]
        )
    )
    old_wells = test_labware.wells()
    assert test_labware._implementation.get_geometry().offset == Point(10, 10, 5)
    assert test_labware._implementation.get_calibrated_offset() == Point(10, 10, 5)
    test_labware.set_offset(x=2, y=2, z=2)
    new_wells = test_labware.wells()
    assert old_wells[0] != new_wells[0]
    assert test_labware._implementation.get_geometry().offset == Point(10, 10, 5)
    assert test_labware._implementation.get_calibrated_offset() == Point(12, 12, 7)

