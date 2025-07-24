"""Protocol to Test the Stacking and Movement of Lids."""
from opentrons.protocol_api import ParameterContext, ProtocolContext
from opentrons.protocol_api.module_contexts import (
    ThermocyclerContext,
    HeaterShakerContext,
)


metadata = {"protocolName": "5 Stack Test"}
requirements = {"robotType": "Flex", "apiLevel": "2.25"}


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters."""
    parameters.add_str(
        variable_name="lid_type",
        display_name="Lid Type",
        choices=[
            {
                "display_name": "Tough Autosealing Lid",
                "value": "opentrons_tough_pcr_auto_sealing_lid",
            },
            {"display_name": "Universal Lid", "value": "opentrons_tough_universal_lid"},
        ],
        default="opentrons_tough_universal_lid",
    )
    parameters.add_int(
        variable_name="lids_in_a_stack",
        display_name="Num of Lids in Stack",
        minimum=1,
        maximum=5,
        default=5,
    )
    parameters.add_bool(
        variable_name="deck_riser_bool", display_name="Deck Riser", default=False
    )
    parameters.add_float(
        variable_name="num_offset",
        display_name="Numerical Offset",
        minimum=-5,
        maximum=5,
        default=0,
    )
    parameters.add_str(
        variable_name="offset",
        display_name="Offset",
        choices=[
            {"display_name": "Z", "value": "Z"},
            {"display_name": "Y", "value": "Y"},
            {"display_name": "X", "value": "X"},
        ],
        default="X",
    )
    parameters.add_str(
        variable_name="module",
        display_name="Module",
        choices=[
            {"display_name": "Temp Mod", "value": "temperature module gen2"},
            {"display_name": "Thermocycler", "value": "thermocycler module gen2"},
            {"display_name": "Heatershaker", "value": "heaterShakerModuleV1"},
            {"display_name": "Mag Block", "value": "magneticBlockV1"},
            {"display_name": "None", "value": "None"},
        ],
        default="None",
    )


def run(protocol: ProtocolContext) -> None:
    """Runs protocol that moves lids and stacks them."""
    # Load Parameters
    lids_in_stack: int = protocol.params.lids_in_a_stack  # type: ignore[attr-defined]
    num_offset = protocol.params.num_offset  # type: ignore[attr-defined]
    deck_riser_bool = protocol.params.deck_riser_bool  # type: ignore[attr-defined]
    offset = protocol.params.offset  # type: ignore[attr-defined]
    module = protocol.params.module  # type: ignore[attr-defined]
    lid_type = protocol.params.lid_type  # type: ignore[attr-defined]
    # Thermocycler
    if module == "None":
        plate = protocol.load_labware(
            "opentrons_96_wellplate_200ul_pcr_full_skirt", "D1"
        )
    elif module == "thermocycler module gen2":
        thermocycler: ThermocyclerContext = protocol.load_module(
            module,
        )  # type: ignore[assignment]
        plate = thermocycler.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt")
        thermocycler.open_lid()
    elif module == "heaterShakerModuleV1":
        heater_shaker: HeaterShakerContext = protocol.load_module(
            module, "D1"
        )  # type: ignore[assignment]
        plate = heater_shaker.load_labware(
            "opentrons_96_wellplate_200ul_pcr_full_skirt"
        )
        heater_shaker.open_labware_latch()
    else:
        module = protocol.load_module(module, "D1")
        plate = module.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt")
    # Load Lids
    if deck_riser_bool:
        deck_riser_adapter = protocol.load_adapter("opentrons_flex_deck_riser", "D3")
        lid_stack = deck_riser_adapter.load_lid_stack(lid_type, lids_in_stack)
    else:
        lid_stack = protocol.load_lid_stack(lid_type, "D2", lids_in_stack)

    pick_up_offset = {
        "X": {"x": num_offset, "y": 0, "z": 0},
        "Y": {"x": 0, "y": num_offset, "z": 0},
        "Z": {"x": 0, "y": 0, "z": num_offset},
    }
    # move  all lids to plate and then restack
    for i in range(lids_in_stack):
        protocol.comment(f"{offset} Offset {num_offset}, Lid # {i+1}")

        protocol.move_lid(
            lid_stack,
            plate,
            use_gripper=True,
            pick_up_offset=pick_up_offset[offset],
        )
        if i == 0:
            maybe_stack = protocol.move_lid(plate, "C2", use_gripper=True)
            if maybe_stack is None:
                raise RuntimeError("Failed to move lid to C2; no lid stack returned.")
            new_lid_stack = maybe_stack
        else:
            protocol.move_lid(plate, new_lid_stack, use_gripper=True)
