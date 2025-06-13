"""dispense ethanol protocol"""
from opentrons.protocol_api import ProtocolContext, ParameterContext, Well, SINGLE

metadata = {
    "protocolName": "dispense ethanol for meniscus test",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
}

requirements = {"robotType": "Flex", "apiLevel": "2.23"}

def add_parameters(parameters: ParameterContext) -> None:
    """Parameters."""
    parameters.add_str(
        variable_name="labware_type",
        display_name="Labware Type",
        description="Type of Labware",
        choices=[
            {
                "display_name": "crng6_wellplate16.8",
                "value": "corning_6_wellplate_16.8ml_flat",
            },
            {
                "display_name": "crng12wellplate6.9ml flat",
                "value": "corning_12_wellplate_6.9ml_flat",
            },
            {
                "display_name": "crng24wellplate3.4mlflat", 
                "value": "corning_24_wellplate_3.4ml_flat",
            },
            {
                "display_name": "crng48wellplate1.6mlflat",
                "value": "corning_48_wellplate_1.6ml_flat",
            },
            {
                "display_name": "crng96wellplate360ul",
                "value": "corning_96_wellplate_360ul_flat",
            },
            {
                "display_name": "BioRad384WellPlate50",
                "value": "biorad_384_wellplate_50ul",
            },
        ],
        default="corning_6_wellplate_16.8ml_flat",
    )


def run(protocol: ProtocolContext) -> None:
    """Protocol."""
    labware_type = protocol.params.labware_type  # type: ignore[attr-defined]
    labware = protocol.load_labware(labware_type, "D2")

    tip_rack = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "C1")


    # Load reservoir with ethanol
    reservoir = protocol.load_labware("nest_1_reservoir_195ml", "C2")
    ethanol = protocol.define_liquid("Ethanol", "#FFFFC5")
    reservoir["A1"].load_liquid(ethanol, 180000)  # load approx. 180 mL into reservoir
    source_well: Well = reservoir["A1"]

    # Load tips
    pipette = protocol.load_instrument("flex_96channel_1000", "left", tip_racks=[tip_rack])
    pipette.configure_nozzle_layout(style = SINGLE, start = "A1",tip_racks=[tip_rack])
    trash = protocol.load_trash_bin("A3")


    # Dispense based on labware type
    dispense_map = {
        "corning_6_wellplate_16.8ml_flat": 2000,
        "corning_12_wellplate_6.9ml_flat": 1000,
        "corning_24_wellplate_3.4ml_flat": 1000,
        "corning_48_wellplate_1.6ml_flat": 600,
        "corning_96_wellplate_360ul_flat": 200,
        "biorad_384_wellplate_50ul": 40,
    }

    volume_to_dispense = dispense_map.get(labware_type)
    
    pipette.transfer(volume_to_dispense, source_well, labware["A1"], return_tips=False, blow_out=False) #last 2 params? 
