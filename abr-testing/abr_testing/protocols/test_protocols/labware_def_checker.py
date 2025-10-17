"""Test labware definition ."""
from opentrons.protocol_api import ProtocolContext, ParameterContext
from opentrons.protocol_api.module_contexts import HeaterShakerContext


metadata = {
    "protocolName": "labware definition checker ",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
}

requirements = {"robotType": "Flex", "apiLevel": "2.23"}

LABWARE = "greiner_384_wellplate_240ul"

def add_parameters(parameters: ParameterContext) -> None:
    """Parameters."""
    parameters.add_bool(
        variable_name="heater_shaker",
        display_name="Heater Shaker Use",
        description="If true, heater shaker is used.",
        default=False,
    )


def run(protocol: ProtocolContext) -> None:
    """Protocol."""
    heater_shaker_enabled = protocol.params.heater_shaker  # type: ignore[attr-defined]

    tip_rack = protocol.load_labware("opentrons_flex_96_tiprack_50ul", "D2")
    pipette = protocol.load_instrument("flex_1channel_50", "left", tip_racks=[tip_rack])
    deck_riser = protocol.load_adapter("opentrons_flex_deck_riser", "B3")

    labware = protocol.load_labware(LABWARE, "D3")
    labware_lid = protocol.load_lid_stack("opentrons_tough_universal_lid", "C3", 2)

    # Lid loading
    if labware_lid:
        for _ in range(2):
            protocol.move_lid("C3", labware, use_gripper=True)
            protocol.move_lid(labware, deck_riser, use_gripper=True)
            protocol.move_lid(deck_riser, "C3", use_gripper=True)

    # pick up tip
    pipette.pick_up_tip()

    # move tip to positions
    pipette.move_to(labware["A6"].top(z=1))
    protocol.pause("Check top height with shim")
    pipette.move_to(labware["A6"].bottom(z=1))
    protocol.pause("Check bottom height with shim")

    # Optional heater shaker use

    if heater_shaker_enabled:
        hsh: HeaterShakerContext = protocol.load_module(
            "heaterShakerModuleV1", "D1"
        )  # type: ignore[assignment]
        hsh.close_labware_latch()
        adapter = hsh.load_adapter("opentrons_universal_flat_adapter")
        hsh.open_labware_latch()
        protocol.move_labware(labware, adapter, use_gripper=True)
        hsh.close_labware_latch()
        pipette.move_to(labware["A1"].top(z=1))
        protocol.pause("Check top height with shim on heater shaker")
        protocol.move_lid("C3", labware, use_gripper=True)
        protocol.move_lid(labware, deck_riser, use_gripper=True)
        protocol.move_lid(deck_riser, labware, use_gripper=True)
        pipette.return_tip()
        hsh.close_labware_latch()
