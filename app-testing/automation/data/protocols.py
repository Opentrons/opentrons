"""Map for protocol files available for testing."""
from automation.data.protocol import Protocol


class Protocols:
    """Describe protocols available for testing."""

    # The name of the property must match the file_name property
    # and be in protocol_files.names

    OT2_P20S_None_2_7_Walkthrough: Protocol = Protocol(
        file_name="OT2_P20S_None_2_7_Walkthrough",
        file_extension="py",
        protocol_name="OT-2 Guided Walk-through",
        robot="OT-2",
        app_error=False,
        robot_error=False,
    )

    OT2_None_None_2_13_PythonSyntaxError: Protocol = Protocol(
        file_name="OT2_None_None_2_13_PythonSyntaxError",
        file_extension="py",
        protocol_name="bad import",
        robot="OT-2",
        app_error=True,
        robot_error=True,
        app_analysis_error="No module named 'superspecialmagic'",
        robot_analysis_error="?",
    )

    OT2_P10S_P300M_TC1_TM_MM_2_11_Swift: Protocol = Protocol(
        file_name="OT2_P10S_P300M_TC1_TM_MM_2_11_Swift",
        file_extension="py",
        protocol_name="OT2_P10S_P300M_TC1_TM_MM_2_11_Swift.py",
        robot="OT-2",
        app_error=False,
        robot_error=False,
    )

    OT2_P300MLeft_MM_TM_2_4_Zymo: Protocol = Protocol(
        file_name="OT2_P300MLeft_MM_TM_2_4_Zymo",
        file_extension="py",
        protocol_name="Zymo Direct-zol96 Magbead RNA",
        robot="OT-2",
        app_error=False,
        robot_error=False,
    )

    OT2_P300S_Thermocycler_Moam_Error: Protocol = Protocol(
        file_name="OT2_P300S_Thermocycler_Moam_Error",
        file_extension="py",
        protocol_name="OT2_P300S_Thermocycler_Moam_Error.py",
        robot="OT-2",
        app_error=True,
        robot_error=True,
        app_analysis_error="DeckConflictError [line 19]: thermocyclerModuleV2 in slot 7 prevents thermocyclerModuleV1 from using slot 7.",  # noqa: E501
        robot_analysis_error="?",
    )

    OT2_P300S_Twinning_Error: Protocol = Protocol(
        file_name="OT2_P300S_Twinning_Error",
        file_extension="py",
        protocol_name="My Protocol",
        robot="OT-2",
        app_error=True,
        robot_error=True,
        app_analysis_error="AttributeError [line 24]: 'InstrumentContext' object has no attribute 'pair_with'",
        robot_analysis_error="?",
    )

    OT2_P20S_P300M_NoMods_6_1_TransferReTransferLiquid: Protocol = Protocol(
        file_name="OT2_P20S_P300M_NoMods_6_1_TransferReTransferLiquid",
        file_extension="json",
        protocol_name="Transfer- Multi liquid (retransfer)",
        robot="OT-2",
        app_error=False,
        robot_error=False,
    )

    OT2_P300M_P20S_MM_HS_TD_TC_6_1_AllMods_Error: Protocol = Protocol(
        file_name="OT2_P300M_P20S_MM_HS_TD_TC_6_1_AllMods_Error",
        file_extension="json",
        protocol_name="All mods",
        robot="OT-2",
        app_error=True,
        robot_error=True,
        app_analysis_error="Heater-Shaker cannot open its labware latch while it is shaking.",
        robot_analysis_error="?",
    )

    OT2_P300M_P20S_NoMod_6_1_MixTransferManyLiquids: Protocol = Protocol(
        file_name="OT2_P300M_P20S_NoMod_6_1_MixTransferManyLiquids",
        file_extension="json",
        protocol_name="Mix/transfer- several liquids",
        robot="OT-2",
        app_error=False,
        robot_error=False,
    )

    OT2_P300M_P300S_HS_6_1_HS_NormalUseWithTransfer: Protocol = Protocol(
        file_name="OT2_P300M_P300S_HS_6_1_HS_NormalUseWithTransfer",
        file_extension="json",
        protocol_name="H/S normal use",
        robot="OT-2",
        app_error=False,
        robot_error=False,
    )

    OT2_P20S_P300M_HS_6_1_HS_WithCollision_Error: Protocol = Protocol(
        file_name="OT2_P20S_P300M_HS_6_1_HS_WithCollision_Error",
        file_extension="json",
        protocol_name="HS Collision",
        robot="OT-2",
        app_error=False,
        robot_error=False,
        description="""
            This protocol gives an error in PD.
            8-Channel pipette cannot access labware
            8-Channel pipettes cannot access labware or tip racks to the left or right of 
            a Heater-Shaker GEN1 module. Move labware to a different slot to access it 
            with an 8-Channel pipette.
            If you export it anyway there are NOT analysis errors in the app side analysis.
            TODO on if there are robot side analysis errors but do not expect them?
            """,
    )

    OT2_P300SLeft_MM1_MM_TM_2_3_Mix: Protocol = Protocol(
        file_name="OT2_P300SLeft_MM1_MM_TM_2_3_Mix",
        file_extension="py",
        protocol_name="OT2_P300SLeft_MM1_MM_TM_2_3_Mix.py",
        robot="OT-2",
        app_error=False,
        robot_error=False,
    )

    OT2_P300SLeft_MM1_MM_2_2_EngageMagHeightFromBase: Protocol = Protocol(
        file_name="OT2_P300SLeft_MM1_MM_2_2_EngageMagHeightFromBase",
        file_extension="py",
        protocol_name="OT2_P300SLeft_MM1_MM_2_2_EngageMagHeightFromBase.py",
        robot="OT-2",
        app_error=False,
        robot_error=False,
    )

    OT2_P300M_P20S_TC_MM_TM_6_13_Smoke620Release: Protocol = Protocol(
        file_name="OT2_P300M_P20S_TC_MM_TM_6_13_Smoke620Release",
        file_extension="py",
        protocol_name="🛠 Logo-Modules-CustomLabware 🛠",
        robot="OT-2",
        app_error=False,
        robot_error=False,
        custom_labware=["cpx_4_tuberack_100ul"],
    )

    OT2_P300SLeft_MM_TM_TM_5_2_6_MOAMTemps: Protocol = Protocol(
        file_name="OT2_P300SLeft_MM_TM_TM_5_2_6_MOAMTemps",
        file_extension="json",
        protocol_name="MoaM",
        robot="OT-2",
        app_error=False,
        robot_error=False,
    )

    OT2_P20SRight_None_6_1_SimpleTransferError: Protocol = Protocol(
        file_name="OT2_P20SRight_None_6_1_SimpleTransferError",
        file_extension="json",
        protocol_name="Have Pipette",
        robot="OT-2",
        app_error=True,
        robot_error=True,
        app_analysis_error="Cannot aspirate more than pipette max volume",
        robot_analysis_error="?",
    )

    OT2_P300M_P20S_MM_TM_TC1_5_2_6_PD40: Protocol = Protocol(
        file_name="OT2_P300M_P20S_MM_TM_TC1_5_2_6_PD40",
        file_extension="json",
        protocol_name="script_pur_sample_1",
        robot="OT-2",
        app_error=False,
        robot_error=False,
    )

    OT2_P300M_P20S_None_2_12_FailOnRun: Protocol = Protocol(
        file_name="OT2_P300M_P20S_None_2_12_FailOnRun",
        file_extension="py",
        protocol_name="Will fail on run",
        robot="OT-2",
        app_error=False,
        robot_error=False,
    )

    OT2_P300SG1_None_5_2_6_Gen1PipetteSimple: Protocol = Protocol(
        file_name="OT2_P300SG1_None_5_2_6_Gen1PipetteSimple",
        file_extension="json",
        protocol_name="gen1 pipette",
        robot="OT-2",
        app_error=False,
        robot_error=False,
    )

    OT2_P1000SLeft_None_6_1_SimpleTransfer: Protocol = Protocol(
        file_name="OT2_P1000SLeft_None_6_1_SimpleTransfer",
        file_extension="json",
        protocol_name="Need Pipette",
        robot="OT-2",
        app_error=False,
        robot_error=False,
    )

    OT2_P300M_P20S_HS_6_1_Smoke620release: Protocol = Protocol(
        file_name="OT2_P300M_P20S_HS_6_1_Smoke620release",
        file_extension="json",
        protocol_name="H/S normal use",
        robot="OT-2",
        app_error=False,
        robot_error=False,
    )

    OT2_P300M_P20S_MM_TM_TC1_5_2_6_PD40Error: Protocol = Protocol(
        file_name="OT2_P300M_P20S_MM_TM_TC1_5_2_6_PD40Error",
        file_extension="json",
        protocol_name="script_pur_sample_1",
        robot="OT-2",
        app_error=True,
        robot_error=True,
        app_analysis_error="Cannot aspirate more than pipette max volume",
        robot_analysis_error="?",
    )

    OT2_None_None_2_12_Python310SyntaxRobotAnalysisOnlyError: Protocol = Protocol(
        file_name="OT2_None_None_2_12_Python310SyntaxRobotAnalysisOnlyError",
        file_extension="py",
        protocol_name="🛠 3.10 only Python 🛠",
        robot="OT-2",
        app_error=False,
        robot_error=True,
        robot_analysis_error="?",
    )

    OT3_P1000_96_HS_TM_MM_2_15_MagMaxRNACells96Ch: Protocol = Protocol(
        file_name="OT3_P1000_96_HS_TM_MM_2_15_MagMaxRNACells96Ch",
        file_extension="py",
        protocol_name="MagMax RNA Extraction: Cells 96 ABR TESTING",
        robot="OT-3",
        app_error=False,
        robot_error=False,
        custom_labware=["opentrons_ot3_96_tiprack_200ul_rss"],
    )

    OT3_P1000SRight_None_2_15_ABR_Simple_Normalize_Long_Right: Protocol = Protocol(
        file_name="OT3_P1000SRight_None_2_15_ABR_Simple_Normalize_Long_Right",
        file_extension="py",
        protocol_name="OT3 ABR Simple Normalize Long",
        robot="OT-3",
        app_error=False,
        robot_error=False,
        custom_labware=["opentrons_ot3_96_tiprack_200ul_rss"],
    )

    OT3_P50MLeft_P1000MRight_None_2_15_ABRKAPALibraryQuantLongv2: Protocol = Protocol(
        file_name="OT3_P50MLeft_P1000MRight_None_2_15_ABRKAPALibraryQuantLongv2",
        file_extension="py",
        protocol_name="OT3 ABR KAPA Library Quant v2",
        robot="OT-3",
        app_error=False,
        robot_error=False,
    )

    OT3_P1000MLeft_P50MRight_HS_MM_TC_TM_2_15_ABR3_Illumina_DNA_Enrichment_v4: Protocol = Protocol(
        file_name="OT3_P1000MLeft_P50MRight_HS_MM_TC_TM_2_15_ABR3_Illumina_DNA_Enrichment_v4",
        file_extension="py",
        protocol_name="Illumina DNA Enrichment v4",
        robot="OT-3",
        app_error=False,
        robot_error=False,
    )

    OT3_P1000MLeft_P50MRight_HS_MM_TC_TM_2_15_ABR3_Illumina_DNA_Enrichment: Protocol = Protocol(
        file_name="OT3_P1000MLeft_P50MRight_HS_MM_TC_TM_2_15_ABR3_Illumina_DNA_Enrichment",
        file_extension="py",
        protocol_name="Illumina DNA Enrichment",
        robot="OT-3",
        app_error=False,
        robot_error=False,
    )

    OT3_P1000MLeft_P50MRight_HS_TM_MM_TC_2_15_ABR4_Illumina_DNA_Prep_24x: Protocol = Protocol(
        file_name="OT3_P1000MLeft_P50MRight_HS_TM_MM_TC_2_15_ABR4_Illumina_DNA_Prep_24x",
        file_extension="py",
        protocol_name="Illumina DNA Prep 24x",
        robot="OT-3",
        app_error=False,
        robot_error=False,
    )

    OT3_P1000_96_HS_TM_MM_2_15_ABR5_6_HDQ_Bacteria_ParkTips_96_channel: Protocol = Protocol(
        file_name="OT3_P1000_96_HS_TM_MM_2_15_ABR5_6_HDQ_Bacteria_ParkTips_96_channel",
        file_extension="py",
        protocol_name="Omega HDQ DNA Extraction: Bacteria 96 FOR ABR TESTING",
        robot="OT-3",
        app_error=False,
        robot_error=False,
        custom_labware=["opentrons_ot3_96_tiprack_1000ul_rss"],
    )

    OT3_P1000_96_None_2_15_ABR5_6_IDT_xGen_EZ_96x_Head_PART_I_III_ABR: Protocol = Protocol(
        file_name="OT3_P1000_96_None_2_15_ABR5_6_IDT_xGen_EZ_96x_Head_PART_I_III_ABR",
        file_extension="py",
        protocol_name="IDT xGen EZ 96x Head PART I-III ABR",
        robot="OT-3",
        app_error=False,
        robot_error=False,
        custom_labware=["opentrons_ot3_96_tiprack_50ul_rss", "opentrons_ot3_96_tiprack_200ul_rss"],
    )

    OT3_P1000_96_HS_TM_TC_MM_2_15_ABR5_6_Illumina_DNA_Prep_96x_Head_PART_III: Protocol = Protocol(
        file_name="OT3_P1000_96_HS_TM_TC_MM_2_15_ABR5_6_Illumina_DNA_Prep_96x_Head_PART_III",
        file_extension="py",
        protocol_name="Illumina DNA Prep 96x Head PART III",
        robot="OT-3",
        app_error=False,
        robot_error=False,
        custom_labware=["opentrons_ot3_96_tiprack_200ul_rss", "opentrons_ot3_96_tiprack_50ul_rss"],
    )

    OT3_P100_96_HS_TM_2_15_Quick_Zymo_RNA_Bacteria: Protocol = Protocol(
        file_name="OT3_P100_96_HS_TM_2_15_Quick_Zymo_RNA_Bacteria",
        file_extension="py",
        protocol_name="Quick Zymo Magbead RNA Extraction with Lysis: Bacteria 96 Channel Deletion Test",
        robot="OT-3",
        app_error=False,
        robot_error=False,
        custom_labware=["opentrons_ot3_96_tiprack_1000ul_rss"],
    )
