"""Define the possible names of protocol files to use in testing."""

from typing import Literal

names = Literal[
    "v2_16_NO_PIPETTES_TC_TrashBinAndThermocyclerConflict",
    "v2_16_NO_PIPETTES_AccessToFixedTrashProp",
    "v2_16_NO_PIPETTES_TrashBinInCol2",
    "v2_16_P1000_96_TC_pipetteCollisionWithThermocyclerLidClips",
    "v2_16_NO_PIPETTES_TM_ModuleInStagingAreaCol4",
    "v2_16_NO_PIPETTES_TM_ModuleInStagingAreaCol3",
    "v2_16_P1000_96_TC_PartialTipPickupThermocyclerLidConflict",
    "v2_16_P1000_96_DropTipsWithNoTrash",
    "v2_16_P1000_96_TC_PartialTipPickupTryToReturnTip",
    "v2_16_NO_PIPETTES_TM_ModuleInCol2",
    "v2_16_P1000_96_GRIP_DropLabwareIntoTrashBin",
    "v2_16_P1000_96_TM_ModuleAndWasteChuteConflict",
    "v2_16_NO_PIPETTES_TrashBinInStagingAreaCol4",
    "v2_16_NO_PIPETTES_MM_MagneticModuleInFlexProtocol",
    "v8_P1000_96_HS_GRIP_TC_TM_GripperCollisionWithTips",
    "v2_16_P300MGen2_None_OT2PipetteInFlexProtocol",
    "v2_16_P1000_96_TC_pipetteCollisionWithThermocyclerLid",
    "v2_16_NO_PIPETTES_TrashBinInStagingAreaCol3",
    "v2_15_P50M_P1000M_KAPALibraryQuantLongv2",
    "v2_16_NO_PIPETTES_TC_verifyThermocyclerLoadedSlots",
    "v2_16_P1000_96_GRIP_HS_MB_TC_TM_DeckConfiguration1",
    "v2_15_P1000_96_GRIP_HS_MB_TC_TM_IlluminaDNAPrep96PART3",
    "v2_17_NO_PIPETTES_TC_verifyThermocyclerLoadedSlots",
    "v2_16_P1000_96_GRIP_HS_MB_TC_TM_Smoke",
    "v2_16_P1000_96_GRIP_HS_MB_TC_TM_DeckConfiguration1NoFixtures",
    "v2_18_NO_PIPETTES_GoldenRTP",
    "v2_15_P1000_96_GRIP_HS_TM_QuickZymoMagbeadRNAExtraction",
    "v2_15_P1000M_P50M_GRIP_HS_MB_TC_TM_IlluminaDNAPrep24x",
    "v2_15_P1000S_None_SimpleNormalizeLongRight",
    "v2_16_P1000_96_GRIP_HS_MB_TC_TM_TriggerPrepareForMountMovement",
    "v2_15_P1000_96_GRIP_HS_MB_TM_OmegaHDQDNAExtraction",
    "v2_16_P1000_96_TC_PartialTipPickupSingle",
    "v2_15_P1000_96_GRIP_HS_MB_TC_TM_IDTXgen96Part1to3",
    "v2_15_P1000M_P50M_GRIP_HS_MB_TC_TM_IlluminaDNAEnrichment",
    "v2_15_NO_PIPETTES_TC_verifyThermocyclerLoadedSlots",
    "v2_15_P1000_96_GRIP_HS_MB_TM_MagMaxRNAExtraction",
    "v2_16_P1000_96_GRIP_DeckConfiguration1NoModules",
    "v2_16_P1000_96_TC_PartialTipPickupColumn",
    "v2_16_P1000_96_GRIP_DeckConfiguration1NoModulesNoFixtures",
    "v2_18_NO_PIPETTES_BadTypesInRTP",
    "v2_15_P1000M_P50M_GRIP_HS_MB_TC_TM_IlluminaDNAEnrichmentv4",
    "v2_14_NO_PIPETTES_TC_verifyThermocyclerLoadedSlots",
    "v2_7_P300S_TwinningError",
    "v2_13_None_None_PythonSyntaxError",
    "v2_16_None_None_HS_HeaterShakerConflictWithTrashBin1",
    "v6_P20S_None_SimpleTransfer",
    "v2_16_None_None_HS_HeaterShakerConflictWithTrashBin2",
    "v4_P300M_P20S_MM_TC1_TM_e2eTests",
    "v6_P300M_P20S_HS_MM_TM_TC_AllMods",
    "v2_11_P300S_TC1_TC2_ThermocyclerMoamError",
    "v6_P20S_P300M_HS_HSCollision",
    "v2_11_P10S_P300M_MM_TC1_TM_Swift",
    "v2_12_NO_PIPETTES_Python310SyntaxRobotAnalysisOnlyError",
    "v2_16_P300S_None_verifyNoFloatingPointErrorInPipetting",
    "v2_16_P300M_P20S_aspirateDispenseMix0Volume",
    "v6_P20S_P300M_TransferReTransferLiquid",
    "v2_17_P300M_P20S_HS_TC_TM_dispense_changes",
    "v2_15_NO_PIPETTES_TC_VerifyThermocyclerLoadedSlots",
    "v6_P300M_P20S_HS_Smoke620release",
    "v6_P300M_P300S_HS_HS_NormalUseWithTransfer",
    "v6_P1000S_None_SimpleTransfer",
    "v2_15_P300M_P20S_HS_TC_TM_dispense_changes",
    "v2_16_NO_PIPETTES_TC_VerifyThermocyclerLoadedSlots",
    "v2_7_P20S_None_Walkthrough",
    "v2_17_NO_PIPETTES_TC_VerifyThermocyclerLoadedSlots",
    "v6_P300M_P20S_MixTransferManyLiquids",
    "v3_P300SGen1_None_Gen1PipetteSimple",
    "v2_4_P300M_None_MM_TM_Zymo",
    "v2_15_P300M_P20S_HS_TC_TM_SmokeTestV3",
    "v2_13_P300M_P20S_HS_TC_TM_SmokeTestV3",
    "v2_16_P300M_P20S_HS_TC_TM_dispense_changes",
    "v2_17_P300M_P20S_HS_TC_TM_SmokeTestV3",
    "v2_13_P300M_P20S_MM_TC_TM_Smoke620Release",
    "v2_14_P300M_P20S_HS_TC_TM_SmokeTestV3",
    "v2_2_P300S_None_MM1_MM2_EngageMagHeightFromBase",
    "v2_12_P300M_P20S_FailOnRun",
    "v2_3_P300S_None_MM1_MM2_TM_Mix",
    "v4_P300M_P20S_MM_TM_TC1_PD40",
    "v2_16_P300M_P20S_HS_TC_TM_SmokeTestV3",
    "v2_14_NO_PIPETTES_TC_VerifyThermocyclerLoadedSlots",
    "v2_16_NO_PIPETTES_verifyDoesNotDeadlock",
    "v4_P300S_None_MM_TM_TM_MOAMTemps",
    "v2_16_P300M_P20S_HS_TC_TM_aspirateDispenseMix0Volume",
    "v2_18_NO_PIPETTES_Overrides_BadTypesInRTP",  # The one with overrides, children below
    "v2_18_NO_PIPETTES_Overrides_BadTypesInRTP_Override_wrong_type_in_display_name",
    "v2_18_NO_PIPETTES_Overrides_BadTypesInRTP_Override_wrong_type_in_variable_name",
    "v2_18_NO_PIPETTES_Overrides_BadTypesInRTP_Override_wrong_type_in_choice_display_name",
    "v2_18_NO_PIPETTES_Overrides_BadTypesInRTP_Override_wrong_type_in_choice_value",
    "v2_18_NO_PIPETTES_Overrides_BadTypesInRTP_Override_wrong_type_in_default",
    "v2_18_NO_PIPETTES_Overrides_BadTypesInRTP_Override_wrong_type_in_description",
    "v2_18_NO_PIPETTES_Overrides_BadTypesInRTP_Override_wrong_type_in_minimum",
    "v2_18_NO_PIPETTES_Overrides_BadTypesInRTP_Override_wrong_type_in_maximum",
    "v2_18_NO_PIPETTES_Overrides_BadTypesInRTP_Override_wrong_type_in_unit",
    "v2_18_NO_PIPETTES_Overrides_DefaultOutOfRangeRTP",
    "v2_18_NO_PIPETTES_Overrides_DefaultOutOfRangeRTP_Override_default_less_than_minimum",
    "v2_18_NO_PIPETTES_Overrides_DefaultOutOfRangeRTP_Override_default_greater_than_maximum",
    "v2_18_NO_PIPETTES_Overrides_DefaultChoiceNoMatchChoice",
    "v2_18_NO_PIPETTES_Overrides_DefaultChoiceNoMatchChoice_Override_str_default_no_matching_choices",
    "v2_18_NO_PIPETTES_Overrides_DefaultChoiceNoMatchChoice_Override_float_default_no_matching_choices",
    "v2_18_NO_PIPETTES_Overrides_DefaultChoiceNoMatchChoice_Override_int_default_no_matching_choices",
]
