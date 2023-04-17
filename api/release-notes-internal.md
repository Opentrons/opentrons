For more details about this release, please see the full [technical change log][]. 

[technical change log]: https://github.com/Opentrons/opentrons/releases

---

# Internal Release 0.4.0

This is internal release 0.4.0 for the Opentrons Flex robot software, involving both robot control and the on-device display.

Some things are known not to work, and are listed below. Specific compatibility notes about peripheral hardware are also listed.

## Hardware Revision Compatibility

- This release will work best on a DVT robot frame with a programmed rear-panel board. If that doesn't apply, edit `/data/feature_flags.json` and turn `rearPanelIntegration` to `false` or the robot server won't start.
- This release is compatible with EVT pipettes and gripper only if they have received the tool ID rework.
- This release is compatible with DVT pipettes and gripper.
- This release is _not_ compatible with DVT module caddies.
- This release should be used with pipette bootloaders of at least v7.

## Big Things That Don't Work Yet So Don't Report Bugs About Them

### ODD
- Changing the text size on the ODD through the settings

### Robot Control
- USB connectivity
- Pipette/gripper firmware update on attach: if you need to attach a new instrument, attach it and then power-cycle the robot or restart the robot server
- Pipette pressure sensing both for liquid-level sensing purposes and for clog-detection purposes
- Labware pick up failure with gripper

## Reasonably Sized New Things
### ODD
- No more unsightly menu bar at the top
- You can delete runs  and protocols from the ODD
- The ODD now displays the firmware version of attached devices. If devices are on different firmwares, it will display them in a list. If this is happening, it means something wasn't updated, and you should restart the robot with that thing connected.
- More in-depth liquid setup screens

### Robot Control
- Updates to accelerations and speeds from hardware testing
- Module calibration offsets will now be loaded in protocols once you run it with the script
- When running the repl, you can disable automatic firmware update by setting the `OT3_DISABLE_FW_UPDATES` environment variable. Please do this rarely, since often you will see weird failures if you have out-of-date firmware.

## Big Things That Do Work Please Do Report Bugs About Them
### Robot Control
- Liquid handling protocols with 1 and 8 channel pipettes
- Labware movement between slots/modules, both manual and with gripper, from python protocols
- Labware drop/gripper crash errors, but they're very insensitive
- Pipette and gripper automated offset calibration
- Network connectivity and discoverability
- Firmware update for all devices attached when the robot turns on
- Cancelling a protocol run. We're pretty sure we fixed this so definitely tell us if it's not.

### ODD
- Protocol execution
- Protocol run monitoring
- Attach and calibrate
- Network connection management, including viewing IP addresses and connecting to wifi networks
- Automatic updates of robot software when new internal releases are created
- Chrome remote devtools - if you enable them and then use Chrome to go to robotip:9223 you'll get devtools
- After a while, the ODD should go into idle; if you touch it, it will come back online

## Smaller Known Issues

## Smaller fun features
- Turn on display idle in the display settings for a fun surprise
- The lights work (don't do anything yet though)
- Lots of visual updates and improvements in the ODD
