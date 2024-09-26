"""Protocol to Test Evaporation % of the Tough Auto Seal Lid."""
from typing import List
from opentrons.hardware_control.modules.types import ThermocyclerStep
from opentrons.protocol_api import (
    ParameterContext,
    ProtocolContext,
    Labware,
    InstrumentContext,
    Well,
)
from opentrons.protocol_api.module_contexts import ThermocyclerContext
from opentrons.protocol_api.disposal_locations import WasteChute

metadata = {"protocolName": "Tough Auto Seal Lid Evaporation Test"}
requirements = {"robotType": "Flex", "apiLevel": "2.20"}


def _long_hold_test(thermocycler: ThermocyclerContext, tc_lid_temp: float) -> None:
    """Holds TC lid in Thermocycler for 5 min at high temp before evap test."""
    thermocycler.set_block_temperature(4, hold_time_minutes=5)
    thermocycler.set_lid_temperature(tc_lid_temp)
    thermocycler.set_block_temperature(98, hold_time_minutes=5)
    thermocycler.set_block_temperature(4, hold_time_minutes=5)
    thermocycler.open_lid()


def _fill_with_liquid_and_measure(
    protocol: ProtocolContext,
    pipette: InstrumentContext,
    reservoir: Labware,
    plate_in_cycler: Labware,
) -> None:
    """Fill plate with 10 ul per well."""
    locations: List[Well] = [
        plate_in_cycler["A1"],
        plate_in_cycler["A2"],
        plate_in_cycler["A3"],
        plate_in_cycler["A4"],
        plate_in_cycler["A5"],
        plate_in_cycler["A6"],
        plate_in_cycler["A7"],
        plate_in_cycler["A8"],
        plate_in_cycler["A9"],
        plate_in_cycler["A10"],
        plate_in_cycler["A11"],
        plate_in_cycler["A12"],
    ]
    volumes = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10]
    protocol.pause("Weight Armadillo Plate, place on thermocycler")
    # pipette 10uL into Armadillo wells
    source_well: Well = reservoir["A1"]
    pipette.distribute(
        volume=volumes,
        source=source_well,
        dest=locations,
        return_tips=True,
        blow_out=False,
    )
    protocol.pause("Weight Armadillo Plate, place on thermocycler, put on lid")


def _pcr_cycle(thermocycler: ThermocyclerContext) -> None:
    """30x cycles of: 70° for 30s 72° for 30s 95° for 10s."""
    profile_TAG2: List[ThermocyclerStep] = [
        {"temperature": 70, "hold_time_seconds": 30},
        {"temperature": 72, "hold_time_seconds": 30},
        {"temperature": 95, "hold_time_seconds": 10},
    ]
    thermocycler.execute_profile(
        steps=profile_TAG2, repetitions=30, block_max_volume=50
    )


