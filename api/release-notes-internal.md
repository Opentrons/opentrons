For more details about this release, please see the full [technical change log][]. 

[technical change log]: https://github.com/Opentrons/opentrons/releases

---

# Internal Release 0.5.0

This is internal release 0.5.0 for the Opentrons Flex robot software, involving both robot control and the on-device display.

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

## Reasonably Sized New Things
### ODD
- More focus on visuals around alignment, sizing, and spacing, especially between screens - this is mostly catchup from removing the menu bar
- Recently-run protocols is now populated!
- In general, it's pretty doable to run protocols and pre-protocol from the ODD; give it a try by sending a protocol to the flex with the "send to OT3" button in the desktop app
- LPC shouldn't drag tipracks around anymore

### Robot Control
- Even more acceleration changes from hardware testing
- Improved trash bin positioning should mean dropped tips don't go quite as "everywhere"
- DVT multis return tips a little better now
- Fixed a bunch of behavior stuff around the 96 with plunger stalls, breaking instruments endpoints, etc. Should be usable now.
- You should be able to cancel a protocol now without breaking the robot
- Calibration should raise an error if it got a really bizarre output now
- Logging overhaul:
  - CANbus messages (and USB rear panel messages) are logged now; you can see them by downloading serial logs or running `journalctl -t opentrons-api-serial`
  - We limited what goes in the api logs, removing HTTP access logs and SQL logs and move command spam; they should be more useful now. You can see them by downloading API logs or running `journalctl -t opentrons-api`.
  - All the above is now in the robot-server unit logs, which can be accessed via `journalctl -u opentrons-robot-server`
- Protocol analysis should be a _lot_ faster
- Fixed an issue where pinging `GET /instruments` during automated calibration would cause calibration to fail
- Increased reliability of automated calibration
- Increased reliability of gripper pickups from modules
- Python API `load_labware`, `load_module` and `move_labware` can accept location as deck coordinates (e.g. "A1", "D3") in addition to slot numbers
- The `.parent` property for Module and Labware objects (loaded on the deck) will return a coordinate style deck location (e.g. "B2", "C3") for protocols with robotType "OT-3 Standard" instead of the slot number

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
- Updated python api version to 2.15
- Added load Magnetic block as a module in python api and in PE.

