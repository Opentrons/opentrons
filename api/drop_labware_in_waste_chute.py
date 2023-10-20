from opentrons import protocol_api


requirements = {
    "apiLevel": "2.16",
    "robotType": "Flex",
}


def run(protocol: protocol_api.ProtocolContext) -> None:
    waste_chute = protocol.load_waste_chute(orifice="wide_open")

    labware = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "C2")
    protocol.move_labware(labware, waste_chute, use_gripper=True)
