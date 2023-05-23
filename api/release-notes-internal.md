For more details about this release, please see the full [technical change log][]. 

[technical change log]: https://github.com/Opentrons/opentrons/releases

---

# Internal Release 0.9.0

This is internal release 0.9.0 for the Opentrons Flex robot software, involving both robot control and the on-device display.

Some things are known not to work, and are listed below. Specific compatibility notes about peripheral hardware are also listed.

## Big New Things
### Robot Control
- move_labware now requires apiLevel to be at least 2.15. You can now move labware off-deck using the python API by supplying OFF_DECK to the new_location arg.

For more details about this release, please see the full [technical change log][]. 

## Big Things That Don't Work Yet So Don't Report Bugs About Them

### ODD
- While many individual flows work, going in between them often does not, you have to use the secret menu
- The ODD generally won't synch up to what the robot is doing if the app is controlling it - for instance, if you start a protocol from the app the ODD won't follow along on its own
- The ODD doesn't really tell you if the robot server hasn't started yet; if a robot looks on but has the name "opentrons", or says it's not network-connected when you know it is, probably the server isn't up yet, give it another little bit
- It can take a while for the robot to start after installing an update (it's the firmware updates happening on boot). Allow 10 minutes after an update that has a firmware change.

### Robot Control
- Pipette/gripper firmware update on attach: if you need to attach a new instrument, attach it and then power-cycle the robot or restart the robot server
- Pipette pressure sensing both for liquid-level sensing purposes and for clog-detection purposes
- Labware pick up failure with gripper

## Big Things That Do Work Please Do Report Bugs About Them
### Robot Control
- Liquid handling protocols with 1 and 8 channel pipettes
- Labware movement between slots/modules, both manual and with gripper, from python protocols
- Labware drop/gripper crash errors, but they're very insensitive
- Pipette and gripper automated offset calibration
- Network connectivity and discoverability
- Firmware update for all devices attached when the robot turns on
- Cancelling a protocol run. We're even more sure we fixed this so definitely tell us if it's not.
- USB connectivity

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
