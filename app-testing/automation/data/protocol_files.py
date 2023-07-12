"""Define the possible names of protocol files to use in testing."""
from typing import Literal

names = Literal[
    "OT2_P1000SLeft_None_6_1_SimpleTransfer",
    "OT2_P20SRight_None_6_1_SimpleTransferError",
    "OT2_P20S_P300M_HS_6_1_HS_WithCollision_Error",
    "OT2_P20S_P300M_NoMods_6_1_TransferReTransferLiquid",
    "OT2_P300M_P20S_HS_6_1_Smoke620release",
    "OT2_P300M_P20S_MM_HS_TD_TC_6_1_AllMods_Error",
    "OT2_P300M_P20S_MM_TM_TC1_5_2_6_PD40",
    "OT2_P300M_P20S_MM_TM_TC1_5_2_6_PD40Error",
    "OT2_P300M_P20S_NoMod_6_1_MixTransferManyLiquids",
    "OT2_P300M_P300S_HS_6_1_HS_NormalUseWithTransfer",
    "OT2_P300SG1_None_5_2_6_Gen1PipetteSimple",
    "OT2_P300SLeft_MM_TM_TM_5_2_6_MOAMTemps",
    "OT2_None_None_2_12_Python310SyntaxRobotAnalysisOnlyError",
    "OT2_None_None_2_13_PythonSyntaxError",
    "OT2_P10S_P300M_TC1_TM_MM_2_11_Swift",
    "OT2_P20S_None_2_7_Walkthrough",
    "OT2_P300MLeft_MM_TM_2_4_Zymo",
    "OT2_P300M_P20S_None_2_12_FailOnRun",
    "OT2_P300M_P20S_TC_MM_TM_6_13_Smoke620Release",
    "OT2_P300SLeft_MM1_MM_2_2_EngageMagHeightFromBase",
    "OT2_P300SLeft_MM1_MM_TM_2_3_Mix",
    "OT2_P300S_Thermocycler_Moam_Error",
    "OT2_P300S_Twinning_Error",
]
