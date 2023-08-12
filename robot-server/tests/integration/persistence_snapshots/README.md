# Overview

This directory has examples of what a real robot might have in its `robot-server` persistence directory. (See the environment variable `OT_ROBOT_SERVER_persistence_directory` for background.)

These help with testing schema migration and backwards compatibility.

## Snapshot notes

### v6.0.1

This snapshot comes from a v6.0.1 dev server (run with `make -C robot-server dev`).

It includes these protocols, which were uploaded by manually issuing HTTP `POST` requests:

- [simpleV6.json](https://github.com/Opentrons/opentrons/blob/4f9c72ab076692a377afc7245e857385935763a8/shared-data/protocol/fixtures/6/simpleV6.json)
- [multipleTipracksWithTC.json](https://github.com/Opentrons/opentrons/blob/4f9c72ab076692a377afc7245e857385935763a8/shared-data/protocol/fixtures/6/multipleTipracksWithTC.json)
- [tempAndMagModuleCommands.json](https://github.com/Opentrons/opentrons/blob/4f9c72ab076692a377afc7245e857385935763a8/shared-data/protocol/fixtures/6/tempAndMagModuleCommands.json)
- [swift_smoke.py](https://github.com/Opentrons/opentrons/blob/4f9c72ab076692a377afc7245e857385935763a8/g-code-testing/g_code_test_data/protocol/protocols/slow/swift_smoke.py)

The JSON protocols were chosen to cover a wide breadth of Protocol Engine commands.

Each protocol has one completed analysis and one successful run. multipleTipracksWithTC.json also has one failed run from a mismatched pipette error.

### v6.1.0

This snapshot comes from v6.1.0 on a real non-refresh robot. The robot was restarted following the successful execution of both protocols.

The 2 protocols are to provide basic coverage of a python and json protocol. Each protocol has 1 successful analysis and run.

### v6.2.0

This snapshot comes from v6.2.0 on a real non-refresh robot. The robot was restarted following the successful execution of both protocols.

The 2 protocols are to provide basic coverage of a python and json protocol. Each protocol has 1 successful analysis and run.

**NOTE** This db will cause a downgrade migration issue if loaded on a robot with 6.1

### corrupt

Contains an invalid SQLite database file, to simulate a database that's been corrupted.

### v6.2.0_large

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
   1. Pause, resume and cancel python protocol
1. Start a run, pause, resume, then cancel ~20 steps in with `OT2_P300M_P20S_NoMod_6_1_MixTransferManyLiquids.json`
   1. Pause, resume and cancel JSON protocol
1. Proceed to run despite analysis failure in the app with `OT_2_None_None_2_12_Python310SyntaxRobotAnalysisOnlyError.py`
   1. Analysis error python protocol
1. Proceed to run but cancel before run `OT2_P10S_P300M_TC1_TM_MM_2_11_Swift.py`
   1. Complex python v2 protocol analysis
1. Proceed to run but cancel before run
   1. Complex JSON v5 protocol analysis
1. Power off robot and power on
1. Retrieve robot DB

### ot3_v0.14.0_python_validation

This has a single Python protocol and a single run of that protocol. The protocol file is valid on the Flex's internal release v0.14.0, but invalid for the first public release, because of additional validation of the `metadata` and `requirements` dicts that was added late during Flex development. See https://opentrons.atlassian.net/browse/RSS-306.
