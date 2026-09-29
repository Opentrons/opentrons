"""MiSeq Library Preparation Protocol."""
from typing import Union
from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    InstrumentContext,
    Well,
)
from typing import Tuple, Optional
from opentrons.protocol_api import COLUMN, ALL
from opentrons.protocol_api.module_contexts import (
    HeaterShakerContext,
    ThermocyclerContext,
    TemperatureModuleContext,
)
from typing import List, Dict

metadata = {
    "protocolName": "MiSeq Library Preparation Protocol",
    "author": "Anurag Kanase <anurag.kanase@opentrons.com>",
    "description": "Two-step PCR protocol for Illumina MiSeq library prep.",
}


requirements = {"robotType": "Flex", "apiLevel": "2.28"}


def comment_height_of_specific_labware(
    protocol: ProtocolContext, labware_name: str, dict_of_labware_heights: Dict
) -> None:
    """Comment height found of specific labware."""
    total_height = 0.0
    for key in dict_of_labware_heights.keys():
        if key[0] == labware_name:
            height = dict_of_labware_heights[key]
            total_height += height
    protocol.comment(f"Liquid Waste Total Height: {total_height}")


def load_wells_with_custom_liquids(
    protocol: ProtocolContext,
    liquid_vols_and_wells: Dict[str, List[Dict[str, Union[Well, List[Well], float]]]],
) -> None:
    """Load custom liquids into wells."""
    from opentrons.protocol_api import Well

    liquid_colors = [
        "#008000",
        "#A52A2A",
        "#00FFFF",
        "#0000FF",
        "#800080",
        "#ADD8E6",
        "#FF0000",
        "#FFFF00",
        "#FF00FF",
        "#00008B",
        "#7FFFD4",
        "#FFC0CB",
        "#FFA500",
        "#00FF00",
        "#C0C0C0",
    ]
    i = 0
    volume = 0.0
    for liquid_name, wells_info in liquid_vols_and_wells.items():
        liquid = protocol.define_liquid(
            liquid_name, display_color=liquid_colors[i % len(liquid_colors)]
        )
        for well_info in wells_info:
            if isinstance(well_info["well"], list):
                wells = well_info["well"]
            elif isinstance(well_info["well"], Well):
                wells = [well_info["well"]]
            else:
                wells = []
            if isinstance(well_info["volume"], (float, int)):
                volume = well_info["volume"]
            for well in wells:
                well.load_liquid(liquid, volume)


def find_liquid_height_of_all_wells(
    protocol: ProtocolContext, pipette: InstrumentContext, wells: List[Well]
) -> Dict:
    """Find the liquid height of all wells in protocol."""
    dict_of_labware_heights = {}
    pipette.pick_up_tip()
    pip_channels = pipette.active_channels
    for well in wells:
        labware_name = well.parent.name
        total_number_of_wells_in_plate = len(well.parent.wells())
        if (
            pip_channels > 1
            and total_number_of_wells_in_plate > 12
            and well.well_name.startswith("A")
        ):
            height = pipette.measure_liquid_height(well)
            dict_of_labware_heights[labware_name, well] = height
        elif total_number_of_wells_in_plate <= 12:
            height = pipette.measure_liquid_height(well)
            dict_of_labware_heights[labware_name, well] = height
    if pip_channels != pipette.channels:
        pipette.drop_tip()
    else:
        pipette.return_tip()
        pipette.reset_tipracks()
    msg = f"result: {dict_of_labware_heights}"
    protocol.comment(msg=msg)
    comment_height_of_specific_labware(
        protocol, "Liquid Waste", dict_of_labware_heights
    )
    return dict_of_labware_heights


