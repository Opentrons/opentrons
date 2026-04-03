import opentrons.protocol_api as protocol_api

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.28",
}

metadata = {
    "protocolName": "P50 8ch blowout positions sequence",
    "description": "Trash bin vs labware; trash/source/dest blowout.",
}

BLOWOUT_OPTIONS = {
    "trash": {"position_reference": "well-top", "offset": {"x": 1, "y": 2, "z": 3}},
    "source": {"position_reference": "well-center", "offset": {"x": 1, "y": 2, "z": 3}},
    "destination": {"position_reference": "well-bottom", "offset": {"x": 1, "y": 2, "z": 3}},
}


def run(protocol_context: protocol_api.ProtocolContext) -> None:
    tiprack = protocol_context.load_labware("opentrons_flex_96_tiprack_50ul", "B2")
    pipette_50 = protocol_context.load_instrument(
        "flex_8channel_50",
        mount="right",
        tip_racks=[tiprack],
    )

    trash_bin = protocol_context.load_trash_bin("A3")
    trash_labware = protocol_context.load_labware("nest_1_reservoir_290ml", "A2")

    nest_plate = protocol_context.load_labware("nest_96_wellplate_200ul_flat", "D2")
    arma_plate = protocol_context.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt", "C2")

    water = protocol_context.get_liquid_class("ethanol_80")

    col = 1
    for trash_loc, trash_label in (
        (trash_bin, "trash_bin"),
        (trash_labware, "trash_labware"),
    ):
        pipette_50.trash_container = trash_loc
        for blow_key in ("trash", "source", "destination"):
            protocol_context.comment(f"{trash_label}, blowout={blow_key}, column {col}")
            blow_props = water.get_for(pipette_50, tiprack).dispense.retract.blowout
            blow_props.enabled = True
            blow_props.location = blow_key
            blow_props.blowout_position = BLOWOUT_OPTIONS[blow_key]

            src = nest_plate[f"A{col}"]
            dst = arma_plate[f"A{col}"]
            pipette_50.transfer_with_liquid_class(
                liquid_class=water,
                volume=40,
                source=src,
                dest=dst,
                new_tip="always",
                trash_location=trash_loc,
                group_wells=False,
            )
            col += 1
