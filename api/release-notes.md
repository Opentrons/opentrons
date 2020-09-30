# Robot OS Changes from 3.20.1 to 3.21.0

For more details about this release, please see the full [technical change
log][]. For a list of currently known issues, please see the [Opentrons issue tracker][].

[technical change log]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md
[opentrons issue tracker]: https://github.com/Opentrons/opentrons/issues?q=is%3Aopen+is%3Aissue+label%3Abug

## Fixes

- Prevent HardLimitErrors when jogging during labware calibration
  - The robot will now refuse to execute jog commands if it thinks doing so will cause it to hit an axis limit
- Do not overwrite custom flow rates when new pipettes are loaded
  - Previously, in Python protocols, loading a second pipette would cause any custom settings of the first pipette to be overwritten
- Better handling of set temperature commands for thermocyclers
  - A race condition in the driver code could cause consecutive set temperature commands to a thermocycler to fail
- Prevent extra pipette movement after homing
- Add missing documentation for "unloading" labware from a slot in Python protocols
  - Thanks to Theo Sanderson for their contributions in [PR 6260][]!

[pr 6260]: https://github.com/Opentrons/opentrons/pull/6260

## Features

- Check if an instrument has a tip through the Python Protocol API
  - Using `apiLevel: '2.7'` in your Python protocol will allow you to access the new `has_tip` property of a given pipette
- Allow the Opentrons App to get and set the OT-2's clock
  - If your OT-2 is not connected to the internet, it can have trouble getting the correct time for its internal clock
  - The Opentrons App can now set your OT-2's time, which should prevent miscommunication between your app and OT-2
- New packages and libraries for the OT-2's embedded Linux environment
  - `curl`, `wget`, and `git` to retrieve content for complex workflows
  - `grep` and `sl` because no command-line environment is complete without them
  - `screen` and `tmux` for all your persistent session and terminal multiplexing needs
  - Python bindings for `curses` so you can write your own curses
  - Thanks to Theo Sanderson for their contributions in [PR 102][]!

[pr 102]: https://github.com/Opentrons/buildroot/pull/102
