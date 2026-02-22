"""Simple Flex protocol that uses a custom labware definition.

Requires the custom labware file:
  analyses-snapshot-testing/files/labware/cpx_4_tuberack_100ul.json
  (loadName: cpx_4_tuberack_100ul, namespace: custom_beta, version: 1)

The protocol loads the custom tube rack as the destination and transfers
a small volume from a standard reservoir into each of the 4 custom wells.
"""

metadata = {
    "protocolName": "Flex Custom Labware Simple",
    "description": "Transfer to a custom 4-well tube rack (cpx_4_tuberack_100ul).",
    "author": "Opentrons QA",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.20",
}

CUSTOM_LABWARE_LOAD_NAME = "cpx_4_tuberack_100ul"
CUSTOM_LABWARE_NAMESPACE = "custom_beta"
CUSTOM_LABWARE_VERSION = 1

TRANSFER_VOLUME = 50  # µL


def run(protocol):
    trash = protocol.load_trash_bin("A3")

    tiprack = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "A1")
    source = protocol.load_labware("nest_1_reservoir_290ml", "C1")
    dest = protocol.load_labware(
        CUSTOM_LABWARE_LOAD_NAME,
        "D1",
        namespace=CUSTOM_LABWARE_NAMESPACE,
        version=CUSTOM_LABWARE_VERSION,
    )

    pipette = protocol.load_instrument("flex_1channel_1000", "left", tip_racks=[tiprack])

    dest_wells = list(dest.wells())
    for well in dest_wells:
        protocol.comment(f"Transferring {TRANSFER_VOLUME} uL to {well.well_name}")
        pipette.pick_up_tip()
        pipette.aspirate(TRANSFER_VOLUME, source["A1"])
        pipette.dispense(TRANSFER_VOLUME, well)
        pipette.drop_tip()
