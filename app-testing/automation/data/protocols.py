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

    OT2_Python_Syntax_Error: Protocol = Protocol(
        file_name="OT2_Python_Syntax_Error",
        file_extension="py",
        protocol_name="bad import",
        robot="OT-2",
        app_error=True,
        robot_error=True,
        app_analysis_error="No module named 'superspecialmagic'",
        robot_analysis_error="?",
    )

    OT2_P10S_P300M_All_Modules_Swift: Protocol = Protocol(
        file_name="OT2_P10S_P300M_All_Modules_Swift",
        file_extension="py",
        protocol_name="OT2_P10S_P300M_All_Modules_Swift.py",
        robot="OT-2",
        app_error=False,
        robot_error=False,
    )

    OT2_P300M_Mag_Temp_Zymo: Protocol = Protocol(
        file_name="OT2_P300M_Mag_Temp_Zymo",
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

    OT2_S20_M300_NoMods_6_1_TransferReTransferLiquid: Protocol = Protocol(
        file_name="OT2_S20_M300_NoMods_6_1_TransferReTransferLiquid",
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

    OT2_P20S_P300M_NoMod_6_1_MixTransferManyLiquids: Protocol = Protocol(
        file_name="OT2_P20S_P300M_NoMod_6_1_MixTransferManyLiquids",
        file_extension="json",
        protocol_name="Mix/transfer- several liquids",
        robot="OT-2",
        app_error=False,
        robot_error=False,
    )

    OT2_P20S_P300M_HS_6_1_HS_NormalUseWithTransfer: Protocol = Protocol(
        file_name="OT2_P20S_P300M_HS_6_1_HS_NormalUseWithTransfer",
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

    OT2_API_level_2_3: Protocol = Protocol(
        file_name="OT2_API_level_2_3",
        file_extension="py",
        protocol_name="OT2_API_level_2_3.py",
        robot="OT-2",
        app_error=False,
        robot_error=False,
    )

    OT2_API_level_2_2: Protocol = Protocol(
        file_name="OT2_API_level_2_2",
        file_extension="py",
        protocol_name="OT2_API_level_2_2.py",
        robot="OT-2",
        app_error=False,
        robot_error=False,
    )
