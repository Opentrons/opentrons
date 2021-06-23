import json
from opentrons import protocol_api, types
from opentrons.types import Point

TEST_LABWARE_SLOT = '5'

RATE = 0.25  # % of default speeds
SLOWER_RATE = 0.1 #slower rate is very slow! 

PIPETTE_MOUNT = 'right'
PIPETTE_NAME = 'p20_single_gen2'

TIPRACK_SLOT = '11'
TIPRACK_LOADNAME = 'opentrons_96_filtertiprack_20ul'

#PIPETTE_MOUNT = 'left'
#PIPETTE_NAME = 'p300_multi_gen2'

#TIPRACK_SLOT = '11'
#TIPRACK_LOADNAME = 'opentrons_96_tiprack_300ul'

LABWARE_DEF_JSON = """{
    "ordering": [
        [
            "A1",
            "B1",
            "C1",
            "D1",
            "E1",
            "F1",
            "G1",
            "H1",
            "I1",
            "J1",
            "K1",
            "L1",
            "M1",
            "N1",
            "O1",
            "P1"
        ],
        [
            "A2",
            "B2",
            "C2",
            "D2",
            "E2",
            "F2",
            "G2",
            "H2",
            "I2",
            "J2",
            "K2",
            "L2",
            "M2",
            "N2",
            "O2",
            "P2"
        ],
        [
            "A3",
            "B3",
            "C3",
            "D3",
            "E3",
            "F3",
            "G3",
            "H3",
            "I3",
            "J3",
            "K3",
            "L3",
            "M3",
            "N3",
            "O3",
            "P3"
        ],
        [
            "A4",
            "B4",
            "C4",
            "D4",
            "E4",
            "F4",
            "G4",
            "H4",
            "I4",
            "J4",
            "K4",
            "L4",
            "M4",
            "N4",
            "O4",
            "P4"
        ],
        [
            "A5",
            "B5",
            "C5",
            "D5",
            "E5",
            "F5",
            "G5",
            "H5",
            "I5",
            "J5",
            "K5",
            "L5",
            "M5",
            "N5",
            "O5",
            "P5"
        ],
        [
            "A6",
            "B6",
            "C6",
            "D6",
            "E6",
            "F6",
            "G6",
            "H6",
            "I6",
            "J6",
            "K6",
            "L6",
            "M6",
            "N6",
            "O6",
            "P6"
        ],
        [
            "A7",
            "B7",
            "C7",
            "D7",
            "E7",
            "F7",
            "G7",
            "H7",
            "I7",
            "J7",
            "K7",
            "L7",
            "M7",
            "N7",
            "O7",
            "P7"
        ],
        [
            "A8",
            "B8",
            "C8",
            "D8",
            "E8",
            "F8",
            "G8",
            "H8",
            "I8",
            "J8",
            "K8",
            "L8",
            "M8",
            "N8",
            "O8",
            "P8"
        ],
        [
            "A9",
            "B9",
            "C9",
            "D9",
            "E9",
            "F9",
            "G9",
            "H9",
            "I9",
            "J9",
            "K9",
            "L9",
            "M9",
            "N9",
            "O9",
            "P9"
        ],
        [
            "A10",
            "B10",
            "C10",
            "D10",
            "E10",
            "F10",
            "G10",
            "H10",
            "I10",
            "J10",
            "K10",
            "L10",
            "M10",
            "N10",
            "O10",
            "P10"
        ],
        [
            "A11",
            "B11",
            "C11",
            "D11",
            "E11",
            "F11",
            "G11",
            "H11",
            "I11",
            "J11",
            "K11",
            "L11",
            "M11",
            "N11",
            "O11",
            "P11"
        ],
        [
            "A12",
            "B12",
            "C12",
            "D12",
            "E12",
            "F12",
            "G12",
            "H12",
            "I12",
            "J12",
            "K12",
            "L12",
            "M12",
            "N12",
            "O12",
            "P12"
        ],
        [
            "A13",
            "B13",
            "C13",
            "D13",
            "E13",
            "F13",
            "G13",
            "H13",
            "I13",
            "J13",
            "K13",
            "L13",
            "M13",
            "N13",
            "O13",
            "P13"
        ],
        [
            "A14",
            "B14",
            "C14",
            "D14",
            "E14",
            "F14",
            "G14",
            "H14",
            "I14",
            "J14",
            "K14",
            "L14",
            "M14",
            "N14",
            "O14",
            "P14"
        ],
        [
            "A15",
            "B15",
            "C15",
            "D15",
            "E15",
            "F15",
            "G15",
            "H15",
            "I15",
            "J15",
            "K15",
            "L15",
            "M15",
            "N15",
            "O15",
            "P15"
        ],
        [
            "A16",
            "B16",
            "C16",
            "D16",
            "E16",
            "F16",
            "G16",
            "H16",
            "I16",
            "J16",
            "K16",
            "L16",
            "M16",
            "N16",
            "O16",
            "P16"
        ],
        [
            "A17",
            "B17",
            "C17",
            "D17",
            "E17",
            "F17",
            "G17",
            "H17",
            "I17",
            "J17",
            "K17",
            "L17",
            "M17",
            "N17",
            "O17",
            "P17"
        ],
        [
            "A18",
            "B18",
            "C18",
            "D18",
            "E18",
            "F18",
            "G18",
            "H18",
            "I18",
            "J18",
            "K18",
            "L18",
            "M18",
            "N18",
            "O18",
            "P18"
        ],
        [
            "A19",
            "B19",
            "C19",
            "D19",
            "E19",
            "F19",
            "G19",
            "H19",
            "I19",
            "J19",
            "K19",
            "L19",
            "M19",
            "N19",
            "O19",
            "P19"
        ],
        [
            "A20",
            "B20",
            "C20",
            "D20",
            "E20",
            "F20",
            "G20",
            "H20",
            "I20",
            "J20",
            "K20",
            "L20",
            "M20",
            "N20",
            "O20",
            "P20"
        ],
        [
            "A21",
            "B21",
            "C21",
            "D21",
            "E21",
            "F21",
            "G21",
            "H21",
            "I21",
            "J21",
            "K21",
            "L21",
            "M21",
            "N21",
            "O21",
            "P21"
        ],
        [
            "A22",
            "B22",
            "C22",
            "D22",
            "E22",
            "F22",
            "G22",
            "H22",
            "I22",
            "J22",
            "K22",
            "L22",
            "M22",
            "N22",
            "O22",
            "P22"
        ],
        [
            "A23",
            "B23",
            "C23",
            "D23",
            "E23",
            "F23",
            "G23",
            "H23",
            "I23",
            "J23",
            "K23",
            "L23",
            "M23",
            "N23",
            "O23",
            "P23"
        ],
        [
            "A24",
            "B24",
            "C24",
            "D24",
            "E24",
            "F24",
            "G24",
            "H24",
            "I24",
            "J24",
            "K24",
            "L24",
            "M24",
            "N24",
            "O24",
            "P24"
        ]
    ],
    "brand": {
        "brand": "testing_LC",
        "brandId": [
            "1567987"
        ]
    },
    "metadata": {
        "displayName": "Testing_LC 384 Well Plate 112 µL",
        "displayCategory": "wellPlate",
        "displayVolumeUnits": "µL",
        "tags": []
    },
    "dimensions": {
        "xDimension": 127.76,
        "yDimension": 85.47,
        "zDimension": 14.22
    },
    "wells": {
        "A1": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 12.12,
            "y": 76.49,
            "z": 2.79
        },
        "B1": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 12.12,
            "y": 71.99,
            "z": 2.79
        },
        "C1": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 12.12,
            "y": 67.49,
            "z": 2.79
        },
        "D1": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 12.12,
            "y": 62.99,
            "z": 2.79
        },
        "E1": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 12.12,
            "y": 58.49,
            "z": 2.79
        },
        "F1": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 12.12,
            "y": 53.99,
            "z": 2.79
        },
        "G1": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 12.12,
            "y": 49.49,
            "z": 2.79
        },
        "H1": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 12.12,
            "y": 44.99,
            "z": 2.79
        },
        "I1": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 12.12,
            "y": 40.49,
            "z": 2.79
        },
        "J1": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 12.12,
            "y": 35.99,
            "z": 2.79
        },
        "K1": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 12.12,
            "y": 31.49,
            "z": 2.79
        },
        "L1": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 12.12,
            "y": 26.99,
            "z": 2.79
        },
        "M1": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 12.12,
            "y": 22.49,
            "z": 2.79
        },
        "N1": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 12.12,
            "y": 17.99,
            "z": 2.79
        },
        "O1": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 12.12,
            "y": 13.49,
            "z": 2.79
        },
        "P1": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 12.12,
            "y": 8.99,
            "z": 2.79
        },
        "A2": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 16.62,
            "y": 76.49,
            "z": 2.79
        },
        "B2": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 16.62,
            "y": 71.99,
            "z": 2.79
        },
        "C2": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 16.62,
            "y": 67.49,
            "z": 2.79
        },
        "D2": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 16.62,
            "y": 62.99,
            "z": 2.79
        },
        "E2": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 16.62,
            "y": 58.49,
            "z": 2.79
        },
        "F2": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 16.62,
            "y": 53.99,
            "z": 2.79
        },
        "G2": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 16.62,
            "y": 49.49,
            "z": 2.79
        },
        "H2": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 16.62,
            "y": 44.99,
            "z": 2.79
        },
        "I2": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 16.62,
            "y": 40.49,
            "z": 2.79
        },
        "J2": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 16.62,
            "y": 35.99,
            "z": 2.79
        },
        "K2": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 16.62,
            "y": 31.49,
            "z": 2.79
        },
        "L2": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 16.62,
            "y": 26.99,
            "z": 2.79
        },
        "M2": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 16.62,
            "y": 22.49,
            "z": 2.79
        },
        "N2": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 16.62,
            "y": 17.99,
            "z": 2.79
        },
        "O2": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 16.62,
            "y": 13.49,
            "z": 2.79
        },
        "P2": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 16.62,
            "y": 8.99,
            "z": 2.79
        },
        "A3": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 21.12,
            "y": 76.49,
            "z": 2.79
        },
        "B3": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 21.12,
            "y": 71.99,
            "z": 2.79
        },
        "C3": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 21.12,
            "y": 67.49,
            "z": 2.79
        },
        "D3": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 21.12,
            "y": 62.99,
            "z": 2.79
        },
        "E3": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 21.12,
            "y": 58.49,
            "z": 2.79
        },
        "F3": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 21.12,
            "y": 53.99,
            "z": 2.79
        },
        "G3": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 21.12,
            "y": 49.49,
            "z": 2.79
        },
        "H3": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 21.12,
            "y": 44.99,
            "z": 2.79
        },
        "I3": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 21.12,
            "y": 40.49,
            "z": 2.79
        },
        "J3": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 21.12,
            "y": 35.99,
            "z": 2.79
        },
        "K3": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 21.12,
            "y": 31.49,
            "z": 2.79
        },
        "L3": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 21.12,
            "y": 26.99,
            "z": 2.79
        },
        "M3": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 21.12,
            "y": 22.49,
            "z": 2.79
        },
        "N3": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 21.12,
            "y": 17.99,
            "z": 2.79
        },
        "O3": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 21.12,
            "y": 13.49,
            "z": 2.79
        },
        "P3": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 21.12,
            "y": 8.99,
            "z": 2.79
        },
        "A4": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 25.62,
            "y": 76.49,
            "z": 2.79
        },
        "B4": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 25.62,
            "y": 71.99,
            "z": 2.79
        },
        "C4": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 25.62,
            "y": 67.49,
            "z": 2.79
        },
        "D4": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 25.62,
            "y": 62.99,
            "z": 2.79
        },
        "E4": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 25.62,
            "y": 58.49,
            "z": 2.79
        },
        "F4": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 25.62,
            "y": 53.99,
            "z": 2.79
        },
        "G4": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 25.62,
            "y": 49.49,
            "z": 2.79
        },
        "H4": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 25.62,
            "y": 44.99,
            "z": 2.79
        },
        "I4": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 25.62,
            "y": 40.49,
            "z": 2.79
        },
        "J4": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 25.62,
            "y": 35.99,
            "z": 2.79
        },
        "K4": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 25.62,
            "y": 31.49,
            "z": 2.79
        },
        "L4": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 25.62,
            "y": 26.99,
            "z": 2.79
        },
        "M4": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 25.62,
            "y": 22.49,
            "z": 2.79
        },
        "N4": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 25.62,
            "y": 17.99,
            "z": 2.79
        },
        "O4": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 25.62,
            "y": 13.49,
            "z": 2.79
        },
        "P4": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 25.62,
            "y": 8.99,
            "z": 2.79
        },
        "A5": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 30.12,
            "y": 76.49,
            "z": 2.79
        },
        "B5": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 30.12,
            "y": 71.99,
            "z": 2.79
        },
        "C5": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 30.12,
            "y": 67.49,
            "z": 2.79
        },
        "D5": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 30.12,
            "y": 62.99,
            "z": 2.79
        },
        "E5": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 30.12,
            "y": 58.49,
            "z": 2.79
        },
        "F5": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 30.12,
            "y": 53.99,
            "z": 2.79
        },
        "G5": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 30.12,
            "y": 49.49,
            "z": 2.79
        },
        "H5": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 30.12,
            "y": 44.99,
            "z": 2.79
        },
        "I5": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 30.12,
            "y": 40.49,
            "z": 2.79
        },
        "J5": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 30.12,
            "y": 35.99,
            "z": 2.79
        },
        "K5": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 30.12,
            "y": 31.49,
            "z": 2.79
        },
        "L5": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 30.12,
            "y": 26.99,
            "z": 2.79
        },
        "M5": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 30.12,
            "y": 22.49,
            "z": 2.79
        },
        "N5": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 30.12,
            "y": 17.99,
            "z": 2.79
        },
        "O5": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 30.12,
            "y": 13.49,
            "z": 2.79
        },
        "P5": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 30.12,
            "y": 8.99,
            "z": 2.79
        },
        "A6": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 34.62,
            "y": 76.49,
            "z": 2.79
        },
        "B6": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 34.62,
            "y": 71.99,
            "z": 2.79
        },
        "C6": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 34.62,
            "y": 67.49,
            "z": 2.79
        },
        "D6": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 34.62,
            "y": 62.99,
            "z": 2.79
        },
        "E6": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 34.62,
            "y": 58.49,
            "z": 2.79
        },
        "F6": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 34.62,
            "y": 53.99,
            "z": 2.79
        },
        "G6": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 34.62,
            "y": 49.49,
            "z": 2.79
        },
        "H6": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 34.62,
            "y": 44.99,
            "z": 2.79
        },
        "I6": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 34.62,
            "y": 40.49,
            "z": 2.79
        },
        "J6": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 34.62,
            "y": 35.99,
            "z": 2.79
        },
        "K6": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 34.62,
            "y": 31.49,
            "z": 2.79
        },
        "L6": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 34.62,
            "y": 26.99,
            "z": 2.79
        },
        "M6": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 34.62,
            "y": 22.49,
            "z": 2.79
        },
        "N6": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 34.62,
            "y": 17.99,
            "z": 2.79
        },
        "O6": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 34.62,
            "y": 13.49,
            "z": 2.79
        },
        "P6": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 34.62,
            "y": 8.99,
            "z": 2.79
        },
        "A7": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 39.12,
            "y": 76.49,
            "z": 2.79
        },
        "B7": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 39.12,
            "y": 71.99,
            "z": 2.79
        },
        "C7": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 39.12,
            "y": 67.49,
            "z": 2.79
        },
        "D7": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 39.12,
            "y": 62.99,
            "z": 2.79
        },
        "E7": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 39.12,
            "y": 58.49,
            "z": 2.79
        },
        "F7": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 39.12,
            "y": 53.99,
            "z": 2.79
        },
        "G7": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 39.12,
            "y": 49.49,
            "z": 2.79
        },
        "H7": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 39.12,
            "y": 44.99,
            "z": 2.79
        },
        "I7": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 39.12,
            "y": 40.49,
            "z": 2.79
        },
        "J7": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 39.12,
            "y": 35.99,
            "z": 2.79
        },
        "K7": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 39.12,
            "y": 31.49,
            "z": 2.79
        },
        "L7": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 39.12,
            "y": 26.99,
            "z": 2.79
        },
        "M7": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 39.12,
            "y": 22.49,
            "z": 2.79
        },
        "N7": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 39.12,
            "y": 17.99,
            "z": 2.79
        },
        "O7": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 39.12,
            "y": 13.49,
            "z": 2.79
        },
        "P7": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 39.12,
            "y": 8.99,
            "z": 2.79
        },
        "A8": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 43.62,
            "y": 76.49,
            "z": 2.79
        },
        "B8": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 43.62,
            "y": 71.99,
            "z": 2.79
        },
        "C8": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 43.62,
            "y": 67.49,
            "z": 2.79
        },
        "D8": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 43.62,
            "y": 62.99,
            "z": 2.79
        },
        "E8": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 43.62,
            "y": 58.49,
            "z": 2.79
        },
        "F8": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 43.62,
            "y": 53.99,
            "z": 2.79
        },
        "G8": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 43.62,
            "y": 49.49,
            "z": 2.79
        },
        "H8": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 43.62,
            "y": 44.99,
            "z": 2.79
        },
        "I8": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 43.62,
            "y": 40.49,
            "z": 2.79
        },
        "J8": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 43.62,
            "y": 35.99,
            "z": 2.79
        },
        "K8": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 43.62,
            "y": 31.49,
            "z": 2.79
        },
        "L8": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 43.62,
            "y": 26.99,
            "z": 2.79
        },
        "M8": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 43.62,
            "y": 22.49,
            "z": 2.79
        },
        "N8": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 43.62,
            "y": 17.99,
            "z": 2.79
        },
        "O8": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 43.62,
            "y": 13.49,
            "z": 2.79
        },
        "P8": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 43.62,
            "y": 8.99,
            "z": 2.79
        },
        "A9": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 48.12,
            "y": 76.49,
            "z": 2.79
        },
        "B9": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 48.12,
            "y": 71.99,
            "z": 2.79
        },
        "C9": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 48.12,
            "y": 67.49,
            "z": 2.79
        },
        "D9": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 48.12,
            "y": 62.99,
            "z": 2.79
        },
        "E9": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 48.12,
            "y": 58.49,
            "z": 2.79
        },
        "F9": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 48.12,
            "y": 53.99,
            "z": 2.79
        },
        "G9": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 48.12,
            "y": 49.49,
            "z": 2.79
        },
        "H9": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 48.12,
            "y": 44.99,
            "z": 2.79
        },
        "I9": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 48.12,
            "y": 40.49,
            "z": 2.79
        },
        "J9": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 48.12,
            "y": 35.99,
            "z": 2.79
        },
        "K9": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 48.12,
            "y": 31.49,
            "z": 2.79
        },
        "L9": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 48.12,
            "y": 26.99,
            "z": 2.79
        },
        "M9": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 48.12,
            "y": 22.49,
            "z": 2.79
        },
        "N9": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 48.12,
            "y": 17.99,
            "z": 2.79
        },
        "O9": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 48.12,
            "y": 13.49,
            "z": 2.79
        },
        "P9": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 48.12,
            "y": 8.99,
            "z": 2.79
        },
        "A10": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 52.62,
            "y": 76.49,
            "z": 2.79
        },
        "B10": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 52.62,
            "y": 71.99,
            "z": 2.79
        },
        "C10": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 52.62,
            "y": 67.49,
            "z": 2.79
        },
        "D10": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 52.62,
            "y": 62.99,
            "z": 2.79
        },
        "E10": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 52.62,
            "y": 58.49,
            "z": 2.79
        },
        "F10": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 52.62,
            "y": 53.99,
            "z": 2.79
        },
        "G10": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 52.62,
            "y": 49.49,
            "z": 2.79
        },
        "H10": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 52.62,
            "y": 44.99,
            "z": 2.79
        },
        "I10": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 52.62,
            "y": 40.49,
            "z": 2.79
        },
        "J10": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 52.62,
            "y": 35.99,
            "z": 2.79
        },
        "K10": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 52.62,
            "y": 31.49,
            "z": 2.79
        },
        "L10": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 52.62,
            "y": 26.99,
            "z": 2.79
        },
        "M10": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 52.62,
            "y": 22.49,
            "z": 2.79
        },
        "N10": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 52.62,
            "y": 17.99,
            "z": 2.79
        },
        "O10": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 52.62,
            "y": 13.49,
            "z": 2.79
        },
        "P10": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 52.62,
            "y": 8.99,
            "z": 2.79
        },
        "A11": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 57.12,
            "y": 76.49,
            "z": 2.79
        },
        "B11": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 57.12,
            "y": 71.99,
            "z": 2.79
        },
        "C11": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 57.12,
            "y": 67.49,
            "z": 2.79
        },
        "D11": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 57.12,
            "y": 62.99,
            "z": 2.79
        },
        "E11": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 57.12,
            "y": 58.49,
            "z": 2.79
        },
        "F11": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 57.12,
            "y": 53.99,
            "z": 2.79
        },
        "G11": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 57.12,
            "y": 49.49,
            "z": 2.79
        },
        "H11": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 57.12,
            "y": 44.99,
            "z": 2.79
        },
        "I11": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 57.12,
            "y": 40.49,
            "z": 2.79
        },
        "J11": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 57.12,
            "y": 35.99,
            "z": 2.79
        },
        "K11": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 57.12,
            "y": 31.49,
            "z": 2.79
        },
        "L11": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 57.12,
            "y": 26.99,
            "z": 2.79
        },
        "M11": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 57.12,
            "y": 22.49,
            "z": 2.79
        },
        "N11": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 57.12,
            "y": 17.99,
            "z": 2.79
        },
        "O11": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 57.12,
            "y": 13.49,
            "z": 2.79
        },
        "P11": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 57.12,
            "y": 8.99,
            "z": 2.79
        },
        "A12": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 61.62,
            "y": 76.49,
            "z": 2.79
        },
        "B12": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 61.62,
            "y": 71.99,
            "z": 2.79
        },
        "C12": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 61.62,
            "y": 67.49,
            "z": 2.79
        },
        "D12": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 61.62,
            "y": 62.99,
            "z": 2.79
        },
        "E12": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 61.62,
            "y": 58.49,
            "z": 2.79
        },
        "F12": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 61.62,
            "y": 53.99,
            "z": 2.79
        },
        "G12": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 61.62,
            "y": 49.49,
            "z": 2.79
        },
        "H12": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 61.62,
            "y": 44.99,
            "z": 2.79
        },
        "I12": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 61.62,
            "y": 40.49,
            "z": 2.79
        },
        "J12": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 61.62,
            "y": 35.99,
            "z": 2.79
        },
        "K12": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 61.62,
            "y": 31.49,
            "z": 2.79
        },
        "L12": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 61.62,
            "y": 26.99,
            "z": 2.79
        },
        "M12": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 61.62,
            "y": 22.49,
            "z": 2.79
        },
        "N12": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 61.62,
            "y": 17.99,
            "z": 2.79
        },
        "O12": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 61.62,
            "y": 13.49,
            "z": 2.79
        },
        "P12": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 61.62,
            "y": 8.99,
            "z": 2.79
        },
        "A13": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 66.12,
            "y": 76.49,
            "z": 2.79
        },
        "B13": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 66.12,
            "y": 71.99,
            "z": 2.79
        },
        "C13": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 66.12,
            "y": 67.49,
            "z": 2.79
        },
        "D13": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 66.12,
            "y": 62.99,
            "z": 2.79
        },
        "E13": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 66.12,
            "y": 58.49,
            "z": 2.79
        },
        "F13": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 66.12,
            "y": 53.99,
            "z": 2.79
        },
        "G13": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 66.12,
            "y": 49.49,
            "z": 2.79
        },
        "H13": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 66.12,
            "y": 44.99,
            "z": 2.79
        },
        "I13": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 66.12,
            "y": 40.49,
            "z": 2.79
        },
        "J13": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 66.12,
            "y": 35.99,
            "z": 2.79
        },
        "K13": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 66.12,
            "y": 31.49,
            "z": 2.79
        },
        "L13": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 66.12,
            "y": 26.99,
            "z": 2.79
        },
        "M13": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 66.12,
            "y": 22.49,
            "z": 2.79
        },
        "N13": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 66.12,
            "y": 17.99,
            "z": 2.79
        },
        "O13": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 66.12,
            "y": 13.49,
            "z": 2.79
        },
        "P13": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 66.12,
            "y": 8.99,
            "z": 2.79
        },
        "A14": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 70.62,
            "y": 76.49,
            "z": 2.79
        },
        "B14": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 70.62,
            "y": 71.99,
            "z": 2.79
        },
        "C14": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 70.62,
            "y": 67.49,
            "z": 2.79
        },
        "D14": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 70.62,
            "y": 62.99,
            "z": 2.79
        },
        "E14": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 70.62,
            "y": 58.49,
            "z": 2.79
        },
        "F14": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 70.62,
            "y": 53.99,
            "z": 2.79
        },
        "G14": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 70.62,
            "y": 49.49,
            "z": 2.79
        },
        "H14": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 70.62,
            "y": 44.99,
            "z": 2.79
        },
        "I14": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 70.62,
            "y": 40.49,
            "z": 2.79
        },
        "J14": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 70.62,
            "y": 35.99,
            "z": 2.79
        },
        "K14": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 70.62,
            "y": 31.49,
            "z": 2.79
        },
        "L14": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 70.62,
            "y": 26.99,
            "z": 2.79
        },
        "M14": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 70.62,
            "y": 22.49,
            "z": 2.79
        },
        "N14": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 70.62,
            "y": 17.99,
            "z": 2.79
        },
        "O14": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 70.62,
            "y": 13.49,
            "z": 2.79
        },
        "P14": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 70.62,
            "y": 8.99,
            "z": 2.79
        },
        "A15": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 75.12,
            "y": 76.49,
            "z": 2.79
        },
        "B15": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 75.12,
            "y": 71.99,
            "z": 2.79
        },
        "C15": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 75.12,
            "y": 67.49,
            "z": 2.79
        },
        "D15": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 75.12,
            "y": 62.99,
            "z": 2.79
        },
        "E15": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 75.12,
            "y": 58.49,
            "z": 2.79
        },
        "F15": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 75.12,
            "y": 53.99,
            "z": 2.79
        },
        "G15": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 75.12,
            "y": 49.49,
            "z": 2.79
        },
        "H15": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 75.12,
            "y": 44.99,
            "z": 2.79
        },
        "I15": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 75.12,
            "y": 40.49,
            "z": 2.79
        },
        "J15": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 75.12,
            "y": 35.99,
            "z": 2.79
        },
        "K15": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 75.12,
            "y": 31.49,
            "z": 2.79
        },
        "L15": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 75.12,
            "y": 26.99,
            "z": 2.79
        },
        "M15": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 75.12,
            "y": 22.49,
            "z": 2.79
        },
        "N15": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 75.12,
            "y": 17.99,
            "z": 2.79
        },
        "O15": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 75.12,
            "y": 13.49,
            "z": 2.79
        },
        "P15": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 75.12,
            "y": 8.99,
            "z": 2.79
        },
        "A16": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 79.62,
            "y": 76.49,
            "z": 2.79
        },
        "B16": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 79.62,
            "y": 71.99,
            "z": 2.79
        },
        "C16": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 79.62,
            "y": 67.49,
            "z": 2.79
        },
        "D16": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 79.62,
            "y": 62.99,
            "z": 2.79
        },
        "E16": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 79.62,
            "y": 58.49,
            "z": 2.79
        },
        "F16": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 79.62,
            "y": 53.99,
            "z": 2.79
        },
        "G16": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 79.62,
            "y": 49.49,
            "z": 2.79
        },
        "H16": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 79.62,
            "y": 44.99,
            "z": 2.79
        },
        "I16": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 79.62,
            "y": 40.49,
            "z": 2.79
        },
        "J16": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 79.62,
            "y": 35.99,
            "z": 2.79
        },
        "K16": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 79.62,
            "y": 31.49,
            "z": 2.79
        },
        "L16": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 79.62,
            "y": 26.99,
            "z": 2.79
        },
        "M16": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 79.62,
            "y": 22.49,
            "z": 2.79
        },
        "N16": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 79.62,
            "y": 17.99,
            "z": 2.79
        },
        "O16": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 79.62,
            "y": 13.49,
            "z": 2.79
        },
        "P16": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 79.62,
            "y": 8.99,
            "z": 2.79
        },
        "A17": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 84.12,
            "y": 76.49,
            "z": 2.79
        },
        "B17": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 84.12,
            "y": 71.99,
            "z": 2.79
        },
        "C17": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 84.12,
            "y": 67.49,
            "z": 2.79
        },
        "D17": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 84.12,
            "y": 62.99,
            "z": 2.79
        },
        "E17": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 84.12,
            "y": 58.49,
            "z": 2.79
        },
        "F17": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 84.12,
            "y": 53.99,
            "z": 2.79
        },
        "G17": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 84.12,
            "y": 49.49,
            "z": 2.79
        },
        "H17": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 84.12,
            "y": 44.99,
            "z": 2.79
        },
        "I17": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 84.12,
            "y": 40.49,
            "z": 2.79
        },
        "J17": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 84.12,
            "y": 35.99,
            "z": 2.79
        },
        "K17": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 84.12,
            "y": 31.49,
            "z": 2.79
        },
        "L17": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 84.12,
            "y": 26.99,
            "z": 2.79
        },
        "M17": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 84.12,
            "y": 22.49,
            "z": 2.79
        },
        "N17": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 84.12,
            "y": 17.99,
            "z": 2.79
        },
        "O17": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 84.12,
            "y": 13.49,
            "z": 2.79
        },
        "P17": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 84.12,
            "y": 8.99,
            "z": 2.79
        },
        "A18": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 88.62,
            "y": 76.49,
            "z": 2.79
        },
        "B18": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 88.62,
            "y": 71.99,
            "z": 2.79
        },
        "C18": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 88.62,
            "y": 67.49,
            "z": 2.79
        },
        "D18": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 88.62,
            "y": 62.99,
            "z": 2.79
        },
        "E18": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 88.62,
            "y": 58.49,
            "z": 2.79
        },
        "F18": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 88.62,
            "y": 53.99,
            "z": 2.79
        },
        "G18": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 88.62,
            "y": 49.49,
            "z": 2.79
        },
        "H18": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 88.62,
            "y": 44.99,
            "z": 2.79
        },
        "I18": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 88.62,
            "y": 40.49,
            "z": 2.79
        },
        "J18": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 88.62,
            "y": 35.99,
            "z": 2.79
        },
        "K18": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 88.62,
            "y": 31.49,
            "z": 2.79
        },
        "L18": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 88.62,
            "y": 26.99,
            "z": 2.79
        },
        "M18": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 88.62,
            "y": 22.49,
            "z": 2.79
        },
        "N18": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 88.62,
            "y": 17.99,
            "z": 2.79
        },
        "O18": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 88.62,
            "y": 13.49,
            "z": 2.79
        },
        "P18": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 88.62,
            "y": 8.99,
            "z": 2.79
        },
        "A19": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 93.12,
            "y": 76.49,
            "z": 2.79
        },
        "B19": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 93.12,
            "y": 71.99,
            "z": 2.79
        },
        "C19": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 93.12,
            "y": 67.49,
            "z": 2.79
        },
        "D19": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 93.12,
            "y": 62.99,
            "z": 2.79
        },
        "E19": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 93.12,
            "y": 58.49,
            "z": 2.79
        },
        "F19": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 93.12,
            "y": 53.99,
            "z": 2.79
        },
        "G19": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 93.12,
            "y": 49.49,
            "z": 2.79
        },
        "H19": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 93.12,
            "y": 44.99,
            "z": 2.79
        },
        "I19": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 93.12,
            "y": 40.49,
            "z": 2.79
        },
        "J19": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 93.12,
            "y": 35.99,
            "z": 2.79
        },
        "K19": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 93.12,
            "y": 31.49,
            "z": 2.79
        },
        "L19": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 93.12,
            "y": 26.99,
            "z": 2.79
        },
        "M19": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 93.12,
            "y": 22.49,
            "z": 2.79
        },
        "N19": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 93.12,
            "y": 17.99,
            "z": 2.79
        },
        "O19": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 93.12,
            "y": 13.49,
            "z": 2.79
        },
        "P19": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 93.12,
            "y": 8.99,
            "z": 2.79
        },
        "A20": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 97.62,
            "y": 76.49,
            "z": 2.79
        },
        "B20": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 97.62,
            "y": 71.99,
            "z": 2.79
        },
        "C20": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 97.62,
            "y": 67.49,
            "z": 2.79
        },
        "D20": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 97.62,
            "y": 62.99,
            "z": 2.79
        },
        "E20": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 97.62,
            "y": 58.49,
            "z": 2.79
        },
        "F20": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 97.62,
            "y": 53.99,
            "z": 2.79
        },
        "G20": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 97.62,
            "y": 49.49,
            "z": 2.79
        },
        "H20": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 97.62,
            "y": 44.99,
            "z": 2.79
        },
        "I20": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 97.62,
            "y": 40.49,
            "z": 2.79
        },
        "J20": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 97.62,
            "y": 35.99,
            "z": 2.79
        },
        "K20": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 97.62,
            "y": 31.49,
            "z": 2.79
        },
        "L20": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 97.62,
            "y": 26.99,
            "z": 2.79
        },
        "M20": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 97.62,
            "y": 22.49,
            "z": 2.79
        },
        "N20": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 97.62,
            "y": 17.99,
            "z": 2.79
        },
        "O20": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 97.62,
            "y": 13.49,
            "z": 2.79
        },
        "P20": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 97.62,
            "y": 8.99,
            "z": 2.79
        },
        "A21": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 102.12,
            "y": 76.49,
            "z": 2.79
        },
        "B21": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 102.12,
            "y": 71.99,
            "z": 2.79
        },
        "C21": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 102.12,
            "y": 67.49,
            "z": 2.79
        },
        "D21": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 102.12,
            "y": 62.99,
            "z": 2.79
        },
        "E21": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 102.12,
            "y": 58.49,
            "z": 2.79
        },
        "F21": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 102.12,
            "y": 53.99,
            "z": 2.79
        },
        "G21": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 102.12,
            "y": 49.49,
            "z": 2.79
        },
        "H21": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 102.12,
            "y": 44.99,
            "z": 2.79
        },
        "I21": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 102.12,
            "y": 40.49,
            "z": 2.79
        },
        "J21": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 102.12,
            "y": 35.99,
            "z": 2.79
        },
        "K21": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 102.12,
            "y": 31.49,
            "z": 2.79
        },
        "L21": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 102.12,
            "y": 26.99,
            "z": 2.79
        },
        "M21": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 102.12,
            "y": 22.49,
            "z": 2.79
        },
        "N21": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 102.12,
            "y": 17.99,
            "z": 2.79
        },
        "O21": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 102.12,
            "y": 13.49,
            "z": 2.79
        },
        "P21": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 102.12,
            "y": 8.99,
            "z": 2.79
        },
        "A22": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 106.62,
            "y": 76.49,
            "z": 2.79
        },
        "B22": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 106.62,
            "y": 71.99,
            "z": 2.79
        },
        "C22": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 106.62,
            "y": 67.49,
            "z": 2.79
        },
        "D22": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 106.62,
            "y": 62.99,
            "z": 2.79
        },
        "E22": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 106.62,
            "y": 58.49,
            "z": 2.79
        },
        "F22": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 106.62,
            "y": 53.99,
            "z": 2.79
        },
        "G22": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 106.62,
            "y": 49.49,
            "z": 2.79
        },
        "H22": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 106.62,
            "y": 44.99,
            "z": 2.79
        },
        "I22": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 106.62,
            "y": 40.49,
            "z": 2.79
        },
        "J22": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 106.62,
            "y": 35.99,
            "z": 2.79
        },
        "K22": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 106.62,
            "y": 31.49,
            "z": 2.79
        },
        "L22": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 106.62,
            "y": 26.99,
            "z": 2.79
        },
        "M22": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 106.62,
            "y": 22.49,
            "z": 2.79
        },
        "N22": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 106.62,
            "y": 17.99,
            "z": 2.79
        },
        "O22": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 106.62,
            "y": 13.49,
            "z": 2.79
        },
        "P22": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 106.62,
            "y": 8.99,
            "z": 2.79
        },
        "A23": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 111.12,
            "y": 76.49,
            "z": 2.79
        },
        "B23": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 111.12,
            "y": 71.99,
            "z": 2.79
        },
        "C23": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 111.12,
            "y": 67.49,
            "z": 2.79
        },
        "D23": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 111.12,
            "y": 62.99,
            "z": 2.79
        },
        "E23": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 111.12,
            "y": 58.49,
            "z": 2.79
        },
        "F23": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 111.12,
            "y": 53.99,
            "z": 2.79
        },
        "G23": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 111.12,
            "y": 49.49,
            "z": 2.79
        },
        "H23": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 111.12,
            "y": 44.99,
            "z": 2.79
        },
        "I23": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 111.12,
            "y": 40.49,
            "z": 2.79
        },
        "J23": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 111.12,
            "y": 35.99,
            "z": 2.79
        },
        "K23": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 111.12,
            "y": 31.49,
            "z": 2.79
        },
        "L23": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 111.12,
            "y": 26.99,
            "z": 2.79
        },
        "M23": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 111.12,
            "y": 22.49,
            "z": 2.79
        },
        "N23": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 111.12,
            "y": 17.99,
            "z": 2.79
        },
        "O23": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 111.12,
            "y": 13.49,
            "z": 2.79
        },
        "P23": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 111.12,
            "y": 8.99,
            "z": 2.79
        },
        "A24": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 115.62,
            "y": 76.49,
            "z": 2.79
        },
        "B24": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 115.62,
            "y": 71.99,
            "z": 2.79
        },
        "C24": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 115.62,
            "y": 67.49,
            "z": 2.79
        },
        "D24": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 115.62,
            "y": 62.99,
            "z": 2.79
        },
        "E24": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 115.62,
            "y": 58.49,
            "z": 2.79
        },
        "F24": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 115.62,
            "y": 53.99,
            "z": 2.79
        },
        "G24": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 115.62,
            "y": 49.49,
            "z": 2.79
        },
        "H24": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 115.62,
            "y": 44.99,
            "z": 2.79
        },
        "I24": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 115.62,
            "y": 40.49,
            "z": 2.79
        },
        "J24": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 115.62,
            "y": 35.99,
            "z": 2.79
        },
        "K24": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 115.62,
            "y": 31.49,
            "z": 2.79
        },
        "L24": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 115.62,
            "y": 26.99,
            "z": 2.79
        },
        "M24": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 115.62,
            "y": 22.49,
            "z": 2.79
        },
        "N24": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 115.62,
            "y": 17.99,
            "z": 2.79
        },
        "O24": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 115.62,
            "y": 13.49,
            "z": 2.79
        },
        "P24": {
            "depth": 11.43,
            "totalLiquidVolume": 112,
            "shape": "rectangular",
            "xDimension": 3.63,
            "yDimension": 3.63,
            "x": 115.62,
            "y": 8.99,
            "z": 2.79
        }
    },
    "groups": [
        {
            "metadata": {
                "wellBottomShape": "flat"
            },
            "wells": [
                "A1",
                "B1",
                "C1",
                "D1",
                "E1",
                "F1",
                "G1",
                "H1",
                "I1",
                "J1",
                "K1",
                "L1",
                "M1",
                "N1",
                "O1",
                "P1",
                "A2",
                "B2",
                "C2",
                "D2",
                "E2",
                "F2",
                "G2",
                "H2",
                "I2",
                "J2",
                "K2",
                "L2",
                "M2",
                "N2",
                "O2",
                "P2",
                "A3",
                "B3",
                "C3",
                "D3",
                "E3",
                "F3",
                "G3",
                "H3",
                "I3",
                "J3",
                "K3",
                "L3",
                "M3",
                "N3",
                "O3",
                "P3",
                "A4",
                "B4",
                "C4",
                "D4",
                "E4",
                "F4",
                "G4",
                "H4",
                "I4",
                "J4",
                "K4",
                "L4",
                "M4",
                "N4",
                "O4",
                "P4",
                "A5",
                "B5",
                "C5",
                "D5",
                "E5",
                "F5",
                "G5",
                "H5",
                "I5",
                "J5",
                "K5",
                "L5",
                "M5",
                "N5",
                "O5",
                "P5",
                "A6",
                "B6",
                "C6",
                "D6",
                "E6",
                "F6",
                "G6",
                "H6",
                "I6",
                "J6",
                "K6",
                "L6",
                "M6",
                "N6",
                "O6",
                "P6",
                "A7",
                "B7",
                "C7",
                "D7",
                "E7",
                "F7",
                "G7",
                "H7",
                "I7",
                "J7",
                "K7",
                "L7",
                "M7",
                "N7",
                "O7",
                "P7",
                "A8",
                "B8",
                "C8",
                "D8",
                "E8",
                "F8",
                "G8",
                "H8",
                "I8",
                "J8",
                "K8",
                "L8",
                "M8",
                "N8",
                "O8",
                "P8",
                "A9",
                "B9",
                "C9",
                "D9",
                "E9",
                "F9",
                "G9",
                "H9",
                "I9",
                "J9",
                "K9",
                "L9",
                "M9",
                "N9",
                "O9",
                "P9",
                "A10",
                "B10",
                "C10",
                "D10",
                "E10",
                "F10",
                "G10",
                "H10",
                "I10",
                "J10",
                "K10",
                "L10",
                "M10",
                "N10",
                "O10",
                "P10",
                "A11",
                "B11",
                "C11",
                "D11",
                "E11",
                "F11",
                "G11",
                "H11",
                "I11",
                "J11",
                "K11",
                "L11",
                "M11",
                "N11",
                "O11",
                "P11",
                "A12",
                "B12",
                "C12",
                "D12",
                "E12",
                "F12",
                "G12",
                "H12",
                "I12",
                "J12",
                "K12",
                "L12",
                "M12",
                "N12",
                "O12",
                "P12",
                "A13",
                "B13",
                "C13",
                "D13",
                "E13",
                "F13",
                "G13",
                "H13",
                "I13",
                "J13",
                "K13",
                "L13",
                "M13",
                "N13",
                "O13",
                "P13",
                "A14",
                "B14",
                "C14",
                "D14",
                "E14",
                "F14",
                "G14",
                "H14",
                "I14",
                "J14",
                "K14",
                "L14",
                "M14",
                "N14",
                "O14",
                "P14",
                "A15",
                "B15",
                "C15",
                "D15",
                "E15",
                "F15",
                "G15",
                "H15",
                "I15",
                "J15",
                "K15",
                "L15",
                "M15",
                "N15",
                "O15",
                "P15",
                "A16",
                "B16",
                "C16",
                "D16",
                "E16",
                "F16",
                "G16",
                "H16",
                "I16",
                "J16",
                "K16",
                "L16",
                "M16",
                "N16",
                "O16",
                "P16",
                "A17",
                "B17",
                "C17",
                "D17",
                "E17",
                "F17",
                "G17",
                "H17",
                "I17",
                "J17",
                "K17",
                "L17",
                "M17",
                "N17",
                "O17",
                "P17",
                "A18",
                "B18",
                "C18",
                "D18",
                "E18",
                "F18",
                "G18",
                "H18",
                "I18",
                "J18",
                "K18",
                "L18",
                "M18",
                "N18",
                "O18",
                "P18",
                "A19",
                "B19",
                "C19",
                "D19",
                "E19",
                "F19",
                "G19",
                "H19",
                "I19",
                "J19",
                "K19",
                "L19",
                "M19",
                "N19",
                "O19",
                "P19",
                "A20",
                "B20",
                "C20",
                "D20",
                "E20",
                "F20",
                "G20",
                "H20",
                "I20",
                "J20",
                "K20",
                "L20",
                "M20",
                "N20",
                "O20",
                "P20",
                "A21",
                "B21",
                "C21",
                "D21",
                "E21",
                "F21",
                "G21",
                "H21",
                "I21",
                "J21",
                "K21",
                "L21",
                "M21",
                "N21",
                "O21",
                "P21",
                "A22",
                "B22",
                "C22",
                "D22",
                "E22",
                "F22",
                "G22",
                "H22",
                "I22",
                "J22",
                "K22",
                "L22",
                "M22",
                "N22",
                "O22",
                "P22",
                "A23",
                "B23",
                "C23",
                "D23",
                "E23",
                "F23",
                "G23",
                "H23",
                "I23",
                "J23",
                "K23",
                "L23",
                "M23",
                "N23",
                "O23",
                "P23",
                "A24",
                "B24",
                "C24",
                "D24",
                "E24",
                "F24",
                "G24",
                "H24",
                "I24",
                "J24",
                "K24",
                "L24",
                "M24",
                "N24",
                "O24",
                "P24"
            ]
        }
    ],
    "parameters": {
        "format": "irregular",
        "quirks": [],
        "isTiprack": false,
        "isMagneticModuleCompatible": false,
        "loadName": "testinglc_384_wellplate_112ul"
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
LABWARE_DEF = json.loads(LABWARE_DEF_JSON)
LABWARE_LABEL = LABWARE_DEF.get('metadata', {}).get(
    'displayName', 'test labware')
LABWARE_DIMENSIONS = LABWARE_DEF.get('wells', {}).get('A1', {}).get('yDimension')

metadata = {'apiLevel': '2.0'}


def run(protocol: protocol_api.ProtocolContext):
    tiprack = protocol.load_labware(TIPRACK_LOADNAME, TIPRACK_SLOT)
    pipette = protocol.load_instrument(
        PIPETTE_NAME, PIPETTE_MOUNT, tip_racks=[tiprack])

    test_labware = protocol.load_labware_from_definition(
        LABWARE_DEF,
        TEST_LABWARE_SLOT,
        LABWARE_LABEL,
    )

    num_cols = len(LABWARE_DEF.get('ordering', [[]]))
    num_rows = len(LABWARE_DEF.get('ordering', [[]])[0])
    total = num_cols * num_rows
    pipette.pick_up_tip()

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

    pipette.home()

#    protocol.pause(f"Place your labware in Slot {TEST_LABWARE_SLOT}")
    if(PIPETTE_NAME == 'p20_single_gen2' or PIPETTE_NAME == 'p300_single_gen2' or PIPETTE_NAME == 'p1000_single_gen2' or PIPETTE_NAME == 'p50_single' or PIPETTE_NAME == 'p10_single' or PIPETTE_NAME == 'p300_single' or PIPETTE_NAME == 'p1000_single'):
        if(total > 1):
            #testing with single channel
            well = test_labware.well('A1')
            all_4_edges = [
                [well._from_center_cartesian(x=-1, y=0, z=1), 'left'],
                [well._from_center_cartesian(x=1, y=0, z=1), 'right'],
                [well._from_center_cartesian(x=0, y=-1, z=1), 'front'],
                [well._from_center_cartesian(x=0, y=1, z=1), 'back']
            ]

            set_speeds(RATE)
            pipette.move_to(well.top())
            protocol.pause("Moved to the top of the well")

            for edge_pos, edge_name in all_4_edges:
                set_speeds(RATE)
                edge_location = types.Location(point=edge_pos, labware=None)
                pipette.move_to(edge_location)
                protocol.pause(f'Moved to {edge_name} edge')
            
            #test bottom of first well
            well = test_labware.well('A1')
            pipette.move_to(well.bottom())
            protocol.pause("Moved to the bottom of the well")
            pipette.blow_out(well)
            #last well testing
            last_well = (num_cols) * (num_rows)
            well = test_labware.well(last_well-1)
            pipette.move_to(well.top())
            protocol.pause("Moved to the top of the well")
            all_4_edges = [
                [well._from_center_cartesian(x=-1, y=0, z=1), 'left'],
                [well._from_center_cartesian(x=1, y=0, z=1), 'right'],
                [well._from_center_cartesian(x=0, y=-1, z=1), 'front'],
                [well._from_center_cartesian(x=0, y=1, z=1), 'back']
            ]
            for edge_pos, edge_name in all_4_edges:
                set_speeds(RATE)
                edge_location = types.Location(point=edge_pos, labware=None)
                pipette.move_to(edge_location)
                protocol.pause(f'Moved to {edge_name} edge')
            set_speeds(RATE)
            #test bottom of last well
            pipette.move_to(well.bottom())
            protocol.pause("Moved to the bottom of the well")
            pipette.blow_out(well)
        else:
            #testing with single channel + 1 well labware
            well = test_labware.well('A1')
            all_4_edges = [
                [well._from_center_cartesian(x=-1, y=0, z=1), 'left'],
                [well._from_center_cartesian(x=1, y=0, z=1), 'right'],
                [well._from_center_cartesian(x=0, y=-1, z=1), 'front'],
                [well._from_center_cartesian(x=0, y=1, z=1), 'back']
            ]

            set_speeds(RATE)
            pipette.move_to(well.top())
            protocol.pause("Moved to the top of the well")

            for edge_pos, edge_name in all_4_edges:
                set_speeds(RATE)
                edge_location = types.Location(point=edge_pos, labware=None)
                pipette.move_to(edge_location)
                protocol.pause(f'Moved to {edge_name} edge')
            
            #test bottom of first well
            well = test_labware.well('A1')
            pipette.move_to(well.bottom())
            protocol.pause("Moved to the bottom of the well")
            pipette.blow_out(well)
    else:
        #testing for multichannel
        if(total == 96 or total == 384): #testing for 96 well plates and 384 first column
            #test first column
            well = test_labware.well('A1')
            all_4_edges = [
                [well._from_center_cartesian(x=-1, y=0, z=1), 'left'],
                [well._from_center_cartesian(x=1, y=0, z=1), 'right'],
                [well._from_center_cartesian(x=0, y=-1, z=1), 'front'],
                [well._from_center_cartesian(x=0, y=1, z=1), 'back']
            ]
            set_speeds(RATE)
            pipette.move_to(well.top())
            protocol.pause("Moved to the top of the well")

            for edge_pos, edge_name in all_4_edges:
                set_speeds(RATE)
                edge_location = types.Location(point=edge_pos, labware=None)
                pipette.move_to(edge_location)
                protocol.pause(f'Moved to {edge_name} edge')
            
            #test bottom of first column
            well = test_labware.well('A1')
            pipette.move_to(well.bottom())
            protocol.pause("Moved to the bottom of the well")
            pipette.blow_out(well)
            #test last column
            if(total == 96):
                last_col = (num_cols * num_rows) - num_rows
                well = test_labware.well(last_col)
                pipette.move_to(well.top())
                protocol.pause("Moved to the top of the well")
                all_4_edges = [
                    [well._from_center_cartesian(x=-1, y=0, z=1), 'left'],
                    [well._from_center_cartesian(x=1, y=0, z=1), 'right'],
                    [well._from_center_cartesian(x=0, y=-1, z=1), 'front'],
                    [well._from_center_cartesian(x=0, y=1, z=1), 'back']
                ]
                for edge_pos, edge_name in all_4_edges:
                    set_speeds(RATE)
                    edge_location = types.Location(point=edge_pos, labware=None)
                    pipette.move_to(edge_location)
                    protocol.pause(f'Moved to {edge_name} edge')
                set_speeds(RATE)
                #test bottom of last column
                pipette.move_to(well.bottom())
                protocol.pause("Moved to the bottom of the well")
                pipette.blow_out(well)
            elif(total == 384):
                #testing for 384 well plates - need to hit well 369, last column
                well369 = (total) - (num_rows) + 1
                well = test_labware.well(well369)
                pipette.move_to(well.top())
                protocol.pause("Moved to the top of the well")
                all_4_edges = [
                    [well._from_center_cartesian(x=-1, y=0, z=1), 'left'],
                    [well._from_center_cartesian(x=1, y=0, z=1), 'right'],
                    [well._from_center_cartesian(x=0, y=-1, z=1), 'front'],
                    [well._from_center_cartesian(x=0, y=1, z=1), 'back']
                ]
                for edge_pos, edge_name in all_4_edges:
                    set_speeds(RATE)
                    edge_location = types.Location(point=edge_pos, labware=None)
                    pipette.move_to(edge_location)
                    protocol.pause(f'Moved to {edge_name} edge')
                set_speeds(RATE)
                #test bottom of last column
                pipette.move_to(well.bottom())
                protocol.pause("Moved to the bottom of the well")
                pipette.blow_out(well)
        elif(num_rows == 1 and total > 1 and LABWARE_DIMENSIONS >= 71.2):
            #for 1 row reservoirs - ex: 12 well reservoirs
            well = test_labware.well('A1')
            all_4_edges = [
                [well._from_center_cartesian(x=-1, y=1, z=1), 'left'],
                [well._from_center_cartesian(x=1, y=1, z=1), 'right'],
                [well._from_center_cartesian(x=0, y=0.75, z=1), 'front'],
                [well._from_center_cartesian(x=0, y=1, z=1), 'back']
            ]
            set_speeds(RATE)
            pipette.move_to(well.top())
            protocol.pause("Moved to the top of the well")

            for edge_pos, edge_name in all_4_edges:
                set_speeds(RATE)
                edge_location = types.Location(point=edge_pos, labware=None)
                pipette.move_to(edge_location)
                protocol.pause(f'Moved to {edge_name} edge')
                #test bottom of first well
            pipette.move_to(well.bottom())
            protocol.pause("Moved to the bottom of the well")
            pipette.blow_out(well)
            #test last well
            well = test_labware.well(-1)
            all_4_edges = [
                [well._from_center_cartesian(x=-1, y=1, z=1), 'left'],
                [well._from_center_cartesian(x=1, y=1, z=1), 'right'],
                [well._from_center_cartesian(x=0, y=0.75, z=1), 'front'],
                [well._from_center_cartesian(x=0, y=1, z=1), 'back']
            ]
            set_speeds(RATE)
            pipette.move_to(well.top())
            protocol.pause("Moved to the top of the well")

            for edge_pos, edge_name in all_4_edges:
                set_speeds(RATE)
                edge_location = types.Location(point=edge_pos, labware=None)
                pipette.move_to(edge_location)
                protocol.pause(f'Moved to {edge_name} edge')
                #test bottom of first well
            pipette.move_to(well.bottom())
            protocol.pause("Moved to the bottom of the well")
            pipette.blow_out(well)

        
        elif(total == 1 and LABWARE_DIMENSIONS >= 71.2 ):
            #for 1 well reservoirs
            well = test_labware.well('A1')
            all_4_edges = [
                [well._from_center_cartesian(x=-1, y=1, z=1), 'left'],
                [well._from_center_cartesian(x=1, y=1, z=1), 'right'],
                [well._from_center_cartesian(x=0, y=0.75, z=1), 'front'],
                [well._from_center_cartesian(x=0, y=1, z=1), 'back']
            ]
            set_speeds(RATE)
            pipette.move_to(well.top())
            protocol.pause("Moved to the top of the well")

            for edge_pos, edge_name in all_4_edges:
                set_speeds(RATE)
                edge_location = types.Location(point=edge_pos, labware=None)
                pipette.move_to(edge_location)
                protocol.pause(f'Moved to {edge_name} edge')
                #test bottom of first well
            pipette.move_to(well.bottom())
            protocol.pause("Moved to the bottom of the well")
            pipette.blow_out(well)
        
        else:
            #for incompatible labwares
            protocol.pause("labware is incompatible to calibrate with a multichannel pipette")




    set_speeds(1.0)
    pipette.return_tip()
