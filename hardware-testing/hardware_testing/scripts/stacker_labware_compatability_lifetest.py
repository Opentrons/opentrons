"""Flex Stacker with 4 or 2 stackers.
This protocol is used to validate stacker store/dispense commands
"""

from opentrons.protocol_api import ParameterContext, ProtocolContext
from opentrons.protocol_api.module_contexts import (
    FlexStackerContext,
)

metadata = {
    "protocolName": "FS Labware Compatability RT Labware Clearance.",
    "author": "Opentrons <protocols@opentrons.com>",
    "description": "This protocol dispenses labware from one stacker and into"
    "another stacker, the second stacker then stores it, and the actions are"
    "reversed.",
}
requirements = {
    "robotType": "Flex",
    "apiLevel": "2.25",
}

def add_parameters(parameters: ParameterContext) -> None:
    """Runtime parameters."""
    parameters.add_str(
        display_name="Target Labware",
        variable_name="labware_name",
        description="The labware that will be stored/dispensed.",
        default="nest_96_wellplate_2ml_deep",
        choices=[
            {
                "display_name": "Opentrons 96 Tipack 50ul",
                "value": "opentrons_flex_96_tiprack_50ul",
            },
            {
                "display_name": "Opentrons 96 Tipack 200ul",
                "value": "opentrons_flex_96_tiprack_200ul",
            },
            {
                "display_name": "Opentrons 96 Tipack 1000ul",
                "value": "opentrons_flex_96_tiprack_1000ul",
            },
            {
                "display_name": "NEST Flat Bottom 200uL Plate",
                "value": "nest_96_wellplate_200ul_flat",
            },
            {
                "display_name": "Armadillo 96 plate 200uL PCR",
                "value": "opentrons_96_wellplate_200ul_pcr_full_skirt",
            },
            {
                "display_name": "NEST PCR Plates",
                "value": "nest_96_wellplate_100ul_pcr_full_skirt",
            },
            {
                "display_name": "NEST 96 Deep Well Plates",
                "value": "nest_96_wellplate_2ml_deep",
            },
            {
                "display_name": "NEST 12 Well Reservoir 15 mL",
                "value": "nest_12_reservoir_15ml",
            },
            {
                "display_name": "Thermosci 96 plate 1300ul",
                "value": "thermoscientificnunc_96_wellplate_1300ul",
            },
            {
                "display_name": "Thermosci 96 plate 2000ul",
                "value": "thermoscientificnunc_96_wellplate_2000ul",
            },
            {
                "display_name": "USASci 96 plate 2.4mL Deep",
                "value": "usascientific_96_wellplate_2.4ml_deep",
            },
            {
                "display_name": "Biosys Microamp 384 plate 40ul",
                "value": "appliedbiosystemsmicroamp_384_wellplate_40ul",
            },
            {
                "display_name": "Corning 96 plate 360ul Flat",
                "value": "corning_96_wellplate_360ul_flat",
            },
            {
                "display_name": "Corning 6 plate 16.8mL Flat",
                "value": "corning_6_wellplate_16.8ml_flat",
            },
            {
                "display_name": "Corning 48 plate 1.6mL Flat",
                "value": "corning_48_wellplate_1.6ml_flat",
            },
            {
                "display_name": "Corning 384 plate 122uL Flat",
                "value": "corning_384_wellplate_112ul_flat",
            },
            {
                "display_name": "Corning 48 plate 6.9ml Flat",
                "value": "corning_48_wellplate_6.9ml_flat",
            },
            {
                "display_name": "Corning 12 plate 6.9mL Flat",
                "value": "corning_12_wellplate_6.9ml_flat",
            },
            {
                "display_name": "Artel 96 Plate 360uL flat",
                "value": "corning_96_wellplate_360ul_flat",
            },
            {
                "display_name": "biorad 384 plate 50uL PCR",
                "value": "biorad_384_wellplate_50ul",
            },
            {
                "display_name": "biorad 96 plate 200uL PCR",
                "value": "biorad_96_wellplate_200ul_pcr",
            },
        ],
    )
    parameters.add_int(
        display_name="Cycles",
        variable_name="test_cycles",
        description="The number of cycles of dispensing/storing to perform.",
        default=1,
        minimum=1,
        maximum=5616,
    )
    parameters.add_int(
        display_name="Labware Count",
        variable_name="labware_count",
        description="The number of labware in the stacker",
        default=4,
        minimum=1,
        maximum=100,
    )
    parameters.add_float(
        display_name="Labware Clearance",
        variable_name="Labware_clearance",
        description="The clearance height for the labware to be retrieved",
        default=2.5,
        minimum=0.0,
        maximum=50.0,
    )
    parameters.add_str(
        display_name="Number of Stackers",
        variable_name="stackers_mounted",
        description="choose the stackers that is on the deck.",
        default="D4 B4",
        choices=[
            {"display_name": "4 STACKERS", "value": "D4 C4 B4 A4"},
            {"display_name": "2 STACKERS (D4, B4)", "value": "D4 B4"},
        ],
    )