def find_liquid_height_of_loaded_liquids(
    ctx: ProtocolContext,
    liquid_vols_and_wells: Dict[str, List[Dict[str, Union[Well, List[Well], float]]]],
    pipette: InstrumentContext,
) -> List[Well]:
    """Find Liquid height of loaded liquids."""
    from opentrons.protocol_api import Well

    load_wells_with_custom_liquids(ctx, liquid_vols_and_wells)
    wells = [
        well
        for items in liquid_vols_and_wells.values()
        for entry in items
        if isinstance(entry["well"], (Well, list)) and entry["volume"] != 0.0
        for well in (
            entry["well"] if isinstance(entry["well"], list) else [entry["well"]]
        )
    ]
    if pipette.active_channels == 96:
        wells = [
            well
            for well in wells
            if well.display_name.split(" ")[0] == "A1"
            # Pipettes cannot reach staging slots. These plates are moved into
            # working slots by the gripper before their first transfer.
            and well.parent.parent not in ("A4", "B4", "C4", "D4")
        ]
    find_liquid_height_of_all_wells(ctx, pipette, wells)
    return wells


def add_parameters(parameters: ParameterContext) -> None:
    """Parameters."""
    parameters.add_float(
        variable_name="dot_bottom",
        display_name=".bottom",
        description="Lowest value pipette will go to.",
        default=0.5,
        choices=[
            {"display_name": "0.0", "value": 0.0},
            {"display_name": "0.1", "value": 0.1},
            {"display_name": "0.2", "value": 0.2},
            {"display_name": "0.3", "value": 0.3},
            {"display_name": "0.4", "value": 0.4},
            {"display_name": "0.5", "value": 0.5},
            {"display_name": "0.6", "value": 0.6},
            {"display_name": "0.7", "value": 0.7},
            {"display_name": "0.8", "value": 0.8},
            {"display_name": "0.9", "value": 0.9},
            {"display_name": "1.0", "value": 1.0},
        ],
    )
    parameters.add_int(
        variable_name="error_capture_duration",
        display_name="Error Capture Duration",
        description="Length of video clip to capture on error (in seconds).",
        default=30,
        minimum=5,
        maximum=6000,
        unit="seconds",
    )
    parameters.add_bool(
        variable_name="deactivate_modules",
        display_name="Deactivate Modules",
        description="deactivate all modules at end of run",
        default=True,
    )
    parameters.add_bool(
        variable_name="probe_liquid_height",
        display_name="Probe Liquid Height",
        description="True means probe liquid height at start of run.",
        default=False,
    )
    parameters.add_float(
        variable_name="meniscus_z",
        display_name="Meniscus Z",
        default=-0.5,
        minimum=-10.0,
        maximum=10.0,
        description="Z offset for meniscus height. Default is -1.5mm.",
    )
    parameters.add_bool(
        variable_name="column_tip_pickup",
        display_name="Perform Column Tip Pickup",
        default=True,
    )


