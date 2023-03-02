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
    "dimensions": {"xDimension": 127.8, "yDimension": 85.5, "zDimension": 80},
    "wells": {
        "A1": {
            "depth": 60,
            "totalLiquidVolume": 10252.4,
            "shape": "circular",
            "diameter": 14.75,
            "x": 105,
            "y": 72.5,
            "z": 20,
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
