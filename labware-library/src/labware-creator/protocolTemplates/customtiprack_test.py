import json
from opentrons import protocol_api, types


TEST_TIPRACK_SLOT = '5'

RATE = 0.25  # % of default speeds
SLOWER_RATE = 0.1

PIPETTE_MOUNT = 'left'
PIPETTE_NAME = 'p20_multi_gen2'


TIPRACK_DEF_JSON = """{
  "ordering": [
    [
      "A1",
      "B1",
      "C1",
      "D1",
      "E1",
      "F1",
      "G1",
      "H1"
    ],
    [
      "A2",
      "B2",
      "C2",
      "D2",
      "E2",
      "F2",
      "G2",
      "H2"
    ],
    [
      "A3",
      "B3",
      "C3",
      "D3",
      "E3",
      "F3",
      "G3",
      "H3"
    ],
    [
      "A4",
      "B4",
      "C4",
      "D4",
      "E4",
      "F4",
      "G4",
      "H4"
    ],
    [
      "A5",
      "B5",
      "C5",
      "D5",
      "E5",
      "F5",
      "G5",
      "H5"
    ],
    [
      "A6",
      "B6",
      "C6",
      "D6",
      "E6",
      "F6",
      "G6",
      "H6"
    ],
    [
      "A7",
      "B7",
      "C7",
      "D7",
      "E7",
      "F7",
      "G7",
      "H7"
    ],
    [
      "A8",
      "B8",
      "C8",
      "D8",
      "E8",
      "F8",
      "G8",
      "H8"
    ],
    [
      "A9",
      "B9",
      "C9",
      "D9",
      "E9",
      "F9",
      "G9",
      "H9"
    ],
    [
      "A10",
      "B10",
      "C10",
      "D10",
      "E10",
      "F10",
      "G10",
      "H10"
    ],
    [
      "A11",
      "B11",
      "C11",
      "D11",
      "E11",
      "F11",
      "G11",
      "H11"
    ],
    [
      "A12",
      "B12",
      "C12",
      "D12",
      "E12",
      "F12",
      "G12",
      "H12"
    ]
  ],
  "brand": {
    "brand": "generic"
  },
  "metadata": {
    "displayName": "TipOne 300µL in Adapter",
    "displayCategory": "tipRack",
    "displayVolumeUnits": "µL",
    "tags": []
  },
  "dimensions": {
    "xDimension": 127.75,
    "yDimension": 85.5,
    "zDimension": 62.17
  },
  "wells": {
    "A1": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 14.2,
      "y": 74.1,
      "z": 8.99
    },
    "B1": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 14.2,
      "y": 65.1,
      "z": 8.99
    },
    "C1": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 14.2,
      "y": 56.1,
      "z": 8.99
    },
    "D1": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 14.2,
      "y": 47.1,
      "z": 8.99
    },
    "E1": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 14.2,
      "y": 38.1,
      "z": 8.99
    },
    "F1": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 14.2,
      "y": 29.1,
      "z": 8.99
    },
    "G1": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 14.2,
      "y": 20.1,
      "z": 8.99
    },
    "H1": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 14.2,
      "y": 11.1,
      "z": 8.99
    },
    "A2": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 23.2,
      "y": 74.1,
      "z": 8.99
    },
    "B2": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 23.2,
      "y": 65.1,
      "z": 8.99
    },
    "C2": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 23.2,
      "y": 56.1,
      "z": 8.99
    },
    "D2": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 23.2,
      "y": 47.1,
      "z": 8.99
    },
    "E2": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 23.2,
      "y": 38.1,
      "z": 8.99
    },
    "F2": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 23.2,
      "y": 29.1,
      "z": 8.99
    },
    "G2": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 23.2,
      "y": 20.1,
      "z": 8.99
    },
    "H2": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 23.2,
      "y": 11.1,
      "z": 8.99
    },
    "A3": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 32.2,
      "y": 74.1,
      "z": 8.99
    },
    "B3": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 32.2,
      "y": 65.1,
      "z": 8.99
    },
    "C3": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 32.2,
      "y": 56.1,
      "z": 8.99
    },
    "D3": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 32.2,
      "y": 47.1,
      "z": 8.99
    },
    "E3": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 32.2,
      "y": 38.1,
      "z": 8.99
    },
    "F3": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 32.2,
      "y": 29.1,
      "z": 8.99
    },
    "G3": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 32.2,
      "y": 20.1,
      "z": 8.99
    },
    "H3": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 32.2,
      "y": 11.1,
      "z": 8.99
    },
    "A4": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 41.2,
      "y": 74.1,
      "z": 8.99
    },
    "B4": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 41.2,
      "y": 65.1,
      "z": 8.99
    },
    "C4": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 41.2,
      "y": 56.1,
      "z": 8.99
    },
    "D4": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 41.2,
      "y": 47.1,
      "z": 8.99
    },
    "E4": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 41.2,
      "y": 38.1,
      "z": 8.99
    },
    "F4": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 41.2,
      "y": 29.1,
      "z": 8.99
    },
    "G4": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 41.2,
      "y": 20.1,
      "z": 8.99
    },
    "H4": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 41.2,
      "y": 11.1,
      "z": 8.99
    },
    "A5": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 50.2,
      "y": 74.1,
      "z": 8.99
    },
    "B5": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 50.2,
      "y": 65.1,
      "z": 8.99
    },
    "C5": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 50.2,
      "y": 56.1,
      "z": 8.99
    },
    "D5": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 50.2,
      "y": 47.1,
      "z": 8.99
    },
    "E5": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 50.2,
      "y": 38.1,
      "z": 8.99
    },
    "F5": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 50.2,
      "y": 29.1,
      "z": 8.99
    },
    "G5": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 50.2,
      "y": 20.1,
      "z": 8.99
    },
    "H5": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 50.2,
      "y": 11.1,
      "z": 8.99
    },
    "A6": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 59.2,
      "y": 74.1,
      "z": 8.99
    },
    "B6": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 59.2,
      "y": 65.1,
      "z": 8.99
    },
    "C6": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 59.2,
      "y": 56.1,
      "z": 8.99
    },
    "D6": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 59.2,
      "y": 47.1,
      "z": 8.99
    },
    "E6": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 59.2,
      "y": 38.1,
      "z": 8.99
    },
    "F6": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 59.2,
      "y": 29.1,
      "z": 8.99
    },
    "G6": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 59.2,
      "y": 20.1,
      "z": 8.99
    },
    "H6": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 59.2,
      "y": 11.1,
      "z": 8.99
    },
    "A7": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 68.2,
      "y": 74.1,
      "z": 8.99
    },
    "B7": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 68.2,
      "y": 65.1,
      "z": 8.99
    },
    "C7": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 68.2,
      "y": 56.1,
      "z": 8.99
    },
    "D7": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 68.2,
      "y": 47.1,
      "z": 8.99
    },
    "E7": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 68.2,
      "y": 38.1,
      "z": 8.99
    },
    "F7": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 68.2,
      "y": 29.1,
      "z": 8.99
    },
    "G7": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 68.2,
      "y": 20.1,
      "z": 8.99
    },
    "H7": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 68.2,
      "y": 11.1,
      "z": 8.99
    },
    "A8": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 77.2,
      "y": 74.1,
      "z": 8.99
    },
    "B8": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 77.2,
      "y": 65.1,
      "z": 8.99
    },
    "C8": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 77.2,
      "y": 56.1,
      "z": 8.99
    },
    "D8": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 77.2,
      "y": 47.1,
      "z": 8.99
    },
    "E8": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 77.2,
      "y": 38.1,
      "z": 8.99
    },
    "F8": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 77.2,
      "y": 29.1,
      "z": 8.99
    },
    "G8": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 77.2,
      "y": 20.1,
      "z": 8.99
    },
    "H8": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 77.2,
      "y": 11.1,
      "z": 8.99
    },
    "A9": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 86.2,
      "y": 74.1,
      "z": 8.99
    },
    "B9": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 86.2,
      "y": 65.1,
      "z": 8.99
    },
    "C9": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 86.2,
      "y": 56.1,
      "z": 8.99
    },
    "D9": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 86.2,
      "y": 47.1,
      "z": 8.99
    },
    "E9": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 86.2,
      "y": 38.1,
      "z": 8.99
    },
    "F9": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 86.2,
      "y": 29.1,
      "z": 8.99
    },
    "G9": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 86.2,
      "y": 20.1,
      "z": 8.99
    },
    "H9": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 86.2,
      "y": 11.1,
      "z": 8.99
    },
    "A10": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 95.2,
      "y": 74.1,
      "z": 8.99
    },
    "B10": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 95.2,
      "y": 65.1,
      "z": 8.99
    },
    "C10": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 95.2,
      "y": 56.1,
      "z": 8.99
    },
    "D10": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 95.2,
      "y": 47.1,
      "z": 8.99
    },
    "E10": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 95.2,
      "y": 38.1,
      "z": 8.99
    },
    "F10": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 95.2,
      "y": 29.1,
      "z": 8.99
    },
    "G10": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 95.2,
      "y": 20.1,
      "z": 8.99
    },
    "H10": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 95.2,
      "y": 11.1,
      "z": 8.99
    },
    "A11": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 104.2,
      "y": 74.1,
      "z": 8.99
    },
    "B11": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 104.2,
      "y": 65.1,
      "z": 8.99
    },
    "C11": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 104.2,
      "y": 56.1,
      "z": 8.99
    },
    "D11": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 104.2,
      "y": 47.1,
      "z": 8.99
    },
    "E11": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 104.2,
      "y": 38.1,
      "z": 8.99
    },
    "F11": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 104.2,
      "y": 29.1,
      "z": 8.99
    },
    "G11": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 104.2,
      "y": 20.1,
      "z": 8.99
    },
    "H11": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 104.2,
      "y": 11.1,
      "z": 8.99
    },
    "A12": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 113.2,
      "y": 74.1,
      "z": 8.99
    },
    "B12": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 113.2,
      "y": 65.1,
      "z": 8.99
    },
    "C12": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 113.2,
      "y": 56.1,
      "z": 8.99
    },
    "D12": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 113.2,
      "y": 47.1,
      "z": 8.99
    },
    "E12": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 113.2,
      "y": 38.1,
      "z": 8.99
    },
    "F12": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 113.2,
      "y": 29.1,
      "z": 8.99
    },
    "G12": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 113.2,
      "y": 20.1,
      "z": 8.99
    },
    "H12": {
      "depth": 53.18,
      "shape": "circular",
      "diameter": 5.2,
      "totalLiquidVolume": 300,
      "x": 113.2,
      "y": 11.1,
      "z": 8.99
    }
  },
  "groups": [
    {
      "metadata": {},
      "wells": [
        "A1",
        "B1",
        "C1",
        "D1",
        "E1",
        "F1",
        "G1",
        "H1",
        "A2",
        "B2",
        "C2",
        "D2",
        "E2",
        "F2",
        "G2",
        "H2",
        "A3",
        "B3",
        "C3",
        "D3",
        "E3",
        "F3",
        "G3",
        "H3",
        "A4",
        "B4",
        "C4",
        "D4",
        "E4",
        "F4",
        "G4",
        "H4",
        "A5",
        "B5",
        "C5",
        "D5",
        "E5",
        "F5",
        "G5",
        "H5",
        "A6",
        "B6",
        "C6",
        "D6",
        "E6",
        "F6",
        "G6",
        "H6",
        "A7",
        "B7",
        "C7",
        "D7",
        "E7",
        "F7",
        "G7",
        "H7",
        "A8",
        "B8",
        "C8",
        "D8",
        "E8",
        "F8",
        "G8",
        "H8",
        "A9",
        "B9",
        "C9",
        "D9",
        "E9",
        "F9",
        "G9",
        "H9",
        "A10",
        "B10",
        "C10",
        "D10",
        "E10",
        "F10",
        "G10",
        "H10",
        "A11",
        "B11",
        "C11",
        "D11",
        "E11",
        "F11",
        "G11",
        "H11",
        "A12",
        "B12",
        "C12",
        "D12",
        "E12",
        "F12",
        "G12",
        "H12"
      ]
    }
  ],
  "parameters": {
    "format": "96Standard",
    "isTiprack": true,
    "tipLength": 53.18,
    "isMagneticModuleCompatible": false,
    "loadName": "TipOne_tiprack_adapter_300uL"
  },
  "namespace": "custom_beta",
  "version": 1,
  "schemaVersion": 2,
  "cornerOffsetFromSlot": {
    "x": 0,
    "y": 0,
    "z": 0
  }
}"""
TIPRACK_DEF = json.loads(TIPRACK_DEF_JSON)
TIPRACK_LABEL = TIPRACK_DEF.get('metadata', {}).get(
    'displayName', 'test labware')

