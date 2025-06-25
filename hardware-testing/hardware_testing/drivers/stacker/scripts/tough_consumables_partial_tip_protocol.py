from opentrons.protocol_api import (
    ProtocolContext, 
    ParameterContext
)

from opentrons.protocol_api import COLUMN, ALL, PARTIAL_COLUMN
from opentrons import types

# Metadata
metadata = {
    'protocolName': 'Partial Tough Consumables Protocol 96 Channel Pipette',
    'author': 'Anurag Kanase',
    'description': 'Partial Tough Consumables Protocol for 96-channel Pipette.'
}
requirements = {"robotType": "Flex", "apiLevel": "2.20"}

def add_parameters(parameters: ParameterContext) -> None:
    """Runtime parameters."""
    parameters.add_str(
        display_name="Target Labware",
        variable_name="labware_name",
        description="The labware that needs to be tested.",
        default="opentrons_tough_12_reservoir_22ml",
        choices=[
            {
                "display_name": "OT 1 Well  Reservoir 300ml",
                "value": "opentrons_tough_1_reservoir_300ml",
            },
            {
                "display_name": "OT 4 reservoir 72ml",
                "value": "opentrons_tough_4_reservoir_72ml",
            },
            {
                "display_name": "OT 12 Reservoir 22ml",
                "value": "opentrons_tough_12_reservoir_22ml",
            },
            {
                "display_name": "OT Universal Lid",
                "value": "opentrons_tough_universal_lid",
            },
        ],
    )
    parameters.add_str(
        display_name="Tiprack Type",
        variable_name="tiprack_name",
        description="The labware that needs to be tested.",
        default="opentrons_flex_96_tiprack_1000ul",
        choices=[
            {
                "display_name": "1000uL_Tiprack",
                "value": "opentrons_flex_96_tiprack_1000ul",
            },
            {
                "display_name": "20uL_Tiprack",
                "value": "opentrons_flex_96_tiprack_20ul",
            },
        ],
    )
    parameters.add_str(
        display_name="Pipette Type",
        variable_name="pipette_name",
        description="The labware that needs to be tested.",
        default="flex_96channel_1000",
        choices=[
            {
                "display_name": "flex_96channel_1000",
                "value": "flex_96channel_1000",
            },
            {
                "display_name": "flex_96channel_200",
                "value": "flex_96channel_200",
            },
        ],
    )
    parameters.add_int(
        display_name="Cycles",
        variable_name="test_cycles",
        description="The number of cycles of dispensing/storing to perform.",
        default=1,
        minimum=1,
        maximum=10,
    )
    parameters.add_int(
    display_name="How many columns?",
    variable_name="columns",
    default=2,minimum=1,maximum=6,
    description="Select total columns to pickup from tiprack. \nNote: columns x 16 tips will be trashed")



def run(protocol: ProtocolContext):
    labware_name = protocol.params.labware_name
    tiprack_name = protocol.params.tiprack_name
    pipette_name = protocol.params.pipette_name

    tips = protocol.load_labware(tiprack_name, "B2")
    p96 = protocol.load_instrument(pipette_name, 'left')
    trash = protocol.load_trash_bin("A3")
    # Load the labware
    reservoir = protocol.load_labware(
        load_name=labware_name,  # or your custom labware name
        location='D2'
    )
    pickup_cols = ["H1"]
    protocol.comment("----> Picking up tips from Column 12 to left")
    for start_loc in pickup_cols:
        
        p96.configure_nozzle_layout(
            style=COLUMN,
            start=start_loc,
            tip_racks=[tips]) 
        
        for i in range(protocol.params.columns):
            p96.pick_up_tip()
            p96.move_to(reservoir.wells()[0].top())
            protocol.pause("Please check the tip position before continuing.")
            p96.move_to(reservoir.wells()[0].bottom(5))
            protocol.pause("Please check the clearance before continuing.")
            protocol.delay(5)
            p96.drop_tip()

        protocol.comment("---- > Picking up tips from Column 1 to right")