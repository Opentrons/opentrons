"""Flex protocol that uses pandas to build and filter a transfer table.

Demonstrates that pandas (Pyodide built-in) is available and functional
inside Opentrons protocol analysis.

The protocol embeds a transfer table as a list of dicts, loads it into a
pandas DataFrame, filters out rows where volume is not positive, and runs
a pick-up/aspirate/dispense/drop-tip cycle for each qualifying row.

Expected transfers after filtering (volume > 0):
  A1  50 uL
  C1  75 uL
  D1 100 uL
  F1  25 uL
  -> 4 wells -> 4 aspirate + 4 dispense commands
"""

import pandas as pd

metadata = {
    "protocolName": "Flex Pandas Simple",
    "description": "Use pandas to build and filter a transfer table in-protocol.",
    "author": "Opentrons QA",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.27",
}

# Embedded transfer table; rows with volume <= 0 are excluded by pandas filter.
_TRANSFER_DATA = [
    {"well": "A1", "volume": 50},
    {"well": "B1", "volume": 0},   # excluded: volume not > 0
    {"well": "C1", "volume": 75},
    {"well": "D1", "volume": 100},
    {"well": "E1", "volume": -5},  # excluded: volume not > 0
    {"well": "F1", "volume": 25},
]


def run(protocol):
    protocol.load_trash_bin("A3")

    tiprack = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "A1")
    source = protocol.load_labware("nest_1_reservoir_290ml", "C1")
    plate = protocol.load_labware("nest_96_wellplate_100ul_pcr_full_skirt", "D1")

    pipette = protocol.load_instrument("flex_1channel_1000", "left", tip_racks=[tiprack])

    df = pd.DataFrame(_TRANSFER_DATA)
    transfers = df[df["volume"] > 0].reset_index(drop=True)

    protocol.comment(f"pandas {pd.__version__}: {len(transfers)} transfers after filtering")

    for _, row in transfers.iterrows():
        well = str(row["well"])
        vol = float(row["volume"])
        pipette.pick_up_tip()
        pipette.aspirate(vol, source["A1"])
        pipette.dispense(vol, plate[well])
        pipette.drop_tip()