metadata = {'apiLevel': '2.0'}


def run(protocol: protocol_api.ProtocolContext):
    tiprack = protocol.load_labware_from_definition(TIPRACK_DEF, TEST_TIPRACK_SLOT, TIPRACK_LABEL)
    pipette = protocol.load_instrument(
        PIPETTE_NAME, PIPETTE_MOUNT, tip_racks=[tiprack])

    num_cols = len(TIPRACK_DEF.get('ordering', [[]]))
    num_rows = len(TIPRACK_DEF.get('ordering', [[]])[0])


    def set_speeds(rate):
        protocol.max_speeds.update({
            'X': (600 * rate),
            'Y': (400 * rate),
            'Z': (125 * rate),
            'A': (125 * rate),
        })

        speed_max = max(protocol.max_speeds.values())

        for instr in protocol.loaded_instruments.values():
            instr.default_speed = speed_max

    set_speeds(RATE)
    firstwell = tiprack.well('A1')
    pipette.move_to(firstwell.top())
    protocol.pause("If the pipette is accurate click 'resume'")
    pipette.pick_up_tip()
    protocol.pause("If the pipette went into the center of the tip, click 'resume'")
    pipette.return_tip()
    protocol.pause("If the pipette successfully picked up the tip but does not drop it,\
     pull the tip off by hand and click 'resume'. \
     Do not worry about tip ejection yet")

    last_col = (num_cols * num_rows) - num_rows
    if (PIPETTE_NAME == 'p20_multi_gen2' or PIPETTE_NAME == 'p300_multi_gen2'):
        well = tiprack.well(last_col)
        pipette.move_to(well.top())
        protocol.pause("If the pipette is accurate click 'resume'")
        pipette.pick_up_tip(well)
    else:
        last_well = (num_cols) * (num_rows)
        well = tiprack.well(last_well-1)
        pipette.move_to(well.top())
        protocol.pause("If the pipette is accurate click 'resume'")
        pipette.pick_up_tip(well)
        
    protocol.pause("If the pipette went to the center of the tip, hit 'resume'")
    pipette.return_tip()
    protocol.comment("If the pipette successfully picked up the tip but does not drop it,\
     pull the tip off by hand and click 'resume'. \
     Do not worry about tip ejection yet")

