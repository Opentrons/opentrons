# File Organization

## File Naming

Assuming Gen2 on Pipettes and modules; Include a suffix 1 if not.

### Naming Convention in order

- Robot (OT2 or Flex)
- Success (S) or Failure (X)
- PD or API version
- Pipettes (do your best)
- Modules
  - GRIP(gripper)
  - HS(heater shaker)
  - MM(magnetic module)
  - MB(magnetic block)
  - TC(Thermocycler)
  - TM(Temperature Module)
- Overrides `Overrides` or nothing
- Description (don't exceed 25 characters)

### Examples

#### .py

OT2_2.18_None_None_Overrides_BadTypesInRTP.py
OT2_2.16_None_None_AnalysisError_TrashBinInStagingAreaCol4.py
OT2_2.16_P1000_96_GRIPPER_HS_TM_TC_MB_DeckConfiguration1_NoFixtures.py

#### .json

OT2_5_2_6_P300M_P20S_MM_TM_TC1_PD40.json
