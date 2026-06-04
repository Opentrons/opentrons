"""Quick smoke test for Flex QA3PVT: 1ch 1000 µL, gripper, thermocycler."""
from opentrons import protocol_api

metadata = {
    "protocolName": "QA3PVT Quick TestERRRRRR",
    "author": "Opentrons",
    "description": (
        "Pick up 1000 µL tips from D1, transfer on C1, exercise thermocycler lid/temp."
    ),
}

requirements = {"robotType": "Flex", "apiLevel": "2.24"}


def run(protocol: protocol_api.ProtocolContext) -> None:
    trash = protocol.load_trash_bin("A3")
    tips = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "D1")
    plate = protocol.load_labware("nest_96_wellplate_2ml_deep", "C1")
    tc = protocol.load_module("thermocyclerModuleV2", "B1")

    pipette = protocol.load_instrument(
        "flex_1channel_1000", mount="left", tip_racks=[tips]
    )

    sample = protocol.define_liquid(
        name="Sample", description="Test aqueous sample", display_color="#0088FF"
    )
    plate["A1"].load_liquid(liquid=sample, volume=500)

    # Thermocycler check (lid is often open on idle robots)
    tc.open_lid()
    tc.close_lid()
    tc.set_lid_temperature(37)
    tc.set_block_temperature(37)
    protocol.delay(seconds=15)
    tc.open_lid()
    tc.deactivate_lid()
    tc.deactivate_block()

    water = protocol.get_liquid_class(name="water")
    pipette.transfer_with_liquid_class(
        liquid_class=water,
        volume=100,
        source=plate["A1"],
        dest=plate["A2"],
        new_tip="once",
        return_tip=True,
    )
