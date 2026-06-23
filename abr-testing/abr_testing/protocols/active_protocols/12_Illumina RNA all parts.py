"""test."""

from opentrons.protocol_api import ProtocolContext, ParameterContext, OFF_DECK
from opentrons import types
from opentrons.protocol_api import ALL, Labware
from opentrons.protocol_api.module_contexts import (
    MagneticBlockContext,
    TemperatureModuleContext,
    ThermocyclerContext,
    FlexStackerContext,
)
from opentrons.hardware_control.modules.types import ThermocyclerStep
from typing import List

metadata = {
    "protocolName": "Illumina RNA Enrichment 96x Part 1-3 19MAY",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
}
requirements = {
    "robotType": "Flex",
    "apiLevel": "2.28",
}


def add_parameters(parameters: ParameterContext) -> None:
    """Parameters."""
    parameters.add_bool(
        display_name="Dry Run",
        variable_name="DRYRUN",
        default=False,
        description="Whether to perform a dry run or not.",
    )
    parameters.add_int(
        display_name="PCR Cycles",
        variable_name="PCRCYCLES",
        default=4,
        minimum=1,
        maximum=12,
        description="How many PCR Cycles to for amplification.",
    )
    parameters.add_str(
        display_name="Protocol Steps",
        variable_name="PROTOCOL_STEPS",
        default="All Steps",
        description="Protocol Steps",
        choices=[
            {"display_name": "All Steps", "value": "All Steps"},
            {"display_name": "cDNA and Library Prep", "value": "cDNA and Library Prep"},
            {"display_name": "Just cDNA", "value": "Just cDNA"},
            {"display_name": "Just Library Prep", "value": "Just Library Prep"},
            {
                "display_name": "Pooling and Hybridization",
                "value": "Pooling and Hybridization",
            },
            {"display_name": "Just Pooling", "value": "Just Pooling"},
            {"display_name": "Just Hybridization", "value": "Just Hybridization"},
            {"display_name": "Just Capture", "value": "Just Capture"},
        ],
    )
    parameters.add_bool(
        display_name="Temperature Module",
        variable_name="temperature_module",
        description="Use temperature module in protocol",
        default=True,
    )


