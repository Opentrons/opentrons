"""DVT Flex Stacker with 4 or 2 stackers.

This protocol is used to validate stacker store/dispense commands

"""

from opentrons.protocol_api import ParameterContext, ProtocolContext
from opentrons.protocol_api.module_contexts import (
    FlexStackerContext,
)
from datetime import datetime
import os
import csv

metadata = {
    "protocolName": "Flex Stacker Labware Dispense/Store.",
    "author": "Opentrons <protocols@opentrons.com>",
    "description": "This protocol dispenses labware from one stacker and into"
    "another stacker, the second stacker then stores it, and the actions are"
    "reversed.",
}
requirements = {
    "robotType": "Flex",
    "apiLevel": "2.23",
}

test_data = {
    "Cycles": None,
    "Stacker SN": None,
    "State": None,
    "labware": None,
    "plate_num": None,
    "Error": None,
} 


def add_parameters(parameters: ParameterContext) -> None:
    """Runtime parameters."""
    parameters.add_str(
        display_name="Target Labware",
        variable_name="labware_name",
        description="The labware that will be stored/dispensed.",
        default="opentrons_flex_96_tiprack_1000ul",
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
                "display_name": "Armadillo Plates",
                "value": "armadillo_96_wellplate_200ul_pcr_full_skirt",
            },
            {
                "display_name": "Armadillo 384 PCR Plates",
                "value": "biorad_384_wellplate_50ul",
            },
            {
                "display_name": "NEST 96 Deep Well Plates",
                "value": "nest_96_wellplate_2ml_deep",
            },
            {
                "display_name": "NEST 12 Well Reservoirs",
                "value": "nest_12_reservoir_15ml",
            },
            {
                "display_name": "NEST 96 Flat Bottom Plates",
                "value": "nest_96_wellplate_200ul_flat",
            },
            {
                "display_name": "NEST 96 100uL PCR Plates",
                "value": "nest_96_wellplate_100ul_pcr_full_skirt",
            },
            {
                "display_name": "Biorad 384 PCR Plates",
                "value": "biorad_384_wellplate_50ul",
            },
            {
                "display_name": "Bio-Rad 96 Plate 200 uL PCR",
                "value": "biorad_96_wellplate_200ul_pcr",
            },
            {
                "display_name": "Costar 24 Well Plates",
                "value": "corning_24_wellplate_3.4ml_flat",
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
        display_name="Labware Count",
        variable_name="labware_count",
        description="The number of labware in the stacker",
        default=46,
        minimum=1,
        maximum=100,
    )

    parameters.add_str(
        display_name="number of stackers",
        variable_name="stackers_mounted",
        description="choose the stackers that is on the deck.",
        default="B4 A4",
        choices=[
            {"display_name": "4 STACKERS", "value": "D4 C4 B4 A4"},
            {"display_name": "2 STACKERS (B4, A4)", "value": "B4 A4"},
        ],
    )


tiprack_lid = "opentrons_flex_tiprack_lid"


def record_test_data(
    test_data, cycle, SNs, state, labware_name, plate_num, log_file, csvfile
):
    test_data["Cycles"] = cycle
    test_data["Stacker SN"] = SNs
    test_data["State"] = state
    test_data["labware"] = labware_name
    test_data["plate_num"] = plate_num
    test_data["error"] = None
    log_file.writerow(test_data)
    csvfile.flush()


def run(protocol: ProtocolContext) -> None:
    """Protocol."""
    directory = f'/data/dvt_stacker_lifetime_{datetime.now().strftime("%m_%d_%y")}'
    if not os.path.exists(directory):
        os.makedirs(directory)
    labware_name = protocol.params.labware_name
    labware_count = protocol.params.labware_count
    test_cycles = protocol.params.test_cycles
    stackers_mounted = protocol.params.stackers_mounted
    deck_slots_for_stackers = stackers_mounted.split()

    # ======================= Stacker Setup ======================
    stacker_num = 0
    SNs = []
    num_of_stackers = len(deck_slots_for_stackers)
    f_stacker_1 = protocol.load_module(  # type: ignore
        "flexStackerModuleV1", "B4"
    )
    f_stacker_1.set_stored_labware(
        load_name=labware_name,
        count=labware_count,  # always zero so we can store the labware
        lid=tiprack_lid if "opentrons_flex_96_tiprack" in labware_name else None, 
    )
    f_stacker_2 = protocol.load_module(  # type: ignore
        "flexStackerModuleV1", "A4"
    )
    f_stacker_2.set_stored_labware(
        load_name=labware_name,
        count=0,  # always zero so we can store the labware
        lid=tiprack_lid if "opentrons_flex_96_tiprack" in labware_name else None, 
    )
    SNs.append(f_stacker_1._core.get_serial_number())
    SNs.append(f_stacker_2._core.get_serial_number())
        
    f_name = f'{directory}/labware_compatablitiy_lifetime_test_{datetime.now().strftime("%m_%d_%y_%H_%M")}.csv'
    # ======================= RETRIEVE/STORE TIPRACKS ======================
    if not protocol.is_simulating():
        with open(f_name, "w", newline="") as csvfile:
            test_details = csv.writer(
                csvfile, delimiter=",", quotechar='"', quoting=csv.QUOTE_MINIMAL
            )
            test_details.writerow({"test details"})
            test_details.writerow({"Flex Stacker"})
            log_file = csv.DictWriter(csvfile, test_data)
            log_file.writeheader()
            try:
                for cycle in range(1, test_cycles+1):
                    labware_list = []
                    protocol.comment(f"Starting cycle: {cycle} for {labware_name}")
                    for lc in range(labware_count):
                        protocol.comment(f"Starting cycle: {cycle} for {labware_name}")
                        # ---------------------Retrieve labware Stacker A---------------------------------
                        lw = f_stacker_1.retrieve()
                        protocol.move_labware(
                            lw, f_stacker_2, use_gripper=True
                        )
                        # ---------------------Store labware Stacker B---------------------------------
                        f_stacker_2.store()

                    for stored_lw in range(labware_count):
                        protocol.comment(
                            f"Starting cycle: {stored_lw} for {labware_name}"
                        )
                        # go backwards
                        # ---------------------Store labware Stacker B---------------------------------
                        lw = f_stacker_2.retrieve()
                        protocol.move_labware(
                            lw, f_stacker_1, use_gripper=True
                        )
                        # ---------------------Retrieve labware Stacker A---------------------------------
                        f_stacker_1.store()

            except Exception as e:
                test_data["Error"] = e
                log_file.writerow(test_data)
                csvfile.flush()
                raise (e)
