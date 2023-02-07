# DB Snapshot

1. Use the app installer to install the app version you are testing
1. Reinstall the robot version to ensure matching version
1. Clear the DB on the robot (no need to clear calibrations)
1. Proceed through setup including LPC and dry run `OT2_P300M_P20S_TC_MM_TM_6_13_Smoke620release.py`
   1. PAPIv2.13 successful run
1. Proceed through setup including LPC and dry run `OT2_P300M_P20S_HS_6_1_Smoke620Release.json`
   1. PD 6.1 JSON Schema v6 successful run
1. Proceed through setup including LPC and dry run `OT2_P300M_P20S_MM_TM_TC1_5_2_6_PD40.json`
   1. PD 4 JSON Schema v5 successful run
1. Proceed through setup including LPC and dry run `OT2_P300M_P20S_None_2_12_FailOnRun.py`
   1. PAPIv2.12 failure during run
1. Use the API to create a run and run `OT2_P1000SLeft_None_6_1_SimpleTransfer.json`
   1. PD 6.1 JSON Schema v6 failure during run due to pipette not attached
   1. Fails on setup due to pipette not attached
1. Use the API to create a run and run `OT2_P20SRight_None_6_1_SimpleTransferError.json`
   1. PD 6.1 JSON Schema v6 failure during run due to pipetting a volume greater than pipette capacity
   1. JSON Schema v6 analysis failure
   1. Fails on step where volume too large (line 1898)
1. Use the API to create a run and run `OT2_P300M_P20S_MM_TM_TC1_5_2_6_PD40Error.json`
   1. PD 4 JSON Schema v5 failure during run due to pipetting a volume greater than pipette capacity (line 6343)
   1. JSON Schema v5 analysis failure
1. Start a run and power off after ~30 steps during the run with `OT2_P300M_P20S_TC_MM_TM_6_13_Smoke620release.py`
   1. Power off
1. Start a run, pause, resume, then cancel ~20 steps in with `OT2_P300MLeft_MM_TM_2_4_Zymo.py`
   1. Pause and Cancel python protocol
1. Start a run, pause, resume, then cancel ~20 steps in with `OT2_P300M_P20S_NoMod_6_1_MixTransferManyLiquids.json`
   1. Pause and Cancel json protocol
1. Proceed to run despite analysis failure in the app with `OT_2_None_None_2_12_Python310SyntaxRobotAnalysisOnlyError.py`
   1. Analysis error python protocol
1. Proceed to run but cancel before run `OT2_P10S_P300M_TC1_TM_MM_2_11_Swift.py`
   1. Complex python v2 protocol analysis
1. Proceed to run but cancel before run `???`
   1. Complex json v5 protocol analysis
   1. TODO
1. Power off robot and power on
1. Retrieve robot DB
