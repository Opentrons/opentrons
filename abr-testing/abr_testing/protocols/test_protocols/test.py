"""Test error messages for waste chute interaction."""
from opentrons import protocol_api

requirements = {"robotType": "Flex", "apiLevel": "2.25"}
# set true to test labware waste chute error handling, set false to test pipetting
test_labware = True


def run(protocol: protocol_api.ProtocolContext) -> None:
    """Test error messages for labware going into waste chute."""
    tiprack1 = protocol.load_labware(
        load_name="opentrons_flex_96_tiprack_1000ul", location="A3"
    )
    tiprack2 = protocol.load_labware(
        load_name="opentrons_flex_96_tiprack_1000ul", location="A2"
    )
    # attach pipette to left mount
    pipette = protocol.load_instrument(
        instrument_name="flex_1channel_1000",
        mount="left",
        tip_racks=[tiprack1, tiprack2],
    )

    chute = protocol.load_waste_chute()
    # Test labware movement error catching
    if test_labware:
        """This will print out "Cannot move opentrons_96_wellplate_200ul_pcr_full_skirt
        from the waste chute using the gripper"
        """
        plate = protocol.load_labware(
            load_name="opentrons_96_wellplate_200ul_pcr_full_skirt", location="D1"
        )
        protocol.move_labware(plate, chute, use_gripper=True)
        protocol.move_labware(tiprack2, chute, use_gripper=True)
        protocol.move_labware(plate, "D2", use_gripper=True)


    # Test pipette movement error catching

    """This will print out 'LocationNotAccessibleByPipetteError:
    Cannot move pipette to opentrons_flex_96_tiprack_1000ul because it is in the waste chute'
    """
   
    pipette.pick_up_tip()
    pipette.drop_tip()
    protocol.move_labware(tiprack1, chute, use_gripper=False)
    pipette.pick_up_tip()