def run(protocol: ProtocolContext) -> None:
    """Protocol."""
    labware_name = protocol.params.labware_name  # type: ignore[attr-defined]
    labware_count = protocol.params.labware_count  # type: ignore[attr-defined]
    test_cycles = protocol.params.test_cycles  # type: ignore[attr-defined]
    stackers_mounted = protocol.params.stackers_mounted  # type: ignore[attr-defined]
    deck_slots_for_stackers = stackers_mounted.split()
    labware_clearance = protocol.params.Labware_clearance
    # define lid
    if "tiprack" in labware_name:
        tiprack_lid = "opentrons_flex_tiprack_lid"
    else:
        tiprack_lid = None

    # ======================= Stacker Setup ======================
    s_num = 0
    SNs = []
    num_of_stackers = len(deck_slots_for_stackers)
    for d in deck_slots_for_stackers:
        s_num += 1
        globals()[f"f_stacker_{s_num}"]: FlexStackerContext = protocol.load_module(  # type: ignore
            "flexStackerModuleV1", d
        )
        if s_num % 2 == 0:
            globals()[f"f_stacker_{s_num}"].set_stored_labware(
                load_name=labware_name,
                count=0,  # always zero so we can store the labware
                lid=tiprack_lid
                if "opentrons_flex_96_tiprack" in labware_name
                else None,
            )
        else:
            globals()[f"f_stacker_{s_num}"].set_stored_labware(
                load_name=labware_name,
                count=labware_count,
                lid=tiprack_lid
                if "opentrons_flex_96_tiprack" in labware_name
                else None,
            )

        SNs.append(globals()[f"f_stacker_{s_num}"]._core.get_serial_number())
    # ======================= RETRIEVE/STORE TIPRACKS ======================
    if not protocol.is_simulating():

        try:
            for cycle in range(test_cycles):
                labware_list = []
                protocol.comment(f"Starting cycle: {cycle} for {labware_name}")
                for lc in range(labware_count):
                    protocol.comment(f"Starting cycle: {cycle} for {labware_name}")
                    if num_of_stackers == 4:
                        # ---------------------Retrieve labware Stacker A
                        lw = globals()[f"f_stacker_{1}"].retrieve(labware_clearance)
                        protocol.move_labware(
                            lw, globals()[f"f_stacker_{2}"], use_gripper=True
                        )
                        # ---------------------Store labware Stacker B
                        globals()[f"f_stacker_{2}"].store()
                        labware_list.append(lw)
                        # ---------------------Retrieve labware Stacker C
                        lw = globals()[f"f_stacker_{3}"].retrieve(labware_clearance)
                        protocol.move_labware(
                            lw, globals()[f"f_stacker_{4}"], use_gripper=True
                        )
                        # ---------------------Store labware Stacker D
                        globals()[f"f_stacker_{4}"].store()
                        labware_list.append(lw)

                    elif num_of_stackers == 2:
                        # ---------------------Retrieve labware Stacker A
                        lw = globals()[f"f_stacker_{1}"].retrieve(labware_clearance)
                        protocol.move_labware(
                            lw, globals()[f"f_stacker_{2}"], use_gripper=True
                        )
                        # ---------------------Store labware Stacker B
                        globals()[f"f_stacker_{2}"].store()
                        labware_list.append(lw)

                for stored_lw in range(labware_count):
                    protocol.comment(
                        f"Starting cycle: {stored_lw} for {labware_name}"
                    )
                    if num_of_stackers == 4:
                        # go backwards
                        # ---------------------Store labware Stacker B
                        lw = globals()[f"f_stacker_{2}"].retrieve(labware_clearance)
                        protocol.move_labware(
                            lw, globals()[f"f_stacker_{1}"], use_gripper=True
                        )
                        # ---------------------Retrieve labware Stacker A
                        globals()[f"f_stacker_{1}"].store()
                        # go backwards
                        # ---------------------Store labware Stacker D
                        lw = globals()[f"f_stacker_{4}"].retrieve(labware_clearance)
                        protocol.move_labware(
                            lw, globals()[f"f_stacker_{3}"], use_gripper=True
                        )
                        # ---------------------Store labware Stacker C
                        globals()[f"f_stacker_{3}"].store()

                    elif num_of_stackers == 2:
                        # go backwards
                        # ---------------------Store labware Stacker B
                        lw = globals()[f"f_stacker_{2}"].retrieve(labware_clearance)
                        protocol.move_labware(
                            lw, globals()[f"f_stacker_{1}"], use_gripper=True
                        )
                        # ---------------------Retrieve labware Stacker A
                        globals()[f"f_stacker_{1}"].store()

        except Exception as e:
            raise (e)
