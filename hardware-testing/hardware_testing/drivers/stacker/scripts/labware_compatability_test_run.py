"""DVT Flex Stacker with 4 or 2 stackers.

This protocol is used to validate stacker store/dispense commands

"""

from opentrons.protocol_api import ParameterContext, ProtocolContext
from opentrons.protocol_api.module_contexts import (
    FlexStackerContext,
)
from datetime import datetime
from typing import Optional, Dict, Any
import os
import csv

metadata = {
    "protocolName": "Flex Stacker Test.",
    "author": "Opentrons <protocols@opentrons.com>",
    "description": "This protocol dispenses labware from one stacker and into"
    "another stacker, the second stacker then stores it, and the actions are"
    "reversed.",
}
requirements = {
    "robotType": "Flex",
    "apiLevel": "2.23",
}

test_data: Dict[str, Optional[Any]] = {
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
                "display_name": "NEST PCR Plates",
                "value": "nest_96_wellplate_100ul_pcr_full_skirt",
            },
            {
                "display_name": "NEST 96 Deep Well Plates",
                "value": "nest_96_wellplate_2ml_deep",
            },
            {
                "display_name": "NEST 96 Flat Bottom Plates",
                "value": "nest_96_wellplate_200ul_flat",
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
        default=1,
        minimum=1,
        maximum=100,
    )


def record_test_data(
    test_data: Dict[str, Optional[Any]],
    cycle: int,
    SNs: str,
    state: str,
    labware_name: str,
    plate_num: int,
    log_file: Any,
    csvfile: Any,
) -> None:
    """Records test data."""
    test_data["Cycles"] = cycle
    test_data["Stacker SN"] = SNs
    test_data["State"] = state
    test_data["labware"] = labware_name
    test_data["plate_num"] = plate_num
    test_data["Error"] = None
    log_file.writerow(test_data)
    csvfile.flush()


def run(protocol: ProtocolContext) -> None:
    """Protocol."""
    directory = f'/data/dvt_stacker_lifetime_{datetime.now().strftime("%m_%d_%y")}'
    if not os.path.exists(directory):
        os.makedirs(directory)
    labware_name = protocol.params.labware_name  # type: ignore[attr-defined]
    labware_count = protocol.params.labware_count  # type: ignore[attr-defined]
    test_cycles = protocol.params.test_cycles  # type: ignore[attr-defined]
    # stackers_mounted = protocol.params.stackers_mounted  # type: ignore[attr-defined]
    # deck_slots_for_stackers = stackers_mounted.split()

    # define lid
    if "tiprack" in labware_name:
        tiprack_lid = "opentrons_flex_tiprack_lid"
    else:
        tiprack_lid = None

    # ======================= Stacker Setup ======================
    s_num = 0
    SNs = []
    # num_of_stackers = len(deck_slots_for_stackers)
    f_stacker_1 = protocol.load_module(  # type: ignore
            "flexStackerModuleV1", 'B3'
            )
    f_stacker_1.set_stored_labware(
        load_name=labware_name,
        count=2,  # always zero so we can store the labware
        lid=tiprack_lid if "opentrons_flex_96_tiprack" in labware_name else None,
        )
    
    for cycle in range(test_cycles):
        labware_list = []
        protocol.comment(f"Starting cycle: {cycle} for {labware_name}")
        for lc in range(labware_count):
            protocol.comment(f"Starting cycle: {cycle} for {labware_name}")
            # ---------------------Retrieve labware Stacker A
            lw = f_stacker_1.retrieve()
            f_stacker_1.store()