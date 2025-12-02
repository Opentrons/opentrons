## Opentrons App Changes in 7.5.0

Welcome to the v7.5.0 release of the Opentrons App!

There are no changes to the Opentrons App in v7.5.0, but it is required for updating the robot software to support the [Opentrons Flex HEPA/UV Module](https://opentrons.com/products/opentrons-flex-hepa-uv-module) and the latest Flex Gripper model (serial numbers beginning `GRPV13`).

---


## Opentrons App Changes in 7.3.1

Welcome to the v7.3.1 release of the Opentrons App!

There are no changes to the Opentrons App in v7.3.1, but it is required for updating the robot software to improve some features.

### Known Issue

- Robots that have completed a run won't appear as available until you clear the run completion notification. This appears as a banner on the protocol run screen in the app, or as a splash screen on the Flex touchscreen.

---


## Opentrons App Changes in 7.3.0

Welcome to the v7.3.0 release of the Opentrons App! This release adds support for Python protocols with runtime parameters, letting you change the behavior of a protocol each time you run it.

Note: After updating, the app will prompt you to reanalyze all previously imported protocols. This is a one-time step and should not affect protocol behavior.

### New Features

Runtime Parameters

- Available runtime parameters are shown on the protocol details screen.
- Both the Opentrons App and touchscreen let you enter new parameter values during run setup.
- The app highlights changed parameter values so you can confirm them before starting the run.
- The run preview (before the run) and run log (after the run) reflect changes to steps based on your chosen parameter values.

Modules in Deck Configuration

- You can now specify what slots modules occupy on Flex in deck configuration.
- When moving, Flex will avoid modules specified in deck configuration but not loaded in the protocol.
- Deck configuration must be compatible with the protocol's requirements before you start a run.

### Improved Features

- Lists of robots are now sorted alphabetically.

### Removals

- Removed the "Use older protocol analysis method" advanced setting for OT-2. If you need this type of analysis, use `opentrons_simulate` on the command line.

### Bug Fixes

- All run log steps now appear in the same font size.
- The app now properly sends custom labware definitions, along with the corresponding Python protocol, to Flex robots connected via USB.

### Known Issues

- Previously saved labware offset data may not be available when setting up a run via a USB connection from a Windows computer. Re-run Labware Position Check or use a Wi-Fi connection instead.
- If you apply labware offset data for a particular type of labware, and then load a different type of labware in its place via a runtime parameter, the new labware type will have default offsets (0.0 on all axes). Re-run Labware Position Check to set offsets for the new labware.

---


## Opentrons App Changes in 7.2.2

Welcome to the v7.2.2 release of the Opentrons App!

There are no changes to the Opentrons App in v7.2.2, but it is required for updating the robot software to improve some features.

---


## Opentrons App Changes in 7.2.1

Welcome to the v7.2.1 release of the Opentrons App!

### Bug Fixes

- Fixed a memory leak that could cause the app to crash.

---


## Opentrons App Changes in 7.2.0

Welcome to the v7.2.0 release of the Opentrons App!

The Linux version of the Opentrons App now requires Ubuntu 20.04 or newer.

### New Features

- Added a warning in case you need to manually remove tips from a pipette after power cycling the robot.

### Improved Features

- Commands involving the trash bin or waste chute now appear in the run preview.
- The app will prompt you to reanalyze protocols that haven't been analyzed in such a long time that intervening changes to the app could affect their behavior.

### Bug Fixes

- The OT-2 now consistently applies tip length calibration. There used to be a height discrepancy between Labware Position Check and protocol runs. If you previously compensated for the inconsistent pipette height with labware offsets, re-run Labware Position Check to avoid pipette crashes.
- The OT-2 now accurately calculates the position of the Thermocycler. If you previously compensated for the incorrect position with labware offsets, re-run Labware Position Check to avoid pipette crashes.

### Known Issues

- It's possible to start conflicting instrument detachment workflows when controlling one robot from multiple computers. Verify that the robot is idle before starting instrument detachment.
- Robots may fail to reconnect after renaming them over a USB connection on Windows.

---


## Opentrons App Changes in 7.1.1

Welcome to the v7.1.1 release of the Opentrons App!

### Bug Fixes

- The app properly displays Flex 1-Channel 1000 µL pipettes.

---


## Opentrons App Changes in 7.1.0

Welcome to the v7.1.0 release of the Opentrons App! This release includes new deck and pipette functionality for Opentrons Flex, a new workflow for dropping tips after a protocol is canceled, and other improvements.

### New Features

- Specify the deck configuration of Flex, including the movable trash bin, waste chute, and staging area slots.
- Resolve conflicts between the hardware a protocol requires and the current deck configuration as part of run setup.
- Run protocols that use the Flex 96-Channel Pipette, including partial tip pickup.
- Choose where to dispense liquid and drop tips held by a pipette when a protocol is canceled.

### Improved Features

- Labware Position Check on Flex uses the pipette calibration probe, instead of a tip, for greater accuracy.

### Bug Fixes

- Labware Position Check no longer tries to check the same labware in the same position twice, which was leading to errors.

---


## Opentrons App Changes in 7.0.2

Welcome to the v7.0.2 release of the Opentrons App!

### Bug Fixes

- Fixes an issue where robot system updates over USB were stalling
- Fixes an issue where app protocol analysis would fail if you had Python 3.10 installed on your computer and installed the opentrons package there

---


## Opentrons App Changes in 7.0.1

Welcome to the v7.0.1 release of the Opentrons App! This release builds on the major release that added support for Opentrons Flex.

### Improved Features

- Pipettes move higher during Labware Position Check to avoid crashes in all deck slots, not just those with labware loaded in the protocol.

### Bug Fixes

- The app no longer blocks running valid protocols due to "not valid JSON" or "apiLevel not declared" errors.
- Robot commands, like turning the lights on or off, no longer take a long time to execute.

---


## Opentrons App Changes in 7.0.0

Welcome to the v7.0.0 release of the Opentrons App! This release adds support for the Opentrons Flex robot, instruments, modules, and labware.

### New Features

Opentrons Flex features

- Connect to Opentrons Flex robots via Wi-Fi, Ethernet, or USB.
- Send a protocol to Opentrons Flex. Protocols are stored on the Flex robot and can be run from the touchscreen.
- Run protocols that automatically move labware with the Flex Gripper, including onto and off of the new Magnetic Block.
- Attach, detach, and run automated calibration for Flex pipettes and the Flex Gripper.

General app features

- Manually move labware around the deck during protocols. The app shows animated instructions for which labware to move, and lets you resume the protocol when movement is complete.
- See when your protocol will pause. During a run, marks on the protocol timeline show all pauses that require user attention, including labware movement.

### Improved Features

- The app loads various pages faster.

---
