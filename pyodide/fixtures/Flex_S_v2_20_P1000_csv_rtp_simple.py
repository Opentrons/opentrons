"""Simple Flex protocol with a CSV runtime parameter.

The CSV must have a header row followed by rows of:
  well, volume
e.g.:
  well,volume
  A1,50
  B1,100
  C1,75

The protocol aspirates from a source reservoir and dispenses the specified
volume into each well listed in the CSV.
"""

metadata = {
    "protocolName": "Flex CSV RTP Simple",
    "description": "Aspirate/dispense volumes specified in a CSV runtime parameter.",
    "author": "Opentrons QA",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.20",
}


def add_parameters(parameters):
    parameters.add_csv_file(
        variable_name="transfers",
        display_name="Transfer Table",
        description="CSV with columns: well, volume",
    )


def run(protocol):
    trash = protocol.load_trash_bin("A3")

    tiprack = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "A1")
    source = protocol.load_labware("nest_1_reservoir_290ml", "C1")
    plate = protocol.load_labware("nest_96_wellplate_100ul_pcr_full_skirt", "D1")

    pipette = protocol.load_instrument("flex_1channel_1000", "left", tip_racks=[tiprack])

    rows = protocol.params.transfers.parse_as_csv()

    # Skip header row if present
    header = rows[0]
    data_rows = rows[1:] if header[0].strip().lower() == "well" else rows

    for row in data_rows:
        if len(row) < 2:
            continue
        well_name = row[0].strip()
        try:
            volume = float(row[1].strip())
        except ValueError:
            protocol.comment(f"Skipping invalid row: {row}")
            continue

        protocol.comment(f"Transferring {volume} uL to {well_name}")
        pipette.pick_up_tip()
        pipette.aspirate(volume, source["A1"])
        pipette.dispense(volume, plate[well_name])
        pipette.drop_tip()
