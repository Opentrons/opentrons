For more details about this release, please see the full [technical change log][]. 

[technical change log]: https://github.com/Opentrons/opentrons/releases

---

# Internal Release 0.1.0

This is 0.1.0, the first internal release for the Opentrons Flex robot software, involving both robot control and the on-device display.

This is still pretty early in the process, so some things are known not to work, and are listed below. Specific compatibility notes about peripheral hardware are also listed.

## Hardware Revision Compatibility

- This release will work best on a DVT robot frame with a programmed rear-panel board. If that doesn't apply, edit `/data/feature_flags.json` and turn `rearPanelIntegration` to `false` or the robot server won't start.
- This release is compatible with EVT pipettes and gripper only if they have received the tool ID rework.
- This release is compatible with DVT pipettes and gripper.
- This release is _not_ compatible with DVT module caddies.

## Big Things That Don't Work Yet So Don't Report Bugs About Them

### ODD
- Attach, detach, and calibration flows for pipettes or gripper

### Robot Control
- USB connectivity
- Pipette/gripper firmware update on attach: if you need to attach a new instrument, attach it and then power-cycle the robot or restart the robot server
- Pipette pressure sensing both for liquid-level sensing purposes and for clog-detection purposes

## Big Things That Do Work Please Do Report Bugs About Them
### Robot Control
- Protocol execution
- Pipette and gripper automated offset calibration
- Network connectivity and discoverability
- Firmware update for all devices attached when the robot turns on

### ODD
- Protocol execution
- Deleting protocols stored on the robot
- Network connection management, including viewing IP addresses and connecting to wifi networks
- Automatic updates of robot software when new internal releases are created
- Chrome remote devtools - if you enable them and then use Chrome to go to robotip:9223 you'll get devtools
- After a while, the ODD should go into idle; if you touch it, it will come back online


## Smaller Known Issues
### Robot Control
- Pipette and gripper automated offset calibration still uses linear search and might have issues; double check that it worked right


## Smaller fun features
- Pipette firmware senses tips now and puts it on the canbus 
- The Z-stage will now update its position from encoders after picking up tip instead of homing
- You can change the text size on the ODD through the settings
- You can change the brightness of the ODD through the settings
