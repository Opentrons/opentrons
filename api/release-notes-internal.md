For more details about this release, please see the full [technical change log][]. 

[technical change log]: https://github.com/Opentrons/opentrons/releases

---

# Internal Release 0.12.0

## Update Notes

- If your Python protocol specifies a Flex-style slot name like `"C2"`, its `apiLevel` must now be `2.15`.

- ⚠️ After upgrading your robot to 0.12.0 from 0.10.0 or previous, you'll need to factory-reset its run history before you can use it.

  1. From the robot's 3-dot menu (⋮), go to **Robot settings.**
  2. Under **Advanced > Factory reset**, select **Choose reset settings.**
  3. Choose **Clear protocol run history,** and then select **Clear data and restart robot.**

  Note that this will remove all of your saved labware offsets.

  You will need to follow these steps if you subsequently downgrade back to a prior release, too.

## New Stuff In This Release

- Many (many) visual and workflow fixes and improvements from design QA for the ODD
- Pipette plunger backlash compensation should improve pipetting performance on the 96 channel
- More slot name fixes to make them D1 instead of 1
- 96 channel attach flow fixes
- Firmware updates now use an HTTP API; there's no frontend, so continue to follow the rules abotu restarting with an instrument attached after an update.
- Several ODD white screen fixes

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