def run(protocol: ProtocolContext) -> None:
    """Protocol."""

    protocol.capture_image(filename="start_of_run")

    protocol.comment("Protocol Version: 03")

    # ======================== DOWNLOADED PARAMETERS ========================
    global REUSE_ANY_50_TIPS  # T/F Whether or not Reusing any p50
    global REUSE_ANY_20_TIPS  # T/F Whether or not Reusing any p200
    global COLUMNS  # Number of Columns of Samples
    global PLATE_STACKED  # Number of Plates Stacked in Stacked Position
    global p50_TIPS  # Number of p50 tips currently available
    global p20_TIPS  # Number of p200 tips currently available
    global p50_RACK_COUNT  # Number of current total p50 racks
    global p20_RACK_COUNT  # Number of current total p200 racks
    global tiprack_20_STP  # Tiprack for p200 Single Tip Pickup
    global tiprack_20_STR  # Tiprack for p200 Single Tip Return
    global tiprack_50_STP  # Tiprack for p50 Single Tip Pickup
    global tiprack_50_STR  # Tiprack for p50 Single Tip Return
    global tiprack_50_R  # Tiprack for p50 Reuse
    global tiprack_20_R1  # Tiprack for p200 Reuse #1
    global tiprack_20_R2  # Tiprack for p200 Reuse #2
    global WASTEVOL  # Number - Total volume of Discarded Liquid Waste
    global ETOHVOL  # Number - Total volume of Available EtOH

    # ===========================================================
    # ====================================== INSTRUCTION FOR USE
    # ===========================================================
    # Change PROTOCOL_STEPS to appropriate sections to be tested, or 'All Steps'
    # Practically speaking it can be broken down to:
    # 'cDNA and Library Prep'
    # 'Pooling and Hybridization'
    # "Just Capture"
    # Set MODESPEED to "QUICK" if you want to skip single column for 96well plate, will assume
    # it did step and throw out the tiprack, do this for troubleshooting
    # Otherwise it'll do it and take a long time, but that's for ABR
    # into a deck slot on D3 and pause to manually remove it.
    # SCP_Position means Single Column Pickup Position, where 96ch can access single columns
    DRYRUN = True
    PROTOCOL_STEPS = "All Steps"
    MODESPEED = "NORMAL"  # QUICK or NORMAL
    MODETRASH = "RECYCLE"  # MANUAL or RECYCLE
    SCP_Position = "C2"
    if DRYRUN:
        HYBRIDTIME = 18.0
    else:
        HYBRIDTIME = 0.1
    HYBRID_PAUSE = False
    #   'All Steps'
    #   'cDNA and Library Prep'
    #   'Just cDNA'
    #   'Just Library Prep'
    #   'Pooling and Hybridization'
    #   'Pooling, Hybridization and Capture'
    #   'Just Pooling'
    #   'Just Hybridization'
    #   'Just Capture'

    # ===========================================================
    # ====================================== ADVANCED PARAMETERS
    # ===========================================================
    # -------PROTOCOL STEP-------
    if (
        PROTOCOL_STEPS == "All Steps"
        or PROTOCOL_STEPS == "Just cDNA"
        or PROTOCOL_STEPS == "cDNA and Library Prep"
    ):
        STEP_RNA = True  # Set to 0 to skip block of commands
        STEP_POSTRNA = True  # Set to 0 to skip block of commands
    else:
        STEP_RNA = False
        STEP_POSTRNA = False
    # ---------------------------
    if (
        PROTOCOL_STEPS == "All Steps"
        or PROTOCOL_STEPS == "Just Library Prep"
        or PROTOCOL_STEPS == "cDNA and Library Prep"
    ):
        STEP_TAG = True  # Set to 0 to skip block of commands
        STEP_WASH = True  # Set to 0 to skip block of commands
        STEP_CLEANUP_1 = True  # Set to 0 to skip block of commands
    else:
        STEP_TAG = False
        STEP_WASH = False
        STEP_CLEANUP_1 = False
    # ---------------------------
    if (
        PROTOCOL_STEPS == "All Steps"
        or PROTOCOL_STEPS == "Just Pooling"
        or PROTOCOL_STEPS == "Pooling and Hybridization"
        or PROTOCOL_STEPS == "Pooling, Hybridization and Capture"
    ):
        STEP_POOL = True  # Set to 0 to skip block of commands
    else:
        STEP_POOL = False
    # ---------------------------
    if (
        PROTOCOL_STEPS == "All Steps"
        or PROTOCOL_STEPS == "Just Hybridization"
        or PROTOCOL_STEPS == "Pooling and Hybridization"
        or PROTOCOL_STEPS == "Pooling, Hybridization and Capture"
    ):
        STEP_HYB = True  # Set to 0 to skip block of commands
    else:
        STEP_HYB = False
    # ---------------------------
    if (
        PROTOCOL_STEPS == "All Steps"
        or PROTOCOL_STEPS == "Just Capture"
        or PROTOCOL_STEPS == "Pooling, Hybridization and Capture"
    ):
        STEP_CAPTURE = True  # Set to 0 to skip block of commands
        STEP_PCR = True  # Set to 0 to skip block of commands
        STEP_CLEANUP_2 = True  # Set to 0 to skip block of commands
    else:
        STEP_CAPTURE = False
        STEP_PCR = False
        STEP_CLEANUP_2 = False
    # ---------------------------

    ONDECK_THERMO = True
    ONDECK_TEMP = protocol.params.temperature_module  # type: ignore[attr-defined]
    CUSTOM_OFFSETS = (
        False  # True:use per instrument specific offsets, False:Don't use offsets
    )

    # =============================== PIPETTE ===============================
    p200 = protocol.load_instrument("flex_96channel_200", "left")
    p200_flow_rate_aspirate_default = 20
    p200_flow_rate_dispense_default = 20
    p200_flow_rate_blow_out_default = 40
    p50_flow_rate_aspirate_default = 50
    p50_flow_rate_dispense_default = 50
    p50_flow_rate_blow_out_default = 100

    # ================================ LISTS ================================

    def nozzlecheck(nozzletype: str, tip_rack: Labware) -> None:
        """Configures Pipette - 96-channel only."""
        # Always use 96-channel (ALL) configuration - no column pickups allowed
        p200.configure_nozzle_layout(style=ALL, tip_racks=[tip_rack])

    # ========== FIRST ROW ===========
    try:
        if ONDECK_THERMO:
            thermocycler: ThermocyclerContext = protocol.load_module(
                "thermocycler module gen2"
            )  # type: ignore[assignment]
            sample_plate_1 = thermocycler.load_labware(
                "opentrons_96_wellplate_200ul_pcr_full_skirt", "Sample Plate 1"
            )
        else:
            sample_plate_1 = protocol.load_labware(
                "opentrons_96_wellplate_200ul_pcr_full_skirt", "A1", "Sample Plate 1"
            )
        # ================ Add the first labware in the position ================
        sample_plate_3 = protocol.load_labware(
            "opentrons_96_wellplate_200ul_pcr_full_skirt",
            "A2",
            "Sample Plate 2",
        )
        sample_plate_2 = sample_plate_3.load_labware(
            "opentrons_96_wellplate_200ul_pcr_full_skirt"
        )
        # =======================================================================
        # Stacker 1 (A4): Empty storage for used 200µL tipracks
        stacker_20_1: FlexStackerContext = protocol.load_module(
            "flexStackerModuleV1", "A4"
        )  # type: ignore[assignment]
        stacker_20_1.set_stored_labware(
            load_name="opentrons_flex_96_tiprack_20ul",
            count=0,  # Empty - reserved for storing used 200µL tipracks
        )
        tiprack_A3_adapter = protocol.load_adapter(
            "opentrons_flex_96_tiprack_adapter", "A3"
        )

        # SCP Position must always have a tiprack adapter
        tiprack_C2_adapter = protocol.load_adapter(
            "opentrons_flex_96_tiprack_adapter", SCP_Position
        )

        tiprack_20_1 = tiprack_A3_adapter.load_labware("opentrons_flex_96_tiprack_20ul")
        # ========== SECOND ROW ==========
        reagent_plate_2 = protocol.load_labware(
            "greiner_384_wellplate_240ul", "B2", "Reagent Plate 2"
        )
        # ================ Add the first labware in the position ================
        # Stacker 2 (B4): 200µL tips (active retrieval source)
        stacker_20_2: FlexStackerContext = protocol.load_module(
            "flexStackerModuleV1", "B4"
        )  # type: ignore[assignment]
        stacker_20_2.set_stored_labware(
            load_name="opentrons_flex_96_tiprack_20ul",
            count=6,  # Active retrieval source for 200µL tips (max capacity)
        )
        lids = protocol.load_lid_stack("opentrons_tough_pcr_auto_sealing_lid", "B3", 5)

        # ========== THIRD ROW ===========
        # Stacker 3 (C4): Empty storage for used 50µL tipracks
        stacker_50_1: FlexStackerContext = protocol.load_module(
            "flexStackerModuleV1", "C4"
        )  # type: ignore[assignment]
        stacker_50_1.set_stored_labware(
            load_name="opentrons_flex_96_tiprack_50ul",
            count=0,  # Empty - reserved for storing used 50µL tipracks
        )
        if ONDECK_TEMP:
            temp_block: TemperatureModuleContext = protocol.load_module(
                "temperature module gen2", "C1"
            )  # type: ignore[assignment]
            reagent_plate_1 = temp_block.load_labware(
                "greiner_384_wellplate_240ul", "Reagent Plate 1"
            )
        else:
            reagent_plate_1 = protocol.load_labware(
                "greiner_384_wellplate_240ul", "C1", "Reagent Plate 1"
            )
        tiprack_50_1 = tiprack_C2_adapter.load_labware("opentrons_flex_96_tiprack_50ul")

        ETOH_reservoir = protocol.load_labware(
            "nest_96_wellplate_2ml_deep", "C3", "ETOH Reservoir"
        )

        # ========== FOURTH ROW ==========
        # Stacker 4 (D4): 50µL tips (active retrieval source)
        stacker_50_2: FlexStackerContext = protocol.load_module(
            "flexStackerModuleV1", "D4"
        )  # type: ignore[assignment]
        stacker_50_2.set_stored_labware(
            load_name="opentrons_flex_96_tiprack_50ul",
            count=6,  # Active retrieval source for 50µL tips (max capacity)
        )
        TRASH = protocol.load_waste_chute()
        LW_reservoir = protocol.load_labware(
            "nest_96_wellplate_2ml_deep", "D1", "Liquid Waste Reservoir"
        )
        mag_block: MagneticBlockContext = protocol.load_module(
            "magneticBlockV1", "D2"
        )  # type: ignore[assignment]
        CleanupPlate_1 = mag_block.load_labware(
            "nest_96_wellplate_2ml_deep", "Cleanup Plate 1"
        )
        # CleanupPlate_2 loaded on deck position - stackers are for tipracks only
        CleanupPlate_2 = stacker_50_2.load_labware(
            "nest_96_wellplate_2ml_deep", "Cleanup Plate 2"
        )

        # ========================== REAGENT PLATE_1 ============================
        TAGMIX = reagent_plate_1["A1"]  # 96 Wells
        EPM_1 = reagent_plate_1["A1"]  # 96 Wells
        EPH3 = reagent_plate_1["A1"]  # 8 Wells
        FSMM = reagent_plate_1["A1"]  # 8 Wells
        # SSMM_1             = reagent_plate_1['A3'] # 8 Wells
        # SSMM_2             = reagent_plate_1['A4'] # 8 Wells
        TAGSTOP = reagent_plate_1["A1"]  # 8 Wells
        RSB_1 = reagent_plate_1["A1"]  # 8 Wells
        # RSB_2              = reagent_plate_1['A7'] # 8 Wells
        # RSB_3              = reagent_plate_1['A8'] # 8 Wells
        # RSB_4              = reagent_plate_1['A9'] # 8 Wells
        #                   = reagent_plate_1['A10'] # 8 Wells
        #                   = reagent_plate_1['A11'] # 8 Wells
        #                   = reagent_plate_1['A12'] # 8 Wells
        #                   = reagent_plate_1['A13'] # 8 Wells
        SMB_1 = reagent_plate_1["A1"]  # 8 Wells
        # SMB_2 = reagent_plate_1["A15"]  # 8 Wells
        # EEW_1 = reagent_plate_1["A16"]  # 8 Wells
        # EEW_2 = reagent_plate_1["A17"]  # 8 Wells
        NHB2 = reagent_plate_1["A1"]  # 8 Wells
        Panel = reagent_plate_1["A1"]  # 8 Wells
        ET2 = reagent_plate_1["A1"]  # 8 Wells
        EHB2 = reagent_plate_1["A1"]  # 8 Wells
        Elute = reagent_plate_1["A1"]  # 8 Wells
        PPC = reagent_plate_1["A1"]  # 8 Wells
        EPM_2 = reagent_plate_1["A1"]  # 8 Wells

        # ========================== REAGENT PLATE_2 ============================
        AMPure = reagent_plate_2["A1"]  # 96 Wells
        # TWB_1              = reagent_plate_2['A2'] # 96 Wells
        Barcodes = reagent_plate_2["A1"]  # 96 Wells
        # TWB_2              = reagent_plate_2['B2'] # 96 Wells

        # ============================ CUSTOM OFFSETS ===========================
        p20_in_Deep384_Z_offset = 9

        if CUSTOM_OFFSETS:
            PCRPlate_Z_offset = 0
            Deepwell_Z_offset = 0
            Deep384_Z_offset = 0
            # HEATERSHAKER OFFSETS
            # MAG BLOCK OFFSETS
            mb_drop_offset = {"x": 0, "y": 0.0, "z": 0}
            mb_pick_up_offset = {"x": 0, "y": 0, "z": 0}
            # THERMOCYCLER OFFSETS
            tc_pick_up_offset = {"x": 0, "y": 0, "z": 0}
            # DECK OFFSETS
            deck_drop_offset = {"x": 0, "y": 0, "z": 0}
            deck_pick_up_offset = {"x": 0, "y": 0, "z": 0}
        else:
            PCRPlate_Z_offset = 0
            Deepwell_Z_offset = 0
            Deep384_Z_offset = 0
            # HEATERSHAKER OFFSETS
            # MAG BLOCK OFFSETS
            mb_drop_offset = {"x": 0, "y": 0.0, "z": 0}
            mb_pick_up_offset = {"x": 0, "y": 0, "z": 0}
            # THERMOCYCLER OFFSETS
            tc_pick_up_offset = {"x": 0, "y": 0, "z": 0}
            # DECK OFFSETS
            deck_drop_offset = {"x": 0, "y": 0, "z": 0}
            deck_pick_up_offset = {"x": 0, "y": 0, "z": 0}

        # ========================================================
        # ========================================= PROTOCOL START
        # ========================================================
        if ONDECK_THERMO:
            thermocycler.open_lid()
        if ONDECK_TEMP:
            temp_block.set_temperature(4)
        # =========================================================
        # ========================================= PROTOCOL START
        # =========================================================

        if STEP_RNA:
            protocol.comment("==============================================")
            protocol.comment("--> Aliquoting EPH3")
            protocol.comment("==============================================")

            if MODESPEED != "QUICK":
                protocol.comment("--> Adding EPH3")
                EPH3Vol = 8.5
                EPH3MixRep = 5 if DRYRUN == "NO" else 1
                EPH3MixVol = 20
                p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
                p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
                p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
                nozzlecheck("96", tiprack_50_1)
                # ===============================================
                p200.pick_up_tip()
                p200.aspirate(EPH3Vol, EPH3.bottom(z=Deep384_Z_offset + 1))
                p200.dispense(EPH3Vol, sample_plate_1["A1"].bottom(z=PCRPlate_Z_offset))
                p200.move_to(sample_plate_1["A1"].bottom(z=1))
                p200.mix(EPH3MixRep, EPH3MixVol)
                p200.blow_out(sample_plate_1["A1"].top(z=-5))
                p200.return_tip()
                # ===============================================

            protocol.comment(
                "MOVING: Plate Lid #1 = Plate Lid Stack --> sample_plate_1"
            )
            protocol.move_lid(lids, sample_plate_1, use_gripper=True)

            if ONDECK_THERMO:
                thermocycler.close_lid()
            if ONDECK_THERMO:
                thermocycler.open_lid()
            protocol.comment("MOVING: Plate Lid #1 = sample_plate_1 --> lids[1]")
            protocol.move_lid(sample_plate_1, lids, use_gripper=True)

            protocol.comment("==============================================")
            protocol.comment("--> Aliquoting FSMM")
            protocol.comment("==============================================")

            # ============================================================================================
            if MODETRASH == "RECYCLE":
                protocol.comment("MOVING: tiprack_50_1 = SCP_Position --> Stacker 50|C")
                protocol.move_labware(
                    labware=tiprack_50_1,
                    new_location=stacker_50_1,
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.comment("storing tiprack in C4")
                stacker_50_1.store()
            else:
                protocol.comment("MOVING: tiprack_50_1 = SCP_Position --> B3")
                protocol.move_labware(
                    labware=tiprack_50_1,
                    new_location="B3",
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.move_labware(
                    labware=tiprack_50_1,
                    new_location=OFF_DECK,
                    use_gripper=False,
                )
            protocol.comment("MOVING: tiprack_50_2 = D4 --> SCP_Position")
            protocol.move_labware(CleanupPlate_2, stacker_20_2, use_gripper=True)
            tiprack_50_2 = stacker_50_2.retrieve()
            protocol.move_labware(
                labware=tiprack_50_2,
                new_location=tiprack_C2_adapter,
                use_gripper=True,
                pick_up_offset=deck_pick_up_offset,
                drop_offset=deck_drop_offset,
            )
            # ============================================================================================

            if MODESPEED != "QUICK":
                protocol.comment("--> Adding FSMM")
                FSMMVol = 8
                FSMMMixRep = 5 if DRYRUN == "NO" else 1
                FSMMMixVol = 20
                p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
                p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
                p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
                nozzlecheck("96", tiprack_50_2)
                # ===============================================
                # 96-channel operation - process entire plate at once
                p200.pick_up_tip()
                p200.aspirate(FSMMVol, FSMM.bottom(z=Deep384_Z_offset))
                p200.dispense(
                    FSMMVol, sample_plate_1["A1"].bottom(z=PCRPlate_Z_offset + 1)
                )
                p200.move_to(sample_plate_1["A1"].bottom(z=PCRPlate_Z_offset + 1))
                p200.mix(FSMMMixRep, FSMMMixVol)
                p200.blow_out(sample_plate_1["A1"].top(z=-5))
                # Return tips to origin tiprack instead of dropping
                p200.return_tip()
                # ===============================================

            protocol.comment("MOVING: Plate Lid #1 = lids[1] --> sample_plate_1")
            protocol.move_lid(lids, sample_plate_1, use_gripper=True)
            if ONDECK_THERMO:
                thermocycler.close_lid()
            #
            if ONDECK_THERMO:
                thermocycler.open_lid()
            protocol.comment("MOVING: Plate Lid #1 = sample_plate_1 --> lids[1]")
            protocol.move_lid(sample_plate_1, lids, use_gripper=True)

            protocol.comment("==============================================")
            protocol.comment("--> Aliquoting SSMM")
            protocol.comment("==============================================")

            # ============================================================================================
            if MODETRASH == "RECYCLE":
                protocol.comment("MOVING: tiprack_50_2 = SCP_Position --> Stacker 50|C")
                protocol.move_labware(
                    labware=tiprack_50_2,
                    new_location=stacker_50_1,
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.comment("storing tiprack in C4")
                stacker_50_1.store()
            else:
                protocol.comment("MOVING: tiprack_50_2 = SCP_Position --> B3")
                protocol.move_labware(
                    labware=tiprack_50_2,
                    new_location="B3",
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.move_labware(
                    labware=tiprack_50_2,
                    new_location=OFF_DECK,
                    use_gripper=False,
                )
            protocol.comment("DISPENSING: tiprack_50_3 = #1--> D4")
            tiprack_50_3 = stacker_50_2.retrieve()
            protocol.comment("MOVING: tiprack_50_3 = D4 --> SCP_Position")
            protocol.move_labware(
                labware=tiprack_50_3,
                new_location=tiprack_C2_adapter,
                use_gripper=True,
                pick_up_offset=deck_pick_up_offset,
                drop_offset=deck_drop_offset,
            )
            # ============================================================================================

            if MODESPEED != "QUICK":
                protocol.comment("--> Adding SSMM")
                SSMMVol = 24
                SSMMMixRep = 5 if DRYRUN == "NO" else 1
                SSMMMixVol = 50
                p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
                p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
                p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
                nozzlecheck("96", tiprack_50_3)
                # ===============================================
                # 96-channel operation - multi-well aspiration for sufficient volume
                p200.pick_up_tip()
                # Aspirate from multiple SSMM wells to get sufficient volume (A3, A4)
                p200.aspirate(
                    SSMMVol // 2,
                    reagent_plate_1.wells_by_name()["A1"].bottom(
                        z=Deep384_Z_offset + 1
                    ),
                )
                p200.aspirate(
                    SSMMVol // 2,
                    reagent_plate_1.wells_by_name()["A1"].bottom(
                        z=Deep384_Z_offset + 1
                    ),
                )
                p200.dispense(
                    SSMMVol, sample_plate_1["A1"].bottom(z=PCRPlate_Z_offset + 1)
                )
                p200.move_to(sample_plate_1["A1"].bottom(z=PCRPlate_Z_offset + 1))
                p200.mix(SSMMMixRep, SSMMMixVol)
                p200.blow_out(sample_plate_1["A1"].top(z=-5))
                # Return tips to origin tiprack instead of dropping
                p200.return_tip()
                # ===============================================

            protocol.comment("MOVING: Plate Lid #1 = lids[1] --> sample_plate_1")
            protocol.move_lid(lids, sample_plate_1, use_gripper=True)
            if ONDECK_THERMO:
                thermocycler.close_lid()
            #
            if ONDECK_THERMO:
                thermocycler.open_lid()
            protocol.comment("MOVING: Plate Lid #1 = sample_plate_1 --> TRASH")
            protocol.move_lid(sample_plate_1, TRASH, use_gripper=True)

        if STEP_POSTRNA:
            protocol.comment("==============================================")
            protocol.comment("--> Post RNA Cleanup")
            protocol.comment("==============================================")

            # =========================================CleanupPlate_1=================
            if MODETRASH == "RECYCLE":
                protocol.comment("MOVING: tiprack_50_3 = SCP_Position --> Stacker 50|C")
                protocol.move_labware(
                    labware=tiprack_50_3,
                    new_location=stacker_50_1,
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.comment("storing tiprack in C4")
                stacker_50_1.store()
            else:
                protocol.comment("MOVING: tiprack_50_3 = SCP_Position --> B3")
                protocol.move_labware(
                    labware=tiprack_50_3,
                    new_location="B3",
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.move_labware(
                    labware=tiprack_50_3,
                    new_location=OFF_DECK,
                    use_gripper=False,
                )
            protocol.comment("MOVING: CleanupPlate_1 = mag_block --> D4")
            protocol.move_labware(
                labware=CleanupPlate_1,
                new_location=stacker_50_2,
                use_gripper=True,
                pick_up_offset=deck_pick_up_offset,
                drop_offset=deck_drop_offset,
            )
            # ============================================================================================

            # ============================================================================================
            protocol.comment("--> ADDING AMPure (0.8x)")
            AMPureVol = 10.0
            SampleVol = 10.0
            AMPurePremix = 3 if DRYRUN is False else 1
            p200.flow_rate.aspirate = p200_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p200_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p200_flow_rate_blow_out_default * 0.5
            nozzlecheck("96", tiprack_20_1)
            # ===============================================
            p200.pick_up_tip()
            p200.move_to(AMPure.bottom(z=Deep384_Z_offset + p20_in_Deep384_Z_offset))
            p200.mix(3, AMPureVol)
            p200.aspirate(
                AMPureVol, AMPure.bottom(z=Deep384_Z_offset + p20_in_Deep384_Z_offset)
            )
            p200.dispense(
                AMPureVol, sample_plate_1["A1"].bottom(z=PCRPlate_Z_offset + 0.75)
            )
            # ========PIPETTE MIXING==========
            p200.move_to(sample_plate_1["A1"].bottom(z=PCRPlate_Z_offset + 0.75))
            p200.mix(10, AMPureVol)
            # ================================
            protocol.delay(seconds=0.2)
            p200.blow_out(sample_plate_1["A1"].top(z=-2))
            p200.return_tip()
            # ===============================================

            # ============================================================================================
            protocol.comment("MOVING: sample_plate_1 = thermocycler --> mag_block")
            protocol.move_labware(
                labware=sample_plate_1,
                new_location=mag_block,
                use_gripper=True,
                pick_up_offset=deck_pick_up_offset,
                drop_offset=deck_drop_offset,
            )
            if MODETRASH == "RECYCLE":
                protocol.comment(
                    "MOVING: tiprack_20_1 = tiprack_A3_adapter --> Stacker 200|A"
                )
                protocol.move_labware(
                    labware=tiprack_20_1,
                    new_location=stacker_20_1,
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.comment("storing tiprack in A4")
                stacker_20_1.store()
            else:
                protocol.comment("MOVING: tiprack_20_1 = tiprack_A3_adapter --> B3")
                protocol.move_labware(
                    labware=tiprack_20_1,
                    new_location="B3",
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.move_labware(
                    labware=tiprack_20_1,
                    new_location=OFF_DECK,
                    use_gripper=False,
                )
            protocol.comment("MOVING: tiprack_20_2 = A4 --> tiprack_A3_adapter")
            protocol.move_labware(CleanupPlate_2, stacker_50_1, use_gripper=True)
            tiprack_20_2 = stacker_20_2.retrieve()
            protocol.move_labware(
                labware=tiprack_20_2,
                new_location=tiprack_A3_adapter,
                use_gripper=True,
                pick_up_offset=deck_pick_up_offset,
                drop_offset=deck_drop_offset,
            )
            # ============================================================================================

            protocol.comment("--> Removing Supernatant 1A")
            RemoveSup = 15.0
            nozzlecheck("96", tiprack_20_2)
            # ===============================================
            p200.pick_up_tip()
            p200.aspirate(
                RemoveSup, sample_plate_1["A1"].bottom(z=PCRPlate_Z_offset + 2)
            )
            protocol.delay(minutes=0.1)
            p200.aspirate(3, sample_plate_1["A1"].bottom(z=PCRPlate_Z_offset))
            p200.default_speed = 5
            p200.move_to(sample_plate_1["A1"].top(z=2))
            p200.default_speed = 200
            p200.dispense(RemoveSup, LW_reservoir["A1"].top(z=Deepwell_Z_offset))
            protocol.delay(minutes=0.1)
            p200.blow_out()
            p200.default_speed = 400
            p200.move_to(LW_reservoir["A1"].top(z=-5))
            p200.move_to(LW_reservoir["A1"].top(z=0))
            p200.return_tip()
            # ===============================================

            # ============================================================================================
            if MODETRASH == "RECYCLE":
                protocol.comment(
                    "MOVING: tiprack_20_2 = tiprack_A3_adapter --> stacker 200|A"
                )
                protocol.move_labware(
                    labware=tiprack_20_2,
                    new_location=stacker_20_1,
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.comment("storing tiprack in A4")
                stacker_20_1.store()
            else:
                protocol.comment("MOVING: tiprack_20_2 = tiprack_A3_adapter --> B3")
                protocol.move_labware(
                    labware=tiprack_20_2,
                    new_location="B3",
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.move_labware(
                    labware=tiprack_20_2,
                    new_location=OFF_DECK,
                    use_gripper=False,
                )
            protocol.comment("MOVING: tiprack_20_X = B4 --> SCP_Position")
            tiprack_20_X = stacker_20_2.retrieve()
            protocol.move_labware(
                labware=tiprack_20_X,
                new_location=tiprack_C2_adapter,
                use_gripper=True,
                pick_up_offset=deck_pick_up_offset,
                drop_offset=deck_drop_offset,
            )
            # ============================================================================================

            protocol.comment("--> ETOH Wash 1A")
            ETOHMaxVol = 12.0
            p200.flow_rate.aspirate = p200_flow_rate_aspirate_default
            p200.flow_rate.dispense = p200_flow_rate_dispense_default
            p200.flow_rate.blow_out = p200_flow_rate_blow_out_default
            nozzlecheck("96", tiprack_20_X)
            # ===============================================
            p200.pick_up_tip()
            p200.aspirate(
                ETOHMaxVol, ETOH_reservoir["A1"].bottom(z=Deepwell_Z_offset + 1)
            )
            p200.move_to(ETOH_reservoir["A1"].top(z=0))
            p200.move_to(ETOH_reservoir["A1"].top(z=-5))
            p200.move_to(ETOH_reservoir["A1"].top(z=0))
            p200.move_to(sample_plate_1["A1"].top(z=-2))
            p200.dispense(ETOHMaxVol, rate=1)
            protocol.delay(minutes=0.1)
            p200.blow_out()
            p200.move_to(sample_plate_1["A1"].top(z=5))
            p200.move_to(sample_plate_1["A1"].top(z=0))
            p200.move_to(sample_plate_1["A1"].top(z=5))
            p200.return_tip()
            # ===============================================

            # ============================================================================================
            protocol.comment("DISPENSING: tiprack_20_3 = #2--> A4")
            protocol.comment("MOVING: tiprack_20_3 = A4 --> tiprack_A3_adapter")
            tiprack_20_3 = stacker_20_2.retrieve()
            protocol.move_labware(
                labware=tiprack_20_3,
                new_location=tiprack_A3_adapter,
                use_gripper=True,
                pick_up_offset=deck_pick_up_offset,
                drop_offset=deck_drop_offset,
            )
            # ============================================================================================

            protocol.comment("--> Removing Supernatant 1B")
            RemoveSup = 19.5
            p200.flow_rate.aspirate = p200_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p200_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p200_flow_rate_blow_out_default * 0.5
            nozzlecheck("96", tiprack_20_3)
            # ===============================================
            p200.pick_up_tip()
            p200.aspirate(5, sample_plate_1["A1"].bottom(z=PCRPlate_Z_offset + 2))
            protocol.delay(minutes=0.1)
            p200.aspirate(5, sample_plate_1["A1"].bottom(z=PCRPlate_Z_offset))
            p200.default_speed = 5
            p200.move_to(sample_plate_1["A1"].top(z=2))
            p200.default_speed = 200
            p200.dispense(5, LW_reservoir["A1"].top(z=Deepwell_Z_offset))
            protocol.delay(minutes=0.1)
            p200.blow_out()
            p200.default_speed = 400
            p200.move_to(LW_reservoir["A1"].top(z=-5))
            p200.move_to(LW_reservoir["A1"].top(z=0))
            p200.return_tip()
            # ===============================================

            protocol.comment("--> ETOH Wash 1B")
            ETOHMaxVol = 12
            p200.flow_rate.aspirate = p200_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p200_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p200_flow_rate_blow_out_default * 0.5
            nozzlecheck("96", tiprack_20_X)
            # ===============================================
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.aspirate(
                ETOHMaxVol, ETOH_reservoir["A1"].bottom(z=Deepwell_Z_offset + 1)
            )
            p200.move_to(ETOH_reservoir["A1"].top(z=0))
            p200.move_to(ETOH_reservoir["A1"].top(z=-5))
            p200.move_to(ETOH_reservoir["A1"].top(z=0))
            p200.move_to(sample_plate_1["A1"].top(z=-2))
            p200.dispense(ETOHMaxVol, rate=1)
            protocol.delay(minutes=0.1)
            p200.blow_out()
            p200.move_to(sample_plate_1["A1"].top(z=5))
            p200.move_to(sample_plate_1["A1"].top(z=0))
            p200.move_to(sample_plate_1["A1"].top(z=5))
            p200.return_tip()
            # ===============================================

            # ============================================================================================
            if MODETRASH == "RECYCLE":
                protocol.comment(
                    "MOVING: tiprack_20_3 = tiprack_A3_adapter --> stacker 200|A"
                )
                protocol.move_labware(
                    labware=tiprack_20_3,
                    new_location=stacker_20_1,
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.comment("storing tiprack in A4")
                stacker_20_1.store()
            else:
                protocol.comment("MOVING: tiprack_20_3 = tiprack_A3_adapter --> B3")
                protocol.move_labware(
                    labware=tiprack_20_3,
                    new_location="B3",
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
            protocol.comment("DISPENSING: tiprack_20_4 = #3--> A4")
            tiprack_20_4 = stacker_20_2.retrieve()
            protocol.comment("MOVING: tiprack_20_4 = A4 --> tiprack_A3_adapter")
            protocol.move_labware(
                labware=tiprack_20_4,
                new_location=tiprack_A3_adapter,
                use_gripper=True,
            )
            # ============================================================================================

            protocol.comment("--> Removing Supernatant 1C")
            RemoveSup = 10
            p200.flow_rate.aspirate = p200_flow_rate_aspirate_default
            p200.flow_rate.dispense = p200_flow_rate_dispense_default
            p200.flow_rate.blow_out = p200_flow_rate_blow_out_default
            nozzlecheck("96", tiprack_20_4)
            # ===============================================
            p200.pick_up_tip()
            p200.aspirate(
                RemoveSup, sample_plate_1["A1"].bottom(z=PCRPlate_Z_offset + 2)
            )
            protocol.delay(minutes=0.1)
            p200.aspirate(RemoveSup, sample_plate_1["A1"].bottom(z=PCRPlate_Z_offset))
            p200.default_speed = 5
            p200.move_to(sample_plate_1["A1"].top(z=2))
            p200.default_speed = 200
            p200.dispense(RemoveSup, LW_reservoir["A1"].top(z=Deepwell_Z_offset))
            protocol.delay(minutes=0.1)
            p200.blow_out()
            p200.default_speed = 400
            p200.move_to(LW_reservoir["A1"].top(z=-5))
            p200.move_to(LW_reservoir["A1"].top(z=0))
            p200.return_tip()
            # ===============================================

            # ============================================================================================
            if MODETRASH == "RECYCLE":
                protocol.comment(
                    "MOVING: tiprack_20_4 = tiprack_A3_adapter --> stacker 200|A"
                )
                protocol.move_labware(
                    labware=tiprack_20_4,
                    new_location=stacker_20_1,
                    use_gripper=True,
                )
                protocol.comment("storing tiprack in A4")
                stacker_20_1.store()
            else:
                protocol.comment("MOVING: tiprack_20_4 = tiprack_A3_adapter --> B3")
                protocol.move_labware(
                    labware=tiprack_20_4,
                    new_location="B3",
                    use_gripper=True,
                )
                protocol.move_labware(
                    labware=tiprack_20_4,
                    new_location=OFF_DECK,
                    use_gripper=False,
                )
            protocol.comment("MOVING: CleanupPlate_1 = D4 --> A4")
            protocol.move_labware(
                labware=CleanupPlate_1, new_location=stacker_20_1, use_gripper=True
            )
            protocol.comment("MOVING: tiprack_20_X = SCP_Position --> A3")
            protocol.move_labware(
                labware=tiprack_20_X,
                new_location=tiprack_A3_adapter,
                use_gripper=True,
            )

            protocol.comment("DISPENSING: tiprack_50_4 = #3--> D4")
            tiprack_50_4 = stacker_50_2.retrieve()
            protocol.comment("MOVING: tiprack_50_4 = D4 --> tiprack_A3_adapter")
            protocol.move_labware(
                labware=tiprack_50_4, new_location=tiprack_C2_adapter, use_gripper=True
            )
            # ============================================================================================

            if MODESPEED != "QUICK":
                protocol.comment("--> Adding RSB")
                RSBVol = 32
                p200.flow_rate.aspirate = p200_flow_rate_aspirate_default
                p200.flow_rate.dispense = p200_flow_rate_dispense_default
                p200.flow_rate.blow_out = p200_flow_rate_blow_out_default
                nozzlecheck("96", tiprack_50_4)
                # ===============================================
                # 96-channel operation - multi-well aspiration for sufficient volume
                p200.pick_up_tip()
                # Aspirate from multiple RSB wells to get sufficient volume (A6, A7, A8)
                p200.aspirate(
                    RSBVol // 3,
                    reagent_plate_1.wells_by_name()["A1"].bottom(z=Deep384_Z_offset),
                )
                p200.aspirate(
                    RSBVol // 3,
                    reagent_plate_1.wells_by_name()["A1"].bottom(z=Deep384_Z_offset),
                )
                p200.aspirate(
                    RSBVol - (2 * (RSBVol // 3)),  # Handle remainder
                    reagent_plate_1.wells_by_name()["A1"].bottom(z=Deep384_Z_offset),
                )
                p200.dispense(RSBVol, sample_plate_1["A1"].bottom(z=PCRPlate_Z_offset))
                # ========PIPETTE MIXING==========
                p200.move_to(sample_plate_1["A1"].bottom(z=PCRPlate_Z_offset + 0.75))
                p200.mix(10, AMPureVol)
                # ================================
                # Return tips to origin tiprack instead of dropping
                p200.return_tip()
                # ===============================================

            # ============================================================================================
            if MODETRASH == "RECYCLE":
                protocol.comment(
                    "MOVING: tiprack_50_4 = tiprack_A3_adapter --> stacker 50|C"
                )
                protocol.move_labware(CleanupPlate_2, stacker_20_2, use_gripper=True)
                protocol.move_labware(
                    labware=tiprack_50_4,
                    new_location=stacker_50_1,
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.comment("storing tiprack in C4")
                stacker_50_1.store()
            else:
                protocol.comment("MOVING: tiprack_50_4 = tiprack_A3_adapter --> B3")
                protocol.move_labware(
                    labware=tiprack_50_4,
                    new_location="B3",
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
            protocol.comment("MOVING: tiprack_20_X = B4 --> SCP_Position")
            protocol.move_labware(
                labware=tiprack_20_X,
                new_location=tiprack_C2_adapter,
                use_gripper=True,
                pick_up_offset=deck_pick_up_offset,
                drop_offset=deck_drop_offset,
            )
            protocol.comment("DISPENSING: tiprack_50_5 = #4--> D4")
            tiprack_50_5 = stacker_50_2.retrieve()
            protocol.comment("MOVING: tiprack_50_5 = D4 --> tiprack_A3_adapter")
            protocol.move_labware(
                labware=tiprack_50_5,
                new_location=tiprack_A3_adapter,
                use_gripper=True,
            )
            protocol.comment("UNSTACKING: sample_plate_2 = --> A2")
            protocol.comment("MOVING: sample_plate_2 = A2 --> thermocycler")
            if ONDECK_THERMO:
                protocol.move_labware(
                    labware=sample_plate_2,
                    new_location=thermocycler,
                    use_gripper=True,
                )
            else:
                protocol.move_labware(
                    labware=sample_plate_2,
                    new_location="B1",
                    use_gripper=True,
                )
            # ============================================================================================

        if STEP_TAG:
            protocol.comment("==============================================")
            protocol.comment("--> Tagment")
            protocol.comment("==============================================")

            protocol.comment("--> ADDING TAGMIX")
            TagVol = 20
            TransferSup = 30
            p200.flow_rate.aspirate = p200_flow_rate_aspirate_default
            p200.flow_rate.dispense = p200_flow_rate_dispense_default
            p200.flow_rate.blow_out = p200_flow_rate_blow_out_default
            nozzlecheck("96", tiprack_50_5)
            # ===============================================
            p200.pick_up_tip()
            p200.aspirate(TagVol, TAGMIX.bottom(z=Deep384_Z_offset))
            p200.dispense(TagVol, sample_plate_2["A1"].bottom(z=PCRPlate_Z_offset))
            p200.aspirate(TransferSup, sample_plate_1["A1"].bottom(z=PCRPlate_Z_offset))
            p200.dispense(TransferSup, sample_plate_2["A1"].bottom(z=PCRPlate_Z_offset))
            p200.return_tip()
            # ===============================================

            protocol.comment(
                "MOVING: Plate Lid #1 = Plate Lid Stack --> sample_plate_1"
            )
            protocol.move_lid(lids, sample_plate_2, use_gripper=True)
            if ONDECK_THERMO:
                thermocycler.close_lid()
            #
            if ONDECK_THERMO:
                thermocycler.open_lid()
            protocol.comment("MOVING: Plate Lid #1 = sample_plate_1 --> lids[2]")
            protocol.move_lid(sample_plate_2, lids, use_gripper=True)

            # ============================================================================================
            if MODETRASH == "RECYCLE":
                protocol.comment("MOVING: sample_plate_1 = mag_block --> TRASH")
                protocol.move_labware(
                    labware=sample_plate_1,
                    new_location=TRASH,
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
            else:
                protocol.comment("MOVING: sample_plate_1 = mag_block --> B3")
                protocol.move_labware(
                    labware=sample_plate_1,
                    new_location="B3",
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.move_labware(
                    labware=sample_plate_1,
                    new_location=OFF_DECK,
                    use_gripper=False,
                )
            if MODETRASH == "RECYCLE":
                protocol.comment(
                    "MOVING: tiprack_50_5 = tiprack_A3_adapter --> stacker 50|C"
                )
                protocol.move_labware(
                    labware=tiprack_50_5,
                    new_location=stacker_50_1,
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.comment("storing tiprack in C4")
                stacker_50_1.store()
            else:
                protocol.comment("MOVING: tiprack_50_5 = tiprack_A3_adapter --> B3")
                protocol.move_labware(
                    labware=tiprack_50_5,
                    new_location="B3",
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
            protocol.comment(
                "MOVING: tiprack_20_X = SCP_Position --> tiprack_A3_adapter"
            )

            protocol.move_labware(
                labware=tiprack_20_X,
                new_location=tiprack_A3_adapter,
                use_gripper=True,
            )
            protocol.comment("DISPENSING: tiprack_50_6 = #4--> D4")
            tiprack_50_6 = stacker_50_2.retrieve()
            protocol.comment("MOVING: tiprack_50_6 = D4 --> SCP_Position")
            protocol.move_labware(
                labware=tiprack_50_6,
                new_location=tiprack_C2_adapter,
                use_gripper=True,
            )
            # ============================================================================================

            if MODESPEED != "QUICK":
                protocol.comment("--> Adding TAGSTOP")
                TAGSTOPVol = 10
                p200.flow_rate.aspirate = p200_flow_rate_aspirate_default * 0.5
                p200.flow_rate.dispense = p200_flow_rate_dispense_default * 0.5
                p200.flow_rate.blow_out = p200_flow_rate_blow_out_default * 0.5
                nozzlecheck("96", tiprack_50_6)
                # ===============================================
                # 96-channel operation - process entire plate at once
                p200.pick_up_tip()
                p200.aspirate(TAGSTOPVol, TAGSTOP.bottom(z=PCRPlate_Z_offset))
                p200.dispense(
                    TAGSTOPVol, sample_plate_2["A1"].bottom(z=PCRPlate_Z_offset)
                )
                # Return tips to origin tiprack instead of dropping
                p200.return_tip()
                # ===============================================

            protocol.comment(
                "MOVING: Plate Lid #1 = Plate Lid Stack --> sample_plate_2"
            )
            protocol.move_lid(lids, sample_plate_2, use_gripper=True)
            if ONDECK_THERMO:
                thermocycler.close_lid()
            #
            if ONDECK_THERMO:
                thermocycler.open_lid()
            protocol.comment("MOVING: Plate Lid #1 = sample_plate_2 --> lids[2]")
            protocol.move_lid(sample_plate_2, lids, use_gripper=True)

        if STEP_WASH:
            protocol.comment("==============================================")
            protocol.comment("--> Wash")
            protocol.comment("==============================================")

            # =======================================================================
            protocol.comment("MOVING: sample_plate_2 = thermocycler --> mag_block")
            protocol.move_labware(
                labware=sample_plate_2,
                new_location=mag_block,
                use_gripper=True,
                pick_up_offset=tc_pick_up_offset,
                drop_offset=mb_drop_offset,
            )
            if MODETRASH == "RECYCLE":
                protocol.comment("MOVING: tiprack_50_6 = SCP_Position --> Stacker 50|C")
                protocol.move_labware(
                    labware=tiprack_50_6,
                    new_location=stacker_50_1,
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.comment("storing tiprack in C4")
                stacker_50_1.store()
            else:
                protocol.comment("MOVING: tiprack_50_6 = SCP_Position --> B3")
                protocol.move_labware(
                    labware=tiprack_50_6,
                    new_location="B3",
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.move_labware(
                    labware=tiprack_50_6,
                    new_location=OFF_DECK,
                    use_gripper=False,
                )
            protocol.comment(
                "MOVING: tiprack_20_X = tiprack_A3_adapter --> SCP_Position"
            )
            protocol.move_labware(
                labware=tiprack_20_X,
                new_location=tiprack_C2_adapter,
                use_gripper=True,
                pick_up_offset=deck_pick_up_offset,
                drop_offset=deck_drop_offset,
            )
            protocol.comment("MOVING: CleanupPlate_1 = A4 --> D4")
            protocol.move_labware(
                labware=CleanupPlate_1,
                new_location=stacker_50_2,
                use_gripper=True,
                pick_up_offset=deck_pick_up_offset,
                drop_offset=deck_drop_offset,
            )
            protocol.comment("DISPENSING: tiprack_20_5 = #3--> A4")
            protocol.move_labware(CleanupPlate_2, stacker_50_1, use_gripper=True)
            tiprack_20_5 = stacker_20_2.retrieve()
            protocol.move_labware(
                labware=tiprack_20_5,
                new_location=tiprack_A3_adapter,
                use_gripper=True,
                pick_up_offset=deck_pick_up_offset,
                drop_offset=deck_drop_offset,
            )
            # ============================================================================================

            protocol.comment("--> Removing Supernatant")
            RemoveSup = 10
            p200.flow_rate.aspirate = p200_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p200_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p200_flow_rate_blow_out_default * 0.5
            nozzlecheck("96", tiprack_20_5)
            # ===============================================
            p200.pick_up_tip()
            p200.aspirate(RemoveSup, sample_plate_2["A1"].bottom(z=PCRPlate_Z_offset))
            p200.dispense(RemoveSup, LW_reservoir["A1"].top(z=Deepwell_Z_offset))
            p200.return_tip()
            # ===============================================

            protocol.comment("--> Wash 1")
            p200.flow_rate.aspirate = p200_flow_rate_aspirate_default
            p200.flow_rate.dispense = p200_flow_rate_dispense_default
            p200.flow_rate.blow_out = p200_flow_rate_blow_out_default
            nozzlecheck("96", tiprack_20_X)
            # ===============================================
            # 96-channel operation - multi-well aspiration for sufficient volume
            p200.reset_tipracks()
            p200.pick_up_tip()
            # Aspirate from multiple TWB wells to get sufficient volume (A2, B2)
            p200.aspirate(
                1,
                reagent_plate_2.wells_by_name()["A1"].bottom(
                    z=Deep384_Z_offset + p20_in_Deep384_Z_offset
                ),
            )
            p200.aspirate(
                1,
                reagent_plate_2.wells_by_name()["A1"].bottom(
                    z=Deep384_Z_offset + p20_in_Deep384_Z_offset
                ),
            )
            p200.dispense(2, sample_plate_2["A1"].bottom(z=PCRPlate_Z_offset))
            # Return tips to origin tiprack instead of dropping
            p200.return_tip()
            # ===============================================

            # ============================================================================================
            if MODETRASH == "RECYCLE":
                protocol.comment(
                    "MOVING: tiprack_20_5 = tiprack_A3_adapter --> stacker 200|A"
                )
                protocol.move_labware(
                    labware=tiprack_20_5,
                    new_location=stacker_20_1,
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.comment("storing tiprack in A4")
                stacker_20_1.store()
            else:
                protocol.comment("MOVING: tiprack_20_5 = tiprack_A3_adapter --> B3")
                protocol.move_labware(
                    labware=tiprack_20_5,
                    new_location="B3",
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.move_labware(
                    labware=tiprack_20_5,
                    new_location=OFF_DECK,
                    use_gripper=False,
                )
            protocol.comment("DISPENSING: tiprack_20_6 = #4--> A4")
            tiprack_20_6 = stacker_20_2.retrieve()
            protocol.move_labware(
                labware=tiprack_20_6,
                new_location=tiprack_A3_adapter,
                use_gripper=True,
                pick_up_offset=deck_pick_up_offset,
                drop_offset=deck_drop_offset,
            )
            # stacker B empty
            # Stacker A full

            # ============================================================================================

            protocol.comment("--> Removing Supernatant")
            RemoveSup = 12
            p200.flow_rate.aspirate = p200_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p200_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p200_flow_rate_blow_out_default * 0.5
            nozzlecheck("96", tiprack_20_6)
            # ===============================================
            p200.pick_up_tip()
            p200.aspirate(RemoveSup, sample_plate_2["A1"].bottom(z=PCRPlate_Z_offset))
            p200.dispense(RemoveSup, LW_reservoir["A1"].top(z=Deepwell_Z_offset))
            p200.return_tip()
            # ===============================================

            protocol.comment("--> Wash 2")
            p200.flow_rate.aspirate = p200_flow_rate_aspirate_default
            p200.flow_rate.dispense = p200_flow_rate_dispense_default
            p200.flow_rate.blow_out = p200_flow_rate_blow_out_default
            nozzlecheck("96", tiprack_20_X)
            # ===============================================
            # 96-channel operation - multi-well aspiration for sufficient volume
            p200.reset_tipracks()
            p200.pick_up_tip()
            # Aspirate from multiple TWB wells to get sufficient volume (A2, B2)
            p200.aspirate(
                1,
                reagent_plate_2.wells_by_name()["A1"].bottom(
                    z=Deep384_Z_offset + p20_in_Deep384_Z_offset
                ),
            )
            p200.aspirate(
                1,
                reagent_plate_2.wells_by_name()["A1"].bottom(
                    z=Deep384_Z_offset + p20_in_Deep384_Z_offset
                ),
            )
            p200.dispense(1, sample_plate_2["A1"].bottom(z=PCRPlate_Z_offset))
            # Return tips to origin tiprack instead of dropping
            p200.return_tip()
            # ===============================================

            # ============================================================================================
            if MODETRASH == "RECYCLE":
                protocol.comment(
                    "MOVING: tiprack_20_6 = tiprack_A3_adapter --> stacker 200|B"
                )
                protocol.move_labware(
                    labware=tiprack_20_6,
                    new_location=stacker_20_2,
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.comment("storing tiprack in A4")
                stacker_20_2.store()
                protocol.comment("stacker A full")
            else:
                protocol.comment("MOVING: tiprack_20_6 = tiprack_A3_adapter --> B3")
                protocol.move_labware(
                    labware=tiprack_20_6,
                    new_location="B3",
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.move_labware(
                    labware=tiprack_20_6,
                    new_location=OFF_DECK,
                    use_gripper=False,
                )
            protocol.comment("DISPENSING: tiprack_20_7 = #5--> A4")
            tiprack_20_7 = stacker_20_1.retrieve()
            protocol.move_labware(
                labware=tiprack_20_7,
                new_location=tiprack_A3_adapter,
                use_gripper=True,
            )
            # ============================================================================================

            protocol.comment("--> Removing Supernatant")
            RemoveSup = 10
            p200.flow_rate.aspirate = p200_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p200_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p200_flow_rate_blow_out_default * 0.5
            nozzlecheck("96", tiprack_20_7)
            # ===============================================
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.aspirate(RemoveSup, sample_plate_2["A1"].bottom(z=PCRPlate_Z_offset))
            p200.dispense(RemoveSup, LW_reservoir["A1"].top(z=Deepwell_Z_offset))
            p200.return_tip()
            # ===============================================

            protocol.comment("--> Wash 3")
            p200.flow_rate.aspirate = p200_flow_rate_aspirate_default
            p200.flow_rate.dispense = p200_flow_rate_dispense_default
            p200.flow_rate.blow_out = p200_flow_rate_blow_out_default
            nozzlecheck("96", tiprack_20_X)
            # ===============================================
            # 96-channel operation - multi-well aspiration for sufficient volume
            p200.reset_tipracks()
            p200.pick_up_tip()
            # Aspirate from multiple TWB wells to get sufficient volume (A2, B2)
            p200.aspirate(
                7,
                reagent_plate_2.wells_by_name()["A1"].bottom(
                    z=Deep384_Z_offset + p20_in_Deep384_Z_offset
                ),
            )
            p200.aspirate(
                7,
                reagent_plate_2.wells_by_name()["A1"].bottom(
                    z=Deep384_Z_offset + p20_in_Deep384_Z_offset
                ),
            )
            p200.dispense(14, sample_plate_2["A1"].bottom(z=PCRPlate_Z_offset))
            # Return tips to origin tiprack instead of dropping
            p200.return_tip()
            # ===============================================

            # ============================================================================================
            if MODETRASH == "RECYCLE":
                protocol.comment(
                    "MOVING: tiprack_20_7 = tiprack_A3_adapter --> stacker 200|B"
                )
                protocol.move_labware(
                    labware=tiprack_20_7,
                    new_location=stacker_20_2,
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.comment("stacker B store")
                stacker_20_2.store()
            else:
                protocol.comment("MOVING: tiprack_20_7 = tiprack_A3_adapter --> B3")
                protocol.move_labware(
                    labware=tiprack_20_7,
                    new_location="B3",
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.move_labware(
                    labware=tiprack_20_7,
                    new_location=OFF_DECK,
                    use_gripper=False,
                )
            protocol.comment("DISPENSING: tiprack_20_8 = #6--> A4")
            tiprack_20_8 = stacker_20_1.retrieve()
            protocol.move_labware(
                labware=tiprack_20_8,
                new_location=tiprack_A3_adapter,
                use_gripper=True,
                pick_up_offset=deck_pick_up_offset,
                drop_offset=deck_drop_offset,
            )
            # ============================================================================================

            protocol.comment("--> Removing Supernatant")
            RemoveSup = 12
            p200.flow_rate.aspirate = p200_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p200_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p200_flow_rate_blow_out_default * 0.5
            nozzlecheck("96", tiprack_20_8)
            # ===============================================
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.aspirate(RemoveSup, sample_plate_2["A1"].bottom(z=PCRPlate_Z_offset))
            p200.dispense(RemoveSup, LW_reservoir["A1"].top(z=Deepwell_Z_offset))
            p200.return_tip()
            # ===============================================

            # ============================================================================================
            if MODETRASH == "RECYCLE":
                protocol.comment(
                    "MOVING: tiprack_20_8 = tiprack_A3_adapter --> stacker 200|B"
                )
                protocol.move_labware(
                    labware=tiprack_20_8,
                    new_location=stacker_20_2,
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.comment("stacker B store")
                stacker_20_2.store()
            else:
                protocol.comment("MOVING: tiprack_20_8 = tiprack_A3_adapter --> B3")
                protocol.move_labware(
                    labware=tiprack_20_8,
                    new_location="B3",
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.move_labware(
                    labware=tiprack_20_8,
                    new_location=OFF_DECK,
                    use_gripper=False,
                )
            protocol.comment("MOVING: CleanupPlate_1 = D4 --> A4")
            protocol.move_labware(
                labware=CleanupPlate_1,
                new_location=stacker_20_1,
                use_gripper=True,
                pick_up_offset=deck_pick_up_offset,
                drop_offset=deck_drop_offset,
            )
            protocol.comment("DISPENSING: tiprack_50_7 = #6--> D4")
            tiprack_50_7 = stacker_50_2.retrieve()
            protocol.comment("MOVING: tiprack_50_7 = D4 --> tiprack_A3_adapter")
            protocol.move_labware(
                labware=tiprack_50_7,
                new_location=tiprack_A3_adapter,
                use_gripper=True,
            )
            # stacker 2 empty, start loading into stacker 2
            protocol.comment("MOVING: sample_plate_2 = mag_block --> thermocycler")
            if ONDECK_THERMO:
                protocol.move_labware(
                    labware=sample_plate_2,
                    new_location=thermocycler,
                    use_gripper=True,
                )
            else:
                protocol.move_labware(
                    labware=sample_plate_2,
                    new_location="B1",
                    use_gripper=True,
                )
            # ============================================================================================

            protocol.comment("--> Adding EPM and Barcode")
            EPMVol = 40
            EPMMixVol = 35
            BarcodeVol = 10
            TransferSup = 50
            p200.flow_rate.aspirate = p200_flow_rate_aspirate_default
            p200.flow_rate.dispense = p200_flow_rate_dispense_default
            p200.flow_rate.blow_out = p200_flow_rate_blow_out_default
            nozzlecheck("96", tiprack_50_7)
            # ===============================================
            p200.pick_up_tip()
            protocol.comment("--> Adding Barcodes")
            p200.aspirate(BarcodeVol, Barcodes.bottom(z=Deep384_Z_offset))
            p200.dispense(BarcodeVol, sample_plate_2["A1"].bottom(z=PCRPlate_Z_offset))
            protocol.comment("--> Adding EPM")
            p200.aspirate(EPMVol, EPM_1.bottom(z=Deep384_Z_offset))
            p200.dispense(EPMVol, sample_plate_2["A1"].bottom(z=PCRPlate_Z_offset))
            p200.return_tip()
            # ===============================================

            protocol.comment(
                "MOVING: Plate Lid #1 = Plate Lid Stack --> sample_plate_2"
            )
            protocol.move_lid(lids, sample_plate_2, use_gripper=True)
            if ONDECK_THERMO:
                thermocycler.close_lid()
            #
            if ONDECK_THERMO:
                thermocycler.open_lid()
            protocol.comment("MOVING: Plate Lid #1 = sample_plate_2 --> TRASH")
            protocol.move_lid(sample_plate_2, TRASH, use_gripper=True)

        if STEP_CLEANUP_1:
            protocol.comment("==============================================")
            protocol.comment("--> Cleanup 1")
            protocol.comment("==============================================")

            # ============================================================================================
            protocol.comment("MOVING: CleanupPlate_1 = A4 --> mag_block")
            protocol.move_labware(
                labware=CleanupPlate_1,
                new_location=mag_block,
                use_gripper=True,
                pick_up_offset=deck_pick_up_offset,
                drop_offset=mb_drop_offset,
            )
            # ============================================================================================

            protocol.comment("--> TRANSFERRING AND ADDING AMPure (0.8x)")
            AMPureVol = 45.0
            SampleVol = 45.0
            AMPurePremix = 3 if DRYRUN is False else 1
            p200.flow_rate.aspirate = p200_flow_rate_aspirate_default
            p200.flow_rate.dispense = p200_flow_rate_dispense_default
            p200.flow_rate.blow_out = p200_flow_rate_blow_out_default
            nozzlecheck("96", tiprack_50_7)
            p200.reset_tipracks()
            # ===============================================
            p200.pick_up_tip()
            protocol.comment("--> ADDING AMPure (0.8x)")
            p200.aspirate(AMPureVol, AMPure.bottom(z=Deepwell_Z_offset))
            p200.dispense(AMPureVol, CleanupPlate_1["A1"].bottom(z=Deepwell_Z_offset))
            protocol.comment("--> Adding SAMPLE")
            p200.aspirate(SampleVol, sample_plate_2["A1"].bottom(z=PCRPlate_Z_offset))
            p200.dispense(SampleVol, CleanupPlate_1["A1"].bottom(z=Deepwell_Z_offset))
            p200.return_tip()
            # ===============================================

            # ============================================================================================
            if MODETRASH == "RECYCLE":
                protocol.comment(
                    "MOVING: tiprack_50_7 = tiprack_A3_adapter --> stacker 50|D"
                )
                protocol.move_labware(
                    labware=tiprack_50_7,
                    new_location=stacker_50_2,
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.comment("stacker D store")
                stacker_50_2.store()
            else:
                protocol.comment("MOVING: tiprack_50_7 = tiprack_A3_adapter --> B3")
                protocol.move_labware(
                    labware=tiprack_50_7,
                    new_location="B3",
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.move_labware(
                    labware=tiprack_50_7,
                    new_location=OFF_DECK,
                    use_gripper=False,
                )
            protocol.comment("DISPENSING: tiprack_20_9 = #2--> B4")
            tiprack_20_9 = stacker_20_1.retrieve()
            protocol.comment("MOVING: tiprack_20_9 = B4 --> tiprack_A3_adapter")
            protocol.move_labware(
                labware=tiprack_20_9,
                new_location=tiprack_A3_adapter,
                use_gripper=True,
            )
            # ============================================================================================

            protocol.comment("--> Removing Supernatant 2A")
            RemoveSup = 11
            p200.flow_rate.aspirate = p200_flow_rate_aspirate_default
            p200.flow_rate.dispense = p200_flow_rate_dispense_default
            p200.flow_rate.blow_out = p200_flow_rate_blow_out_default
            nozzlecheck("96", tiprack_20_9)
            # ===============================================
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.aspirate(RemoveSup, CleanupPlate_1["A1"].bottom(z=Deepwell_Z_offset))
            p200.dispense(RemoveSup, LW_reservoir["A1"].top(z=Deepwell_Z_offset))
            p200.return_tip()
            # ===============================================

            protocol.comment("--> ETOH Wash 1A")
            ETOHMaxVol = 8.5
            p200.flow_rate.aspirate = p200_flow_rate_aspirate_default
            p200.flow_rate.dispense = p200_flow_rate_dispense_default
            p200.flow_rate.blow_out = p200_flow_rate_blow_out_default
            nozzlecheck("96", tiprack_20_X)
            # ===============================================
            # 96-channel operation - process entire plate at once
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.aspirate(ETOHMaxVol, ETOH_reservoir["A1"].bottom(z=Deepwell_Z_offset))
            p200.dispense(ETOHMaxVol, CleanupPlate_1["A1"].bottom(z=Deepwell_Z_offset))
            # Return tips to origin tiprack instead of dropping
            p200.return_tip()
            # ===============================================

            # ============================================================================================
            if MODETRASH == "RECYCLE":
                protocol.comment(
                    "MOVING: tiprack_20_9 = tiprack_A3_adapter --> stacker 200|B"
                )
                protocol.move_labware(
                    labware=tiprack_20_9,
                    new_location=stacker_20_2,
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.comment("stacker B store")
                stacker_20_2.store()
            else:
                protocol.comment("MOVING: tiprack_20_9 = tiprack_A3_adapter --> B3")
                protocol.move_labware(
                    labware=tiprack_20_9,
                    new_location="B3",
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.move_labware(
                    labware=tiprack_20_9,
                    new_location=OFF_DECK,
                    use_gripper=False,
                )
            protocol.comment("DISPENSING: tiprack_20_10 = #3--> B4")
            tiprack_20_10 = stacker_20_1.retrieve()
            protocol.comment("MOVING: tiprack_20_10 = B4 --> tiprack_A3_adapter")
            protocol.move_labware(
                labware=tiprack_20_10,
                new_location=tiprack_A3_adapter,
                use_gripper=True,
            )
            # ============================================================================================

            protocol.comment("--> Removing Supernatant 2B")
            RemoveSup = 20
            p200.flow_rate.aspirate = p200_flow_rate_aspirate_default
            p200.flow_rate.dispense = p200_flow_rate_dispense_default
            p200.flow_rate.blow_out = p200_flow_rate_blow_out_default
            nozzlecheck("96", tiprack_20_10)
            # ===============================================
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.aspirate(RemoveSup, CleanupPlate_1["A1"].bottom(z=Deepwell_Z_offset))
            p200.dispense(RemoveSup, LW_reservoir["A1"].top(z=Deepwell_Z_offset))
            p200.return_tip()
            # ===============================================

            protocol.comment("--> ETOH Wash 1B")
            ETOHMaxVol = 2
            p200.flow_rate.aspirate = p200_flow_rate_aspirate_default
            p200.flow_rate.dispense = p200_flow_rate_dispense_default
            p200.flow_rate.blow_out = p200_flow_rate_blow_out_default
            nozzlecheck("96", tiprack_20_X)
            # ===============================================
            # 96-channel operation - process entire plate at once
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.aspirate(ETOHMaxVol, ETOH_reservoir["A1"].bottom(z=Deepwell_Z_offset))
            p200.dispense(ETOHMaxVol, CleanupPlate_1["A1"].bottom(z=Deepwell_Z_offset))
            # Return tips to origin tiprack instead of dropping
            p200.return_tip()
            # ===============================================

            # ============================================================================================
            if MODETRASH == "RECYCLE":
                protocol.comment(
                    "MOVING: tiprack_20_10 = tiprack_A3_adapter --> stacker 200|B"
                )
                protocol.move_labware(
                    labware=tiprack_20_10,
                    new_location=stacker_20_2,
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.comment("stacker B store")
                stacker_20_2.store()
            else:
                protocol.comment("MOVING: tiprack_20_10 = tiprack_A3_adapter --> B3")
                protocol.move_labware(
                    labware=tiprack_20_10,
                    new_location="B3",
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.move_labware(
                    labware=tiprack_20_10,
                    new_location=OFF_DECK,
                    use_gripper=False,
                )
            protocol.comment("DISPENSING: tiprack_20_11 = #4--> B4")
            tiprack_20_11 = stacker_20_1.retrieve()
            protocol.comment("MOVING: tiprack_20_11 = B4 --> tiprack_A3_adapter")
            protocol.move_labware(
                labware=tiprack_20_11,
                new_location=tiprack_A3_adapter,
                use_gripper=True,
            )
            # ============================================================================================

            protocol.comment("--> Removing Supernatant 1C")
            RemoveSup = 8
            p200.flow_rate.aspirate = p200_flow_rate_aspirate_default
            p200.flow_rate.dispense = p200_flow_rate_dispense_default
            p200.flow_rate.blow_out = p200_flow_rate_blow_out_default
            nozzlecheck("96", tiprack_20_11)
            # ===============================================
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.aspirate(RemoveSup, CleanupPlate_1["A1"].bottom(z=Deepwell_Z_offset))
            p200.dispense(RemoveSup, LW_reservoir["A1"].top(z=Deepwell_Z_offset))
            p200.return_tip()
            # ===============================================

            # ============================================================================================
            if MODETRASH == "RECYCLE":
                protocol.comment(
                    "MOVING: tiprack_20_11 = tiprack_A3_adapter --> stacker 200|B"
                )
                protocol.move_labware(
                    labware=tiprack_20_11,
                    new_location=stacker_20_2,
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.comment("stacker B store")
                stacker_20_2.store()
            else:
                protocol.comment("MOVING: tiprack_20_11 = tiprack_A3_adapter --> B3")
                protocol.move_labware(
                    labware=tiprack_20_11,
                    new_location="B3",
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.move_labware(
                    labware=tiprack_20_11,
                    new_location=OFF_DECK,
                    use_gripper=False,
                )
            protocol.comment("MOVING: tiprack_20_X = SCP_Position --> B4")
            protocol.move_labware(
                labware=tiprack_20_X,
                new_location=stacker_20_2,
                use_gripper=True,
                pick_up_offset=deck_pick_up_offset,
                drop_offset=deck_drop_offset,
            )

            protocol.comment("MOVING: CleanupPlate_2 = C4 --> A4")
            protocol.move_labware(
                labware=CleanupPlate_2,
                new_location=stacker_50_2,
                use_gripper=True,
                pick_up_offset=deck_pick_up_offset,
                drop_offset=deck_drop_offset,
            )
            protocol.comment("DISPENSING: tiprack_50_9 = #3--> C4")
            tiprack_50_9 = stacker_50_1.retrieve()
            protocol.comment("MOVING: tiprack_50_9 = C4 --> SCP_Position")
            protocol.move_labware(
                labware=tiprack_50_9, new_location=tiprack_C2_adapter, use_gripper=True
            )
            # ============================================================================================

            if MODESPEED != "QUICK":
                protocol.comment("--> Adding RSB")
                RSBVol = 32
                p200.flow_rate.aspirate = p200_flow_rate_aspirate_default
                p200.flow_rate.dispense = p200_flow_rate_dispense_default
                p200.flow_rate.blow_out = p200_flow_rate_blow_out_default
                nozzlecheck("96", tiprack_50_9)
                # ===============================================
                # 96-channel operation - process entire plate at once
                p200.reset_tipracks()
                p200.pick_up_tip()
                p200.aspirate(
                    RSBVol,
                    reagent_plate_1.wells_by_name()["A1"].bottom(z=Deep384_Z_offset),
                )
                p200.dispense(RSBVol, CleanupPlate_1["A1"].bottom(z=Deepwell_Z_offset))
                # Return tips to origin tiprack instead of dropping
                p200.return_tip()
                # ===============================================

            # ============================================================================================
            if MODETRASH == "RECYCLE":
                protocol.comment("MOVING: tiprack_50_9 = SCP_Position --> stacker 50|D")
                protocol.move_labware(CleanupPlate_2, stacker_20_1, use_gripper=True)
                protocol.move_labware(
                    labware=tiprack_50_9,
                    new_location=stacker_50_2,
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.comment("stacker D store")
                stacker_50_2.store()
            else:
                protocol.comment("MOVING: tiprack_50_9 = SCP_Position --> B3")
                protocol.move_labware(
                    labware=tiprack_50_9,
                    new_location="B3",
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.move_labware(
                    labware=tiprack_50_9,
                    new_location=OFF_DECK,
                    use_gripper=False,
                )
            protocol.comment("DISPENSING: tiprack_50_10 = #4--> C4")
            tiprack_50_10 = stacker_50_1.retrieve()
            protocol.comment("MOVING: tiprack_50_10 = C4 --> SCP_Position")
            protocol.move_labware(
                labware=tiprack_50_10,
                new_location=tiprack_C2_adapter,
                use_gripper=True,
            )
            if MODETRASH == "RECYCLE":
                protocol.comment("MOVING: sample_plate_2 = thermocycler --> TRASH")
                protocol.move_labware(
                    labware=sample_plate_2,
                    new_location=TRASH,
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
            else:
                protocol.comment("MOVING: sample_plate_2 = thermocycler --> B3")
                protocol.move_labware(
                    labware=sample_plate_2,
                    new_location="B3",
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.move_labware(
                    labware=sample_plate_2,
                    new_location=OFF_DECK,
                    use_gripper=False,
                )
            # =======================
            # =======================
            # protocol.pause('Add sample_plate_3 to A2')
            protocol.comment("MOVING: sample_plate_3 = A2 --> thermocycler")
            if ONDECK_THERMO:
                protocol.move_labware(
                    labware=sample_plate_3,
                    new_location=thermocycler,
                    use_gripper=True,
                )
            else:
                protocol.move_labware(
                    labware=sample_plate_3,
                    new_location="B1",
                    use_gripper=True,
                )
            # =======================
            # =======================

        if STEP_POOL:

            protocol.comment("--> Pooling")

            # ============================================================================================
            if MODETRASH == "RECYCLE":
                protocol.comment(
                    "MOVING: tiprack_50_10 = SCP_Position --> stacker 50|D"
                )
                protocol.move_labware(
                    labware=tiprack_50_10,
                    new_location=stacker_50_2,
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.comment("stacker D store")
                stacker_50_2.store()
            else:
                protocol.comment("MOVING: tiprack_50_10 = SCP_Position --> B3")
                protocol.move_labware(
                    labware=tiprack_50_10,
                    new_location="B3",
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.move_labware(
                    labware=tiprack_50_10,
                    new_location=OFF_DECK,
                    use_gripper=False,
                )
            protocol.comment("DISPENSING: tiprack_50_10 = #5--> C4")
            tiprack_50_X = stacker_50_1.retrieve()
            protocol.comment("MOVING: tiprack_50_X = C4 --> SCP_Position")
            protocol.move_labware(
                labware=tiprack_50_X, new_location=tiprack_C2_adapter, use_gripper=True
            )
            # ============================================================================================

        if STEP_HYB:
            protocol.comment("==============================================")
            protocol.comment("--> HYB")
            protocol.comment("==============================================")

            protocol.comment("--> add NHB2")
            NHB2Vol = 50
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            nozzlecheck("R8", tiprack_50_X)
            # ===============================================
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.aspirate(NHB2Vol, NHB2.bottom(z=0.3))
            p200.dispense(NHB2Vol, sample_plate_3["A1"].bottom(z=1))
            p200.blow_out(sample_plate_3["A1"].bottom(z=1))
            p200.return_tip()
            # ===============================================

            protocol.comment("--> Adding Panel")
            PanelVol = 10
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            nozzlecheck("R8", tiprack_50_X)
            # ===============================================
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.aspirate(PanelVol, Panel.bottom(z=0.3))
            p200.dispense(PanelVol, sample_plate_3["A1"].bottom(z=1))
            p200.blow_out(sample_plate_3["A1"].bottom(z=1))
            p200.return_tip()
            # ===============================================

            protocol.comment("--> Adding EHB2")
            EHB2Vol = 10
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            nozzlecheck("R8", tiprack_50_X)
            p200.reset_tipracks()
            p200.pick_up_tip()
            # ===============================================
            for loop, X in enumerate("A1"):
                p200.aspirate(EHB2Vol, EHB2.bottom(z=0.3))
                p200.dispense(EHB2Vol, sample_plate_3["A1"].bottom(z=1))
                p200.blow_out(sample_plate_3["A1"].bottom(z=1))
            p200.return_tip()
            # ===============================================

            if ONDECK_THERMO:
                protocol.comment("Hybridize on Deck")
                thermocycler.close_lid()
                if DRYRUN is False:
                    profile_TAGSTOP: List[ThermocyclerStep] = [
                        {"temperature": 98, "hold_time_minutes": 5},
                        {"temperature": 97, "hold_time_minutes": 1},
                        {"temperature": 95, "hold_time_minutes": 1},
                        {"temperature": 93, "hold_time_minutes": 1},
                        {"temperature": 91, "hold_time_minutes": 1},
                        {"temperature": 89, "hold_time_minutes": 1},
                        {"temperature": 87, "hold_time_minutes": 1},
                        {"temperature": 85, "hold_time_minutes": 1},
                        {"temperature": 83, "hold_time_minutes": 1},
                        {"temperature": 81, "hold_time_minutes": 1},
                        {"temperature": 79, "hold_time_minutes": 1},
                        {"temperature": 77, "hold_time_minutes": 1},
                        {"temperature": 75, "hold_time_minutes": 1},
                        {"temperature": 73, "hold_time_minutes": 1},
                        {"temperature": 71, "hold_time_minutes": 1},
                        {"temperature": 69, "hold_time_minutes": 1},
                        {"temperature": 67, "hold_time_minutes": 1},
                        {"temperature": 65, "hold_time_minutes": 1},
                        {"temperature": 63, "hold_time_minutes": 1},
                        {"temperature": 62, "hold_time_minutes": HYBRIDTIME * 60},
                    ]
                    thermocycler.execute_profile(
                        steps=profile_TAGSTOP, repetitions=1, block_max_volume=100
                    )
                    block_task = thermocycler.start_set_block_temperature(62)
                    if HYBRID_PAUSE:
                        protocol.comment("HYBRIDIZATION PAUSED")
                    protocol.wait_for_tasks([block_task])
                    thermocycler.start_set_block_temperature(10)
                thermocycler.open_lid()
            else:
                protocol.comment(
                    "Pausing to run Tagmentation on an off deck Thermocycler ~15min"
                )

        if STEP_CAPTURE:
            protocol.comment("==============================================")
            protocol.comment("--> Capture")
            protocol.comment("==============================================")

            if DRYRUN is False:
                protocol.comment("SETTING THERMO and TEMP BLOCK Temperature")
                if ONDECK_THERMO:
                    tc_block_task = thermocycler.start_set_block_temperature(58)
                    tc_lid_task = thermocycler.start_set_lid_temperature(58)
                    protocol.wait_for_tasks([tc_block_task, tc_lid_task])
            # ============================================================================================
            protocol.comment("MOVING: tiprack_50_X = SCP_Position --> D4")
            protocol.move_labware(
                labware=tiprack_50_X,
                new_location=stacker_50_2,
                use_gripper=True,
                pick_up_offset=deck_pick_up_offset,
                drop_offset=deck_drop_offset,
            )
            protocol.comment("MOVING: tiprack_20_X = B4 --> SCP_Position")
            protocol.move_labware(
                labware=tiprack_20_X,
                new_location=tiprack_C2_adapter,
                use_gripper=True,
                pick_up_offset=deck_pick_up_offset,
                drop_offset=deck_drop_offset,
            )
            if MODETRASH == "RECYCLE":
                protocol.comment("MOVING: CleanupPlate_1 = mag_block --> TRASH")
                protocol.move_labware(
                    labware=CleanupPlate_1,
                    new_location=TRASH,
                    use_gripper=True,
                    pick_up_offset=mb_pick_up_offset,
                )
            else:
                protocol.comment("MOVING: CleanupPlate_1 = mag_block --> B3")
                protocol.move_labware(
                    labware=CleanupPlate_1,
                    new_location="B3",
                    use_gripper=True,
                    pick_up_offset=mb_pick_up_offset,
                )
                protocol.move_labware(
                    labware=CleanupPlate_1,
                    new_location=OFF_DECK,
                    use_gripper=False,
                )
            protocol.comment("MOVING: CleanupPlate_2 = A4 --> mag_block")
            protocol.move_labware(
                labware=CleanupPlate_2,
                new_location=mag_block,
                use_gripper=True,
                pick_up_offset=deck_pick_up_offset,
                drop_offset=mb_drop_offset,
            )
            # ============================================================================================

            protocol.comment("--> Transfer Hybridization")
            TransferSup = 17
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            nozzlecheck("R8", tiprack_20_X)
            # ===============================================
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.move_to(sample_plate_3["A1"].bottom(z=0.3))
            p200.aspirate(TransferSup + 1, rate=0.25)
            p200.dispense(TransferSup + 1, CleanupPlate_2["A1"].bottom(z=1))
            p200.return_tip()
            # ===============================================
            if ONDECK_THERMO:
                thermocycler.close_lid()

            protocol.comment("--> ADDING SMB")
            SampleVol = 7
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            nozzlecheck("R8", tiprack_20_X)
            # ===============================================
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.mix(5, 7, SMB_1.bottom(z=1))
            p200.aspirate(5, SMB_1.bottom(z=1), rate=0.25)
            p200.dispense(5, CleanupPlate_2["A1"].top(z=-7), rate=0.25)
            p200.aspirate(5, SMB_1.bottom(z=1), rate=0.25)
            p200.dispense(5, CleanupPlate_2["A1"].bottom(z=1), rate=0.25)
            p200.default_speed = 5
            p200.move_to(CleanupPlate_2["A1"].bottom(z=5))
            for Mix in range(2):
                p200.aspirate(6, rate=0.5)
                p200.move_to(CleanupPlate_2["A1"].bottom(z=1))
                p200.aspirate(6, rate=0.5)
                p200.dispense(6, rate=0.5)
                p200.move_to(CleanupPlate_2["A1"].bottom(z=5))
                p200.dispense(6, rate=0.5)
                Mix += 1
            p200.blow_out(CleanupPlate_2["A1"].top(z=-7))
            p200.default_speed = 400
            p200.move_to(CleanupPlate_2["A1"].top(z=5))
            p200.move_to(CleanupPlate_2["A1"].top(z=0))
            p200.move_to(CleanupPlate_2["A1"].top(z=5))
            p200.return_tip()
            # ===============================================

            if ONDECK_THERMO:
                thermocycler.open_lid()

            if DRYRUN is False:
                protocol.delay(minutes=2)

            protocol.comment("==============================================")
            protocol.comment("--> WASH")
            protocol.comment("==============================================")

            protocol.comment("--> Remove SUPERNATANT")
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            nozzlecheck("R8", tiprack_20_X)
            # ===============================================
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.move_to(CleanupPlate_2["A1"].bottom(4))
            p200.aspirate(11, rate=0.25)
            p200.dispense(11, LW_reservoir["A1"].top(z=-7))
            p200.move_to(CleanupPlate_2["A1"].bottom(0.5))
            p200.aspirate(20, rate=0.25)
            p200.dispense(20, LW_reservoir["A1"].top(z=-7))
            p200.move_to(LW_reservoir["A1"].top(z=-7))
            protocol.delay(minutes=0.1)
            p200.blow_out(LW_reservoir["A1"].top(z=-7))
            p200.aspirate(20)
            p200.return_tip()
            # ===============================================

            protocol.comment("--> Adding EEW")
            EEWVol = 5
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            nozzlecheck("R8", tiprack_20_X)
            # ===============================================
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.aspirate(EEWVol, reagent_plate_1["A1"].bottom())
            p200.dispense(EEWVol, CleanupPlate_2["A1"].bottom())
            p200.return_tip()
            # ===============================================

            if DRYRUN is False:
                protocol.delay(seconds=5 * 60)

            if DRYRUN is False:
                protocol.delay(seconds=1 * 60)

            protocol.comment("--> Removing Supernatant")
            RemoveSup = 200
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            nozzlecheck("R8", tiprack_20_X)
            # ===============================================
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.move_to(CleanupPlate_2["A1"].bottom(z=3.5))
            p200.aspirate(7, rate=0.25)
            protocol.delay(minutes=0.1)
            p200.move_to(CleanupPlate_2["A1"].bottom(z=0.5))
            p200.aspirate(7, rate=0.25)
            p200.move_to(CleanupPlate_2["A1"].top(z=0.5))
            p200.dispense(14, LW_reservoir["A1"].top(z=-7))
            protocol.delay(minutes=0.1)
            p200.blow_out(LW_reservoir["A1"].top(z=-7))
            p200.aspirate(20)
            p200.return_tip()
            # ===============================================

            # ============================================================================================
            if MODETRASH == "RECYCLE":
                protocol.comment(
                    "MOVING: tiprack_20_X = SCP_Position --> stacker 200|A"
                )
                protocol.move_labware(
                    labware=tiprack_20_X,
                    new_location=stacker_20_1,
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.comment("stacker B store")
                stacker_20_1.store()
            else:
                protocol.comment("MOVING: tiprack_20_X = SCP_Position --> B3")
                protocol.move_labware(
                    labware=tiprack_20_X,
                    new_location="B3",
                    use_gripper=True,
                    pick_up_offset=deck_pick_up_offset,
                )
                protocol.move_labware(
                    labware=tiprack_20_X,
                    new_location=OFF_DECK,
                    use_gripper=False,
                )
            protocol.comment("DISPENSING: tiprack_20_XX = #5--> B4")
            tiprack_20_XX = stacker_20_1.retrieve()
            protocol.comment("MOVING: tiprack_20_XX = B4 --> SCP_Position")
            protocol.move_labware(
                labware=tiprack_20_XX,
                new_location=tiprack_C2_adapter,
                use_gripper=True,
            )
            # ============================================================================================

            protocol.comment("--> Adding EEW")
            EEWVol = 5
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            nozzlecheck("R8", tiprack_20_XX)
            # ===============================================
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.aspirate(EEWVol, reagent_plate_1["A1"].bottom())
            p200.dispense(EEWVol, CleanupPlate_2["A1"].bottom())
            p200.return_tip()
            # ===============================================

            if DRYRUN is False:
                protocol.delay(seconds=5 * 60)

            if DRYRUN is False:
                protocol.delay(seconds=1 * 60)

            protocol.comment("--> Removing Supernatant")
            RemoveSup = 200
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            nozzlecheck("R8", tiprack_20_XX)
            # ===============================================
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.move_to(CleanupPlate_2["A1"].bottom(z=3.5))
            p200.aspirate(9, rate=0.25)
            protocol.delay(minutes=0.1)
            p200.move_to(CleanupPlate_2["A1"].bottom(z=0.5))
            p200.aspirate(9, rate=0.25)
            p200.move_to(CleanupPlate_2["A1"].top(z=0.5))
            p200.dispense(18, LW_reservoir["A1"].top(z=-7))
            protocol.delay(minutes=0.1)
            p200.blow_out(LW_reservoir["A1"].top(z=-7))
            p200.aspirate(20)
            p200.return_tip()
            # ===============================================

            protocol.comment("--> Adding EEW")
            EEWVol = 7
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            nozzlecheck("R8", tiprack_20_XX)
            # ===============================================
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.aspirate(7, reagent_plate_1["A1"].bottom())
            p200.dispense(7, CleanupPlate_2["A1"].bottom())
            p200.return_tip()
            # ===============================================

            if DRYRUN is False:
                protocol.delay(seconds=5 * 60)

            if DRYRUN is False:
                protocol.delay(seconds=1 * 60)

            protocol.comment("--> Removing Supernatant")
            RemoveSup = 9
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            nozzlecheck("R8", tiprack_20_XX)
            # ===============================================
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.move_to(CleanupPlate_2["A1"].bottom(z=3.5))
            p200.aspirate(9, rate=0.25)
            protocol.delay(minutes=0.1)
            p200.move_to(CleanupPlate_2["A1"].bottom(z=0.5))
            p200.aspirate(9, rate=0.25)
            p200.move_to(CleanupPlate_2["A1"].top(z=0.5))
            p200.dispense(18, LW_reservoir["A1"].top(z=-7))
            protocol.delay(minutes=0.1)
            p200.blow_out(LW_reservoir["A1"].top(z=-7))
            p200.aspirate(20)
            p200.return_tip()
            # ===============================================

            protocol.comment("--> Adding EEW")
            EEWVol = 7
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            nozzlecheck("R8", tiprack_20_XX)
            # ===============================================
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.aspirate(EEWVol, reagent_plate_1["A1"].bottom())
            p200.dispense(EEWVol, CleanupPlate_2["A1"].bottom())
            p200.return_tip()
            # ===============================================

            if DRYRUN is False:
                protocol.delay(seconds=1 * 60)

            protocol.comment("--> Transfer Hybridization")
            TransferSup = 17
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            nozzlecheck("R8", tiprack_20_XX)
            # ===============================================
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.move_to(CleanupPlate_2["A1"].bottom(z=0.25))
            p200.aspirate(TransferSup, rate=0.25)
            p200.dispense(TransferSup, CleanupPlate_2["A1"].bottom(z=1))
            p200.return_tip()
            # ===============================================

            if DRYRUN is False:
                protocol.delay(seconds=5 * 60)

            if DRYRUN is False:
                protocol.delay(seconds=1 * 60)

            protocol.comment("--> Removing Supernatant")
            RemoveSup = 14
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            nozzlecheck("R8", tiprack_20_XX)
            # ===============================================
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.move_to(CleanupPlate_2["A1"].bottom(z=3.5))
            p200.aspirate(RemoveSup, rate=0.25)
            protocol.delay(minutes=0.1)
            p200.move_to(CleanupPlate_2["A1"].bottom(z=0.5))
            p200.aspirate(6, rate=0.25)
            p200.move_to(CleanupPlate_2["A1"].top(z=0.5))
            p200.dispense(20, LW_reservoir["A1"].top(z=-7))
            protocol.delay(minutes=0.1)
            p200.blow_out(LW_reservoir["A1"].top(z=-7))
            p200.aspirate(20)
            p200.return_tip()
            # ===============================================

            protocol.comment("--> Removing Residual")
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            nozzlecheck("R8", tiprack_20_XX)
            # ===============================================
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.move_to(CleanupPlate_2["A1"].bottom(z=0.3))
            p200.aspirate(10, rate=0.25)
            p200.default_speed = 200
            p200.dispense(10, LW_reservoir["A1"].top(z=-7))
            protocol.delay(minutes=0.1)
            p200.blow_out()
            p200.default_speed = 400
            p200.move_to(LW_reservoir["A1"].top(z=-7))
            p200.move_to(LW_reservoir["A1"].top(z=0))
            p200.return_tip()
            # ===============================================

            protocol.comment("==============================================")
            protocol.comment("--> ELUTE")
            protocol.comment("==============================================")

            # ============================================================================================
            protocol.comment("MOVING: tiprack_20_XX = SCP_Position --> A4")
            protocol.move_labware(
                labware=tiprack_20_XX,
                new_location=stacker_20_1,
                use_gripper=True,
                pick_up_offset=deck_pick_up_offset,
                drop_offset=deck_drop_offset,
            )
            protocol.comment("MOVING: tiprack_50_X = C4 --> SCP_Position")
            protocol.move_labware(
                labware=tiprack_50_X,
                new_location=tiprack_C2_adapter,
                use_gripper=True,
                pick_up_offset=deck_pick_up_offset,
                drop_offset=deck_drop_offset,
            )
            # ============================================================================================

            protocol.comment("--> Adding Elute")
            EluteVol = 23
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            nozzlecheck("R8", tiprack_50_X)
            # ===============================================
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.aspirate(EluteVol, Elute.bottom(z=0.3))
            p200.dispense(EluteVol, CleanupPlate_2["A1"].bottom(z=0.3))
            # ===============================================

            protocol.comment("--> Transfer Elution")
            TransferSup = 21
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            # ===============================================
            p200.move_to(CleanupPlate_2["A1"].bottom(z=0.3))
            p200.aspirate(TransferSup + 1, rate=0.25)
            p200.dispense(TransferSup + 1, sample_plate_3["A1"].bottom(z=1))
            # ===============================================

            protocol.comment("--> Adding ET2")
            ET2Vol = 4
            ET2MixRep = 10 if DRYRUN is False else 1
            ET2MixVol = 20
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            # ===============================================
            p200.aspirate(ET2Vol, ET2.bottom())
            p200.dispense(ET2Vol, sample_plate_3["A1"].bottom())
            p200.move_to(sample_plate_3["A1"].bottom())
            p200.mix(ET2MixRep, ET2MixVol)
            p200.return_tip()
            # ===============================================

        if STEP_PCR:
            protocol.comment("==============================================")
            protocol.comment("--> AMPLIFICATION")
            protocol.comment("==============================================")

            protocol.comment("--> Adding PPC")
            PPCVol = 5
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            nozzlecheck("R8", tiprack_50_X)
            # ===============================================
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.aspirate(PPCVol, PPC.bottom(z=0.5))
            p200.dispense(PPCVol, sample_plate_3["A1"].bottom(z=0.5))
            # ===============================================

            protocol.comment("--> Adding EPM")
            EPMVol = 20
            EPMMixRep = 10 if DRYRUN is False else 1
            EPMMixVol = 45
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            # ===============================================
            p200.aspirate(EPMVol, EPM_2.bottom(z=0.5))
            p200.dispense(EPMVol, sample_plate_3["A1"].bottom(z=0.5))
            p200.move_to(sample_plate_3["A1"].bottom(z=0.5))
            p200.mix(EPMMixRep, EPMMixVol)
            p200.return_tip()
            # ===============================================

            if ONDECK_THERMO:
                if DRYRUN is False:
                    protocol.comment("SETTING THERMO to Room Temp")
                    tc_block_task = thermocycler.start_set_block_temperature(4)
                    tc_lid_task = thermocycler.start_set_lid_temperature(100)
                    protocol.wait_for_tasks([tc_block_task, tc_lid_task])
                thermocycler.close_lid()
                if DRYRUN is False:
                    profile_PCR_1: List[ThermocyclerStep] = [
                        {"temperature": 98, "hold_time_seconds": 45}
                    ]
                    thermocycler.execute_profile(
                        steps=profile_PCR_1, repetitions=1, block_max_volume=50
                    )
                    profile_PCR_2: List[ThermocyclerStep] = [
                        {"temperature": 98, "hold_time_seconds": 30},
                        {"temperature": 60, "hold_time_seconds": 30},
                        {"temperature": 72, "hold_time_seconds": 30},
                    ]
                    thermocycler.execute_profile(
                        steps=profile_PCR_2, repetitions=12, block_max_volume=50
                    )
                    profile_PCR_3: List[ThermocyclerStep] = [
                        {"temperature": 72, "hold_time_minutes": 1}
                    ]
                    thermocycler.execute_profile(
                        steps=profile_PCR_3, repetitions=1, block_max_volume=50
                    )
                    thermocycler.set_block_temperature(10)
                thermocycler.open_lid()
            else:
                if DRYRUN is False:
                    protocol.pause(
                        "Pausing to run PCR on an off deck Thermocycler ~25min"
                    )
                else:
                    protocol.comment(
                        "Pausing to run PCR on an off deck Thermocycler ~25min"
                    )

        if STEP_CLEANUP_2:
            protocol.comment("==============================================")
            protocol.comment("--> Cleanup 2")
            protocol.comment("==============================================")

            protocol.comment("--> Transfer Elution")
            TransferSup = 45
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            nozzlecheck("96", tiprack_50_X)
            # ===============================================
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.move_to(sample_plate_3["A1"].bottom(z=0.5))
            p200.aspirate(TransferSup + 1, rate=0.25)
            p200.dispense(TransferSup + 1, CleanupPlate_2["A1"].bottom(z=1))
            p200.return_tip()
            # ===============================================
            protocol.comment("--> ADDING AMPure (0.8x)")
            AMPureVol = 40.5
            SampleVol = 45.0
            AMPurePremix = 3 if DRYRUN is False else 1
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            # ===============================================
            nozzlecheck("R8", tiprack_50_X)
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.mix(AMPurePremix, AMPureVol, AMPure.bottom(z=1))
            p200.aspirate(AMPureVol, AMPure.bottom(z=1), rate=0.25)
            p200.dispense(AMPureVol, CleanupPlate_2["A1"].bottom(z=1))
            p200.default_speed = 5
            p200.move_to(CleanupPlate_2["A1"].bottom(z=5))
            for Mix in range(2):
                p200.aspirate(20)
                p200.move_to(CleanupPlate_2["A1"].bottom(z=1))
                p200.aspirate(20)
                p200.dispense(20)
                p200.move_to(CleanupPlate_2["A1"].bottom(z=5))
                p200.dispense(20)
                Mix += 1
            p200.blow_out(CleanupPlate_2["A1"].top(z=2))
            p200.default_speed = 400
            p200.move_to(CleanupPlate_2["A1"].top(z=5))
            p200.move_to(CleanupPlate_2["A1"].top(z=0))
            p200.move_to(CleanupPlate_2["A1"].top(z=5))
            p200.return_tip()
            # ===============================================

            # ============================================================================================
            protocol.comment("MOVING: tiprack_50_X = SCP_Position --> C4")
            protocol.move_labware(
                labware=tiprack_50_X,
                new_location=stacker_50_1,
                use_gripper=True,
                pick_up_offset=deck_pick_up_offset,
                drop_offset=deck_drop_offset,
            )
            protocol.comment("MOVING: tiprack_20_XX = B4 --> SCP_Position")
            protocol.move_labware(
                labware=tiprack_20_XX,
                new_location=tiprack_C2_adapter,
                use_gripper=True,
                pick_up_offset=deck_pick_up_offset,
                drop_offset=deck_drop_offset,
            )
            # ============================================================================================

            if DRYRUN is False:
                protocol.delay(minutes=4)

            protocol.comment("--> Removing Supernatant")
            RemoveSup = 14
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            nozzlecheck("R8", tiprack_20_XX)
            # ===============================================
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.move_to(CleanupPlate_2["A1"].bottom(z=3.5))
            p200.aspirate(RemoveSup, rate=0.25)
            protocol.delay(minutes=0.1)
            p200.move_to(CleanupPlate_2["A1"].bottom(z=0.5))
            p200.aspirate(1, rate=0.25)
            p200.default_speed = 5
            p200.move_to(CleanupPlate_2["A1"].top(z=2))
            p200.default_speed = 200
            p200.dispense(15, LW_reservoir["A1"].top(z=-7))
            protocol.delay(minutes=0.1)
            p200.blow_out()
            p200.default_speed = 400
            p200.move_to(LW_reservoir["A1"].top(z=-7))
            p200.move_to(LW_reservoir["A1"].top(z=0))
            p200.return_tip()
            # ===============================================

            protocol.comment("--> ETOH Wash")
            ETOHMaxVol = 12
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            nozzlecheck("R8", tiprack_20_XX)
            # ===============================================
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.aspirate(ETOHMaxVol, ETOH_reservoir["A1"].bottom(z=1))
            p200.move_to(ETOH_reservoir["A1"].top(z=0))
            p200.move_to(ETOH_reservoir["A1"].top(z=-5))
            p200.move_to(ETOH_reservoir["A1"].top(z=0))
            p200.move_to(CleanupPlate_2["A1"].top(z=-2))
            p200.dispense(ETOHMaxVol, rate=1)
            protocol.delay(minutes=0.1)
            p200.blow_out()
            p200.move_to(CleanupPlate_2["A1"].top(z=5))
            p200.move_to(CleanupPlate_2["A1"].top(z=0))
            p200.move_to(CleanupPlate_2["A1"].top(z=5))
            p200.return_tip()
            # ================================================

            if DRYRUN is False:
                protocol.delay(minutes=0.5)

            protocol.comment("--> Remove ETOH Wash")
            RemoveSup = 4
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            nozzlecheck("R8", tiprack_20_XX)
            # ===============================================
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.move_to(CleanupPlate_2["A1"].bottom(z=3.5))
            p200.aspirate(RemoveSup, rate=0.25)
            protocol.delay(minutes=0.1)
            p200.move_to(CleanupPlate_2["A1"].bottom(z=0.5))
            p200.aspirate(4, rate=0.25)
            p200.default_speed = 5
            p200.move_to(CleanupPlate_2["A1"].top(z=2))
            p200.default_speed = 200
            p200.dispense(8, LW_reservoir["A1"].top(z=-7))
            protocol.delay(minutes=0.1)
            p200.blow_out()
            p200.default_speed = 400
            p200.move_to(LW_reservoir["A1"].top(z=-7))
            p200.move_to(LW_reservoir["A1"].top(z=0))
            p200.return_tip()
            # ===============================================

            protocol.comment("--> ETOH Wash")
            ETOHMaxVol = 2
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            nozzlecheck("R8", tiprack_20_XX)
            # ===============================================
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.aspirate(ETOHMaxVol, ETOH_reservoir["A1"].bottom(z=1))
            p200.move_to(ETOH_reservoir["A1"].top(z=0))
            p200.move_to(ETOH_reservoir["A1"].top(z=-5))
            p200.move_to(ETOH_reservoir["A1"].top(z=0))
            p200.move_to(CleanupPlate_2["A1"].top(z=-2))
            p200.dispense(ETOHMaxVol, rate=1)
            protocol.delay(minutes=0.1)
            p200.blow_out()
            p200.move_to(CleanupPlate_2["A1"].top(z=5))
            p200.move_to(CleanupPlate_2["A1"].top(z=0))
            p200.move_to(CleanupPlate_2["A1"].top(z=5))
            # ================================================

            if DRYRUN is False:
                protocol.delay(minutes=0.5)

            protocol.comment("--> Remove ETOH Wash")
            RemoveSup = 200
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            # ===============================================
            p200.move_to(CleanupPlate_2["A1"].bottom(z=3.5))
            p200.aspirate(5, rate=0.25)
            protocol.delay(minutes=0.1)
            p200.move_to(CleanupPlate_2["A1"].bottom(z=0.5))
            p200.aspirate(5, rate=0.25)
            p200.default_speed = 5
            p200.move_to(CleanupPlate_2["A1"].top(z=2))
            p200.default_speed = 200
            p200.dispense(10, LW_reservoir["A1"].top(z=-7))
            protocol.delay(minutes=0.1)
            p200.blow_out()
            p200.default_speed = 400
            p200.move_to(LW_reservoir["A1"].top(z=-7))
            p200.move_to(LW_reservoir["A1"].top(z=0))
            p200.return_tip()
            # ===============================================

            if DRYRUN is False:
                protocol.delay(minutes=1)

            # ============================================================================================
            protocol.comment("MOVING: tiprack_20_XX = SCP_Position --> B4")
            protocol.move_labware(
                labware=tiprack_20_XX,
                new_location=tiprack_A3_adapter,
                use_gripper=True,
                pick_up_offset=deck_pick_up_offset,
                drop_offset=deck_drop_offset,
            )
            protocol.comment("MOVING: tiprack_50_X = C4 --> SCP_Position")
            protocol.move_labware(
                labware=tiprack_50_X,
                new_location=tiprack_C2_adapter,
                use_gripper=True,
                pick_up_offset=deck_pick_up_offset,
                drop_offset=deck_drop_offset,
            )
            # ============================================================================================

            protocol.comment("--> Adding RSB")
            RSBVol = 32
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            nozzlecheck("R8", tiprack_50_X)
            # ===============================================
            p200.reset_tipracks()
            p200.pick_up_tip()
            p200.aspirate(RSBVol, RSB_1.bottom(z=1))
            p200.move_to(
                (
                    CleanupPlate_2.wells_by_name()["A1"]
                    .center()
                    .move(types.Point(x=1.3 * 0.8, y=0, z=-4))
                )
            )
            p200.dispense(RSBVol)
            p200.move_to(CleanupPlate_2.wells_by_name()["A1"].bottom(z=1))
            p200.aspirate(RSBVol)
            p200.move_to(
                (
                    CleanupPlate_2.wells_by_name()["A1"]
                    .center()
                    .move(types.Point(x=0, y=1.3 * 0.8, z=-4))
                )
            )
            p200.dispense(RSBVol)
            p200.move_to(CleanupPlate_2.wells_by_name()["A1"].bottom(z=1))
            p200.aspirate(RSBVol)
            p200.move_to(
                (
                    CleanupPlate_2.wells_by_name()["A1"]
                    .center()
                    .move(types.Point(x=1.3 * -0.8, y=0, z=-4))
                )
            )
            p200.dispense(RSBVol)
            p200.move_to(CleanupPlate_2.wells_by_name()["A1"].bottom(z=1))
            p200.aspirate(RSBVol)
            p200.move_to(
                (
                    CleanupPlate_2.wells_by_name()["A1"]
                    .center()
                    .move(types.Point(x=0, y=1.3 * -0.8, z=-4))
                )
            )
            p200.dispense(RSBVol)
            p200.move_to(CleanupPlate_2.wells_by_name()["A1"].bottom(z=1))
            p200.aspirate(RSBVol)
            p200.dispense(RSBVol)
            p200.blow_out(CleanupPlate_2.wells_by_name()["A1"].center())
            p200.move_to(CleanupPlate_2.wells_by_name()["A1"].top(z=5))
            p200.move_to(CleanupPlate_2.wells_by_name()["A1"].top(z=0))
            p200.move_to(CleanupPlate_2.wells_by_name()["A1"].top(z=5))
            # ===============================================

            if DRYRUN is False:
                protocol.delay(minutes=3)

            protocol.comment("--> Transferring Supernatant")
            TransferSup = 30
            p200.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p200.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p200.flow_rate.blow_out = p50_flow_rate_blow_out_default * 0.5
            # ===============================================
            p200.move_to(CleanupPlate_2["A1"].bottom(z=0.5))
            p200.aspirate(TransferSup + 1, rate=0.25)
            p200.dispense(TransferSup + 1, sample_plate_3["A1"].bottom(z=1))
            p200.return_tip()
            # ===============================================

            while len(stacker_50_1.get_stored_labware()) != 0:
                reset_tiprack = stacker_50_1.retrieve()
                protocol.move_labware(
                    labware=reset_tiprack,
                    new_location=stacker_50_2,
                    use_gripper=True,
                )
                stacker_50_2.store()
        protocol.capture_image(filename="end_of_run")

    except Exception as e:
        raise (e)