def _move_lid(
    thermocycler: ThermocyclerContext,
    protocol: ProtocolContext,
    top_lid: Labware,
    bottom_lid: Labware,
    wasteChute: WasteChute,
) -> None:
    """Move lid from tc to deck."""
    # Move lid from thermocycler to deck to stack to waste chute
    thermocycler.open_lid()
    # Move Lid to Deck
    protocol.move_labware(top_lid, "B2", use_gripper=True)
    # Move Lid to Stack
    protocol.move_labware(top_lid, bottom_lid, use_gripper=True)
    # Move Lid to Waste Chute
    protocol.move_labware(top_lid, wasteChute, use_gripper=True)


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters."""
    parameters.add_str(
        variable_name="mount_pos",
        display_name="Mount Position",
        description="What mount to use",
        choices=[
            {"display_name": "left_mount", "value": "left"},
            {"display_name": "right_mount", "value": "right"},
        ],
        default="left",
    )
    parameters.add_str(
        variable_name="pipette_type",
        display_name="Pipette Type",
        description="What pipette to use",
        choices=[
            {"display_name": "8ch 50 uL", "value": "flex_8channel_50"},
            {"display_name": "8ch 1000 uL", "value": "flex_8channel_1000"},
        ],
        default="flex_8channel_50",
    )
    parameters.add_float(
        variable_name="tc_lid_temp",
        display_name="TC Lid Temp",
        description="Max temp of TC Lid",
        default=105,
        choices=[
            {"display_name": "105", "value": 105},
            {"display_name": "107", "value": 107},
            {"display_name": "110", "value": 110},
        ],
    )
    parameters.add_str(
        variable_name="test_type",
        display_name="Test Type",
        description="Type of test to run",
        default="evap_test",
        choices=[
            {"display_name": "Evaporation Test", "value": "evap_test"},
            {"display_name": "Long Hold Test", "value": "long_hold_test"},
        ],
    )


def run(protocol: ProtocolContext) -> None:
    """Run protocol."""
    # LOAD PARAMETERS
    pipette_type = protocol.params.pipette_type  # type: ignore[attr-defined]
    mount_position = protocol.params.mount_pos  # type: ignore[attr-defined]
    tc_lid_temp = protocol.params.tc_lid_temp  # type: ignore[attr-defined]
    test_type = protocol.params.test_type  # type: ignore[attr-defined]
    # SETUP
    # Thermocycler
    thermocycler: ThermocyclerContext = protocol.load_module(
        "thermocyclerModuleV2"
    )  # type: ignore[assignment]

    plate_in_cycler = thermocycler.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt"
    )
    thermocycler.open_lid()
    # Labware
    tiprack_50_1 = protocol.load_labware("opentrons_flex_96_tiprack_50ul", "C3")
    reservoir = protocol.load_labware("nest_12_reservoir_15ml", "A2")
    lids: List[Labware] = [
        protocol.load_labware("opentrons_tough_pcr_auto_sealing_lid", "D2")
    ]
    for i in range(4):
        lids.append(lids[-1].load_labware("opentrons_tough_pcr_auto_sealing_lid"))
    lids.reverse()
    top_lid = lids[0]
    bottom_lid = lids[1]
    # Pipette
    pipette = protocol.load_instrument(
        pipette_type, mount_position, tip_racks=[tiprack_50_1]
    )
    # Waste Chute
    wasteChute = protocol.load_waste_chute()

    # DEFINE TESTS #
    thermocycler.set_block_temperature(4)
    thermocycler.set_lid_temperature(105)

    # hold at 95° for 3 minutes
    profile_TAG: List[ThermocyclerStep] = [{"temperature": 95, "hold_time_minutes": 3}]
    # hold at 72° for 5min
    profile_TAG3: List[ThermocyclerStep] = [{"temperature": 72, "hold_time_minutes": 5}]

    if test_type == "long_hold_test":
        protocol.move_labware(top_lid, plate_in_cycler, use_gripper=True)
        _long_hold_test(thermocycler, tc_lid_temp)
        protocol.move_labware(top_lid, "B2", use_gripper=True)
        _long_hold_test(thermocycler, tc_lid_temp)
        _fill_with_liquid_and_measure(protocol, pipette, reservoir, plate_in_cycler)
        thermocycler.close_lid()
        _pcr_cycle(thermocycler)

    # Go through PCR cycle
    if test_type == "evap_test":
        _fill_with_liquid_and_measure(protocol, pipette, reservoir, plate_in_cycler)
        protocol.move_labware(top_lid, plate_in_cycler, use_gripper=True)
        thermocycler.close_lid()
        thermocycler.execute_profile(
            steps=profile_TAG, repetitions=1, block_max_volume=50
        )
        _pcr_cycle(thermocycler)
        thermocycler.execute_profile(
            steps=profile_TAG3, repetitions=1, block_max_volume=50
        )
        # # # Cool to 4°
        thermocycler.set_block_temperature(4)
        thermocycler.set_lid_temperature(tc_lid_temp)
        # Open lid
    thermocycler.open_lid()
    _move_lid(thermocycler, protocol, top_lid, bottom_lid, wasteChute)
    protocol.pause("Weigh armadillo plate.")
