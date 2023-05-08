For more details about this release, please see the full [technical change log][]. 

[technical change log]: https://github.com/Opentrons/opentrons/releases

---

# Internal Release 0.7.0

This is internal release 0.7.0 for the Opentrons Flex robot software, involving both robot control and the on-device display.

Some things are known not to work, and are listed below. Specific compatibility notes about peripheral hardware are also listed.

## Big New Things
### Robot Control
- Updated python api version to 2.15
- Added load Magnetic block as a module in python api and in PE. You can now load a magnetic block using `protocol_context.load_module("magneticBlockV1", <slot_name>)` with `apiLevel` of 2.15.

# Internal Release 0.6.0

This is internal release 0.6.0 for the Opentrons Flex robot software, involving both robot control and the on-device display.

Some things are known not to work, and are listed below. Specific compatibility notes about peripheral hardware are also listed.

## Hardware Revision Compatibility

- This release will work best on a DVT robot frame with a programmed rear-panel board. If that doesn't apply, edit `/data/feature_flags.json` and turn `rearPanelIntegration` to `false` or the robot server won't start.
- This release is compatible with EVT pipettes and gripper only if they have received the tool ID rework.
- This release is compatible with DVT pipettes and gripper.
- This release should be used with DVT module caddies. This might introduce a slight LPC offset change if the previous offsets for labware on modules were measured while using EVT caddies.
- This release should be used with pipette bootloaders of at least v7.

## Big Things That Don't Work Yet So Don't Report Bugs About Them

### ODD
- While many individual flows work, going in between them often does not, you have to use the secret menu
- The ODD generally won't synch up to what the robot is doing if the app is controlling it - for instance, if you start a protocol from the app the ODD won't follow along on its own
- The ODD doesn't really tell you if the robot server hasn't started yet; if a robot looks on but has the name "opentrons", or says it's not network-connected when you know it is, probably the server isn't up yet, give it another little bit
- It can take a while for the robot to start after installing an update (it's the firmware updates happening on boot). Allow 10 minutes after an update that has a firmware change.

### Robot Control
- USB connectivity
- Pipette/gripper firmware update on attach: if you need to attach a new instrument, attach it and then power-cycle the robot or restart the robot server
- Pipette pressure sensing both for liquid-level sensing purposes and for clog-detection purposes
- Labware pick up failure with gripper

## Big New Things
### Robot Control
- All python protocol API functions that take deck slot names (like load_labware) now support deck slot "coordinates", e.g. specifying a deck slot as "A1" rather than 1. This feature requires a Python protocol to request API version 2.15.

## Reasonably Sized New Things
### ODD
- Protocol result screens! No more do you have to stare at those big buttons forever

# Internal Release 0.5.0

### Robot Control
- Python API `load_labware`, `load_module` and `move_labware` can accept location as deck coordinates (e.g. "A1", "D3") in addition to slot numbers
- The `.parent` property for Module and Labware objects (loaded on the deck) will return a coordinate style deck location (e.g. "B2", "C3") for protocols with robotType "OT-3 Standard" instead of the slot number
- Rerunning a protocol should no longer result in being on step ?
- DVT gripper sets its force more accurately now
- Fixed a couple more bugs with pipette calibration; it should no longer fail during the Z height calibration
- Fixed a problem where the change-pipette process would crash after removing a pipette because it tried to home the now-not-present pipette

## Big Things That Do Work Please Do Report Bugs About Them
### Robot Control
- Liquid handling protocols with 1 and 8 channel pipettes
- Labware movement between slots/modules, both manual and with gripper, from python protocols
- Labware drop/gripper crash errors, but they're very insensitive
- Pipette and gripper automated offset calibration
- Network connectivity and discoverability
- Firmware update for all devices attached when the robot turns on
- Cancelling a protocol run. We're even more sure we fixed this so definitely tell us if it's not.

### ODD
- Protocol execution including end-of-protocol screen
- Protocol run monitoring
- Attach and calibrate
- Network connection management, including viewing IP addresses and connecting to wifi networks
- Automatic updates of robot software when new internal releases are created
- Chrome remote devtools - if you enable them and then use Chrome to go to robotip:9223 you'll get devtools
- After a while, the ODD should go into idle; if you touch it, it will come back online

## Smaller Known Issues

## Smaller fun features
- The lights work (don't do anything yet though)

