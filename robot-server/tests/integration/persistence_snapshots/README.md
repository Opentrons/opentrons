# Overview

This directory has examples of what a real robot might have in its `robot-server` persistence directory. (See the environment variable `OT_ROBOT_SERVER_persistence_directory` for background.)

These help with testing schema migration and backwards compatibility.

# Snapshot notes

## v6.0.1

This snapshot comes from a v6.0.1 dev server (run with `make -C robot-server dev`).

It includes these protocols, which were uploaded by manually issuing HTTP `POST` requests:

* [simpleV6.json](https://github.com/Opentrons/opentrons/blob/4f9c72ab076692a377afc7245e857385935763a8/shared-data/protocol/fixtures/6/simpleV6.json)
* [multipleTipracksWithTC.json](https://github.com/Opentrons/opentrons/blob/4f9c72ab076692a377afc7245e857385935763a8/shared-data/protocol/fixtures/6/multipleTipracksWithTC.json)
* [tempAndMagModuleCommands.json](https://github.com/Opentrons/opentrons/blob/4f9c72ab076692a377afc7245e857385935763a8/shared-data/protocol/fixtures/6/tempAndMagModuleCommands.json)
* [swift_smoke.py](https://github.com/Opentrons/opentrons/blob/4f9c72ab076692a377afc7245e857385935763a8/g-code-testing/g_code_test_data/protocol/protocols/slow/swift_smoke.py)

The JSON protocols were chosen to cover a wide breadth of Protocol Engine commands.

Each protocol has one completed analysis and one successful run. multipleTipracksWithTC.json also has one failed run from a mismatched pipette error.
