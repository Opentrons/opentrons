For more details about this release, please see the full [technical change log][]. 

[technical change log]: https://github.com/Opentrons/opentrons/releases

---

# Internal Release 0.11.0

This is internal release 0.11.0 for the Opentrons Flex robot software, involving both robot control and the on-device display.

Some things are known not to work, and are listed below. Specific compatibility notes about peripheral hardware are also listed.

## Update Notes

- ⚠️ After upgrading your robot to 0.11.0, you'll need to factory-reset its run history before you can use it.

  1. From the robot's 3-dot menu (⋮), go to **Robot settings.**
  2. Under **Advanced > Factory reset**, select **Choose reset settings.**
  3. Choose **Clear protocol run history,** and then select **Clear data and restart robot.**

  Note that this will remove all of your saved labware offsets.

  You will need to follow these steps if you subsequently downgrade back to a prior release, too.

## New Stuff In This Release

- When interacting with an OT-3, the app will use the newer names for the deck slots, like "C2", instead of the names from the OT-2, like "5".
- The `requirements` dict in Python protocols can now have `"robotType": "Flex"` instead of `"robotType": "OT-3"`. `"OT-3"` will still work, but it's discouraged because it's not the customer-facing name.

# Internal Release 0.9.0

This is internal release 0.9.0 for the Opentrons Flex robot software, involving both robot control and the on-device display.

Some things are known not to work, and are listed below. Specific compatibility notes about peripheral hardware are also listed.

## Big New Things
### Robot Control
- Stall detection is enabled for most moves. You might now get stall detection failures if you stall the robot.
- Motor driver configuration changes should improve performance and prevent step loss on the gantry.
- More USB connectivity fixes; updating should now work
- Many 96-channel behavior fixes, especially around tip pickup.

### Python Protocol API
- ``move_labware`` now requires api level 2.15; as a bonus feature to sweeten the deal, however, you can now `move_labware` to a special `OFF_DECK` location
- The Mount type has an `EXTENSION` entry for the gripper now

### ODD
- You now get lovely little popups on the ODD when you send a protocol to an OT-3. 
- Design passes on the following screens should improve little usability issues: protocols dashboard, connect to network, protocol details
- The unboxing flow should handle USB connections better now

For more details about this release, please see the full [technical change log][]. 

## Smaller Known Issues In This Release
- Gripper calibration occasionally seems like it "skipped a step", going straight from front to rear calibration. If this happens, exit and rerun. This is because of a server error that isn't getting properly reported. We're working on both fixing the error and its reporting, but in the meantime exiting and rerunning the process should fix it. This is RQA-844.

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
