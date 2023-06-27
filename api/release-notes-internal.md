For more details about this release, please see the full [technical change log][]. 

[technical change log]: https://github.com/Opentrons/opentrons/releases

---

# Internal Release 0.13.0

## New Stuff In This Release

- Multiple updates to Flex motion control parameters from hardware testing for both gantry and plunger speeds and acceleration
   - Pipette default flowrates are higher
- The LED status bar animates during firmware updates
- Tip presence detection is now integrated; you should get errors after failing to pick up or drop a tip
- Many (many) visual and workflow fixes and improvements from design QA for the ODD
- ODD should now display an error screen instead of a white screen
- You can load labware to an OFF_DECK location
- You can now use calibrate gripper in the reset settings options
- There are consistent error codes in protocol status inforation now
- The ODD should prompt you to update your pipettes when you attach one that needs it (!)
- The 96 shouldn't fall down when you attach it now (!)
- More little stall detection fixes

## Big Things That Don't Work Yet So Don't Report Bugs About Them

### ODD
- The ODD doesn't really tell you if the robot server hasn't started yet; if a robot looks on but has the name "opentrons", or says it's not network-connected when you know it is, probably the server isn't up yet, give it another little bit
- It can take a while for the robot to start after installing an update (it's the firmware updates happening on boot). Allow 10 minutes after an update that has a firmware change.

### Robot Control
- Pipette pressure sensing both for liquid-level sensing purposes and for clog-detection purposes
- Labware pick up failure with gripper

## Big Things That Do Work Please Do Report Bugs About Them
### Robot Control
- Liquid handling protocols with 1 and 8 channel pipettes
- Labware movement between slots/modules, both manual and with gripper, from python protocols
- Labware drop/gripper crash errors, but they're very insensitive
- Pipette and gripper automated offset calibration
- Network connectivity and discoverability
- Firmware update for all devices 
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



