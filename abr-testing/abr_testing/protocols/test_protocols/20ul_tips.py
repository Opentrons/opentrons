"""20ul test."""

from opentrons.protocol_api import ProtocolContext, ParameterContext
from opentrons.protocol_api import ALL
from opentrons.protocol_api.module_contexts import FlexStackerContext

metadata = {
    "protocolName": "20ul tip test protocol",
    "author": "Muna Nwugo <muna.nwugo@opentrons.com>",
    "source": "  ",
}
requirements = {
    "robotType": "Flex",
    "apiLevel": "2.28",
}


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters."""
    parameters.add_bool(
        display_name="Drop Tip",
        variable_name="DROPTIP",
        default=True,
        description="Whether to test Drop Tip or not",
    )

    parameters.add_bool(
        display_name="Return Tip",
        variable_name="RETURNTIP",
        default=True,
        description="Whether to test Return Tip or not",
    )


def run(protocol: ProtocolContext) -> None:
    """Protocol."""
    DROPTIP = protocol.params.DROPTIP  # type: ignore[attr-defined]
    RETURNTIP = protocol.params.RETURNTIP  # type: ignore[attr-defined]

    # instruments and waste chute
    p200 = protocol.load_instrument("flex_96channel_200", "left")
    p200_flow_rate_aspirate_default = 20  # noqa: F841
    p200_flow_rate_dispense_default = 20  # noqa: F841
    p200_flow_rate_blow_out_default = 40  # noqa: F841
    p200.configure_nozzle_layout(style=ALL)

    trash = protocol.load_waste_chute()

    tiprack_adapter_1 = protocol.load_adapter("opentrons_flex_96_tiprack_adapter", "C3")

    tiprack_adapter_2 = protocol.load_adapter("opentrons_flex_96_tiprack_adapter", "C2")

    # load labware in stacher
    stacker: FlexStackerContext = protocol.load_module(
        "flexStackerModuleV1", "C4"
    )  # type: ignore[assignment]

    stacker.set_stored_labware(
        load_name="opentrons_flex_96_tiprack_20ul",
        # lid="opentrons_flex_tiprack_lid",
        count=2,
    )

    if RETURNTIP:
        tiprack_1 = stacker.retrieve()

        protocol.move_labware(
            labware=tiprack_1,
            new_location=tiprack_adapter_1,
            use_gripper=True,
            pick_up_offset={"x": 0, "y": 0, "z": 0},
            drop_offset={"x": 0, "y": 0, "z": 0},
        )

        tiprack_2 = stacker.retrieve()

        protocol.move_labware(
            labware=tiprack_2,
            new_location=tiprack_adapter_2,
            use_gripper=True,
            pick_up_offset={"x": 0, "y": 0, "z": 0},
            drop_offset={"x": 0, "y": 0, "z": 0},
        )

        # test picking up and returning tips
        p200.pick_up_tip(location=tiprack_1)
        p200.return_tip()
        tiprack_1.reset()

        p200.pick_up_tip(location=tiprack_2)
        p200.return_tip()
        tiprack_2.reset()

        # Return tips to stacker
        protocol.move_labware(
            labware=tiprack_1,
            new_location=stacker,
            use_gripper=True,
            pick_up_offset={"x": 0, "y": 0, "z": 0},
            drop_offset={"x": 0, "y": 0, "z": 0},
        )

        stacker.store()

        protocol.move_labware(
            labware=tiprack_2,
            new_location=stacker,
            use_gripper=True,
            pick_up_offset={"x": 0, "y": 0, "z": 0},
            drop_offset={"x": 0, "y": 0, "z": 0},
        )

        stacker.store()

    if DROPTIP:
        tiprack_1 = stacker.retrieve()

        protocol.move_labware(
            labware=tiprack_1,
            new_location=tiprack_adapter_1,
            use_gripper=True,
            pick_up_offset={"x": 0, "y": 0, "z": 0},
            drop_offset={"x": 0, "y": 0, "z": 0},
        )

        tiprack_2 = stacker.retrieve()

        protocol.move_labware(
            labware=tiprack_2,
            new_location=tiprack_adapter_2,
            use_gripper=True,
            pick_up_offset={"x": 0, "y": 0, "z": 0},
            drop_offset={"x": 0, "y": 0, "z": 0},
        )

        # test picking up and dropping tips
        p200.pick_up_tip(location=tiprack_1)
        p200.drop_tip(location=trash)

        p200.pick_up_tip(location=tiprack_2)
        p200.drop_tip(location=trash)
