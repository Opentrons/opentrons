"""Vial definition."""
from opentrons_shared_data.labware.dev_types import LabwareDefinition


VIAL_DEFINITION: LabwareDefinition = {
    "ordering": [["A1"]],
    "brand": {"brand": "Radwag", "brandId": ["AXA11"]},
    "metadata": {
        "displayName": "Radwag Pipette Calibration Vial",
        "displayCategory": "tubeRack",
        "displayVolumeUnits": "µL",
        "tags": [],
    },
    "dimensions": {"xDimension": 128, "yDimension": 86, "zDimension": 86},
    "wells": {
        "A1": {
            "depth": 40,
            "totalLiquidVolume": 2152.38,
            "shape": "circular",
            "diameter": 14.5,
            "x": 64,
            "y": 43,
            "z": 46,
        }
    },
    "groups": [
        {
            "brand": {"brand": "Radwag", "brandId": ["AXA11"]},
            "metadata": {"wellBottomShape": "flat", "displayCategory": "tubeRack"},
            "wells": ["A1"],
        }
    ],
    "parameters": {
        "format": "irregular",
        "quirks": [],
        "isTiprack": False,
        "isMagneticModuleCompatible": False,
        "loadName": "radwag_pipette_calibration_vial",
    },
    "namespace": "custom_beta",
    "version": 1,
    "schemaVersion": 2,
    "cornerOffsetFromSlot": {"x": 0, "y": 0, "z": 0},
}