def run(protocol: ProtocolContext) -> None:
    """Protocol."""
    # Load Parameters
    protocol.capture_image(filename="start_of_run")
    dot_bottom = protocol.params.dot_bottom  # type: ignore[attr-defined]
    deactivate_modules_bool = protocol.params.deactivate_modules  # type: ignore[attr-defined]
    column_tip_pick_up = protocol.params.column_tip_pickup  # type: ignore[attr-defined]
    probe_height_bool = protocol.params.probe_liquid_height  # type: ignore[attr-defined]
    meniscus_z = protocol.params.meniscus_z  # type: ignore[attr-defined]
    protocol.comment("Protocol Version: 03")

    def transfer(
        pipette: InstrumentContext,
        volume: float,
        source: Well,
        dest: Well,
        mix_after: Optional[Tuple] = None,
    ) -> None:
        """Custom transfer function combining asp and dsp with optional mixing & flow rate control.

        Args:
            pipette: The pipette object to use
            volume: Volume to transfer in µL
            source: Source well/location
            dest: Destination well/location
            mix_after: Tuple of (mix_count, mix_volume) for mixing after dispense
            aspirate_flow_rate: Optional custom flow rate for aspiration
            dispense_flow_rate: Optional custom flow rate for dispensing
        """
        # Store original flow rates
        original_asp_rate = pipette.flow_rate.aspirate
        original_disp_rate = pipette.flow_rate.dispense

        # Perform transfer
        if source.current_liquid_volume() < volume:
            src_start_location = source.meniscus(z=meniscus_z, target="start")
            src_end_location = source.meniscus(z=meniscus_z, target="end")
        else:
            src_start_location = source.bottom(z=dot_bottom)
            src_end_location = source.bottom(z=dot_bottom)
        pipette.prepare_to_aspirate()
        pipette.aspirate(
            volume, location=src_start_location, end_location=src_end_location
        )
        pipette.move_to(source.top(), speed=5)
        pipette.dispense(volume, dest.bottom(z=dot_bottom))
        pipette.move_to(dest.top(), speed=5)

        # Mix if specified
        if mix_after:
            mix_count, mix_volume = mix_after
            pipette.mix(mix_count, mix_volume)

        # Restore original flow rates
        pipette.flow_rate.aspirate = original_asp_rate
        pipette.flow_rate.dispense = original_disp_rate

    # Load modules
    thermocycler: ThermocyclerContext = protocol.load_module(
        "thermocyclerModuleV2"
    )  # type: ignore[assignment]
    temp_module: TemperatureModuleContext = protocol.load_module(
        "temperatureModuleV2", "C1"
    )  # type: ignore[assignment]
    reagent_block = temp_module.load_adapter("opentrons_96_well_aluminum_block")
    heater_shaker: HeaterShakerContext = protocol.load_module(
        "heaterShakerModuleV1", "D1"
    )  # type: ignore[assignment]
    hs_adapter = heater_shaker.load_adapter("opentrons_96_pcr_adapter")

    # Load labware
    pcr_reagents_plate = reagent_block.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", label="PCR Master Mix"
    )
    pcr1_plate = thermocycler.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", label="PCR1"
    )
    pcr1_plate.load_empty(pcr1_plate.wells())
    dna_plate = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "A3", label="DNA"
    )
    indices_plate = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "C3", label="Indices"
    )
    pcr1_dilution_plate = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "A4", label="PCR1 Dilution"
    )
    pcr2_dilution_plate = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "C4", label="PCR2 Dilution"
    )
    reservoir = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "D2", label="Water Reservoir"
    )
    eppendorf_384 = protocol.load_labware(
        "appliedbiosystemsmicroamp_384_wellplate_40ul",
        "A2",
        label="Applied Biosystems 384",
    )
    pcr2_plate = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "D4", label="PCR2 Plate"
    )
    pcr2_plate.load_empty(pcr2_plate.wells())
    # Load tips
    tiprack_adapter = protocol.load_adapter("opentrons_flex_96_tiprack_adapter", "B3")
    tiprack_1 = tiprack_adapter.load_labware("opentrons_flex_96_tiprack_50ul")
    partial_tiprack = protocol.load_labware("opentrons_flex_96_tiprack_50ul", "C2")

    # Load pipette
    p96 = protocol.load_instrument("flex_96channel_200", "left", tip_racks=[tiprack_1])

    def column(pipette: InstrumentContext = p96) -> None:
        pipette.configure_nozzle_layout(style=COLUMN, start="A1")

    def all(pipette: InstrumentContext = p96) -> None:
        pipette.configure_nozzle_layout(style=ALL)

    # Load liquids and probe.
    liquid_vols_and_wells: Dict[str, List[Dict[str, Well | List[Well] | float]]] = {
        "Water": [{"well": reservoir.wells(), "volume": 200.0}],
        "pcr_mm1": [{"well": pcr_reagents_plate.wells(), "volume": 200.0}],
        "pcr_dilution": [{"well": pcr1_dilution_plate.wells(), "volume": 200.0}],
        "pcr_dilution2": [{"well": pcr2_dilution_plate.wells(), "volume": 200.0}],
        "Index": [{"well": indices_plate.wells(), "volume": 100.0}],
        "DNA": [{"well": dna_plate.wells(), "volume": 100.0}],
    }

    pcr_mm1 = pcr_reagents_plate["A1"]
    pcr_mm2 = pcr_reagents_plate["A2"]
    if probe_height_bool:
        find_liquid_height_of_loaded_liquids(
            protocol, liquid_vols_and_wells=liquid_vols_and_wells, pipette=p96
        )
    else:
        load_wells_with_custom_liquids(
            protocol, liquid_vols_and_wells=liquid_vols_and_wells
        )
    # Protocol steps
    protocol.comment("Starting MiSeq library preparation protocol")

    # Step 1-2: Set temperatures
    thermocycler.open_lid()
    temp_mod_task = temp_module.start_set_temperature(8)
    tc_block_task = thermocycler.start_set_block_temperature(8)
    protocol.wait_for_tasks([tc_block_task, temp_mod_task])

    column_tips = partial_tiprack.rows()[0][::-1]
    if column_tip_pick_up:
        # Step 3: Dispense PCR1 master mix (avoiding multidispense to maintian accuracy)
        column()
        protocol.comment("Dispensing PCR1 master mix")
        p96.pick_up_tip(column_tips.pop(0))
        for col in range(12):
            transfer(p96, 7.5, pcr_mm1, pcr1_plate.rows()[0][col])
        p96.return_tip()

    # Step 4: Transfer DNA samples
    all()
    protocol.comment("Transferring DNA samples")
    p96.pick_up_tip(tiprack_1["A1"])
    transfer(p96, 5, dna_plate["A1"], pcr1_plate["A1"])
    p96.return_tip()

    # Step 5: Shake
    protocol.comment("Shaking PCR1 plate")
    heater_shaker.open_labware_latch()
    protocol.move_labware(pcr1_plate, hs_adapter, use_gripper=True)
    heater_shaker.close_labware_latch()
    heater_shaker.set_and_wait_for_shake_speed(500)
    protocol.delay(seconds=30)
    heater_shaker.deactivate_shaker()
    heater_shaker.open_labware_latch()

    # Step 6: PCR1 thermal cycling
    protocol.comment("Starting PCR1 thermal cycling")
    protocol.move_labware(pcr1_plate, thermocycler, use_gripper=True)
    heater_shaker.close_labware_latch()
    thermocycler.close_lid()
    thermocycler.set_lid_temperature(105)

    # Initial denaturation
    thermocycler.execute_profile(
        steps=[{"temperature": 95, "hold_time_seconds": 180}], repetitions=1
    )

    # 35 cycles
    thermocycler.execute_profile(
        steps=[
            {"temperature": 95, "hold_time_seconds": 30},
            {"temperature": 60, "hold_time_seconds": 15},
            {"temperature": 72, "hold_time_seconds": 15},
        ],
        repetitions=35,
    )

    # Final extension
    thermocycler.execute_profile(
        steps=[
            {"temperature": 72, "hold_time_seconds": 300},
            {"temperature": 20, "hold_time_seconds": 60},
        ],
        repetitions=1,
    )

    thermocycler.set_block_temperature(8)
    thermocycler.open_lid()
    # Steps 7-8: Move plates
    protocol.comment("Setting up PCR2")
    protocol.move_labware(pcr1_plate, "B2", use_gripper=True)

    protocol.move_labware(pcr2_plate, thermocycler, use_gripper=True)
    # Step 9: Dispense PCR2 master mix
    protocol.comment("Dispensing PCR2 master mix")
    if column_tip_pick_up:
        column()
        p96.pick_up_tip(column_tips.pop(0))
        for col in range(12):
            transfer(p96, 6, pcr_mm2, pcr2_plate.rows()[0][col])
        p96.return_tip()

    protocol.comment("Rearranging Deck for Dilutions")
    heater_shaker.open_labware_latch()
    protocol.move_labware(pcr_reagents_plate, hs_adapter, use_gripper=True)
    protocol.move_labware(partial_tiprack, "D4", use_gripper=True)
    protocol.move_labware(pcr1_dilution_plate, reagent_block, use_gripper=True)
    protocol.move_labware(pcr2_dilution_plate, "C2", use_gripper=True)
    heater_shaker.close_labware_latch()
    # Step 10: Transfer indices
    protocol.comment("Transferring indices")
    all()
    p96.pick_up_tip(tiprack_1["A1"])
    transfer(p96, 5, indices_plate["A1"], pcr2_plate["A1"])
    p96.return_tip()
    # Steps 11-12: PCR1 dilution setup
    protocol.comment("Setting up PCR1 dilution")
    p96.pick_up_tip(tiprack_1["A1"])
    transfer(p96, 40.0, reservoir["A1"], pcr1_dilution_plate["A1"])
    transfer(p96, 5.0, pcr1_plate["A1"], pcr1_dilution_plate["A1"], mix_after=(10, 45))

    # Step 13: Transfer diluted PCR1 to PCR2
    protocol.comment("Transferring diluted PCR1 to PCR2")
    transfer(p96, 5.0, pcr1_dilution_plate["A1"], pcr2_plate["A1"], mix_after=(10, 45))
    p96.return_tip()

    # Step 14: PCR2 thermal cycling
    protocol.comment("Starting PCR2 thermal cycling")
    thermocycler.close_lid()
    thermocycler.set_lid_temperature(105)
    # Initial denaturation
    thermocycler.execute_profile(
        steps=[{"temperature": 95, "hold_time_seconds": 180}], repetitions=1
    )

    # 12 cycles
    thermocycler.execute_profile(
        steps=[
            {"temperature": 95, "hold_time_seconds": 20},
            {"temperature": 72, "hold_time_seconds": 15},
        ],
        repetitions=12,
    )

    # Final extension
    thermocycler.execute_profile(
        steps=[
            {"temperature": 72, "hold_time_seconds": 300},
            {"temperature": 20, "hold_time_seconds": 60},
        ],
        repetitions=1,
    )

    thermocycler.open_lid()

    # Step 15: Move PCR2 plate
    protocol.comment("Moving PCR2 plate")
    protocol.move_labware(pcr1_dilution_plate, "A4", use_gripper=True)
    protocol.move_labware(pcr2_plate, reagent_block, use_gripper=True)

    # Steps 16-17: PCR2 dilution
    protocol.comment("Setting up PCR2 dilution")
    p96.pick_up_tip(tiprack_1["A1"])
    transfer(p96, 25, reservoir["A1"], pcr2_dilution_plate["A1"])
    transfer(p96, 5, pcr2_plate["A1"], pcr2_dilution_plate["A1"], mix_after=(10, 45))
    p96.return_tip()
    protocol.move_labware(reservoir, "C4", use_gripper=True)
    protocol.move_labware(eppendorf_384, "D2", use_gripper=True)

    # Step 18: Optional transfer to 384-well plate
    protocol.comment("Optional: Transferring to 384-well plate")
    p96.pick_up_tip(tiprack_1["A1"])
    for well_name in ["A1", "A2", "B1", "B2"]:
        transfer(p96, 15, pcr2_dilution_plate["A1"], eppendorf_384[well_name])
    p96.return_tip()

    # Final steps
    protocol.comment("Protocol complete through PCR2 dilution")
    protocol.comment(
        "Leave all labware on deck so the reverse protocol can reset the run."
    )

    # Deactivate temperature modules
    if deactivate_modules_bool:
        temp_module.deactivate()
        thermocycler.deactivate_lid()
        thermocycler.deactivate_block()
    # Pause for plate removal
    protocol.comment("Protocol complete!")
    protocol.capture_image(filename="end_of_run")
