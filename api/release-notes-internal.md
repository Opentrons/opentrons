For more details about this release, please see the full [technical change log][]. 

[technical change log]: https://github.com/Opentrons/opentrons/releases

---

# Internal Release 0.14.0

## New Stuff In This Release

- Return tip heights and some other pipette behaviors are now properly executed based on the kind of tip being used
- Release Flex robot software builds are now cryptographically signed. If you run a release build, you can only install other properly signed release builds. Note that if the robot was previously on a non-release build this won't latch; remove the update server config file at ``/var/lib/otupdate/config.json`` to go back to signed builds only. 
- Error handling has been overhauled; all errors now display with an error code for easier reporting. Many of those error codes are the 4000 catchall still but this will improve over time.
- Further updates to Flex motion control parameters from hardware testing for both gantry and plunger speeds and acceleration
- Pipette overpressure detection is now integrated.
- All instrument flows should now show errors if they occur instead of skipping a step
- Fixes to several incorrect status displays in ODD (i.e. protocols skipping the full-color outcome splash)
- Robot can now handle json protocol v7
- Support for PVT (v1.1) grippers
- Update progress should get displayed after restart for firmware updates
- Removed `use_pick_up_location_lpc_offset` and `use_drop_location_lpc_offset` from `protocol_context.move_labware` arguments. So they should be removed from any protocols that used them. This change also requires resetting the protocol run database on the robot.
- Added 'contextual' gripper offsets to deck, labware and module definitions. So, any labware movement offsets that were previously being specified in the protocol should now be removed or adjusted or they will get added twice.


## Big Things That Don't Work Yet So Don't Report Bugs About Them

### Robot Control
- Pipette pressure sensing for liquid-level sensing purposes
- Labware pick up failure with gripper
- E-stop integrated handling especially with modules

## Big Things That Do Work Please Do Report Bugs About Them
### Robot Control
- Protocol behavior
- Labware movement between slots/modules, both manual and with gripper, from python protocols
- Labware drop/gripper crash errors, but they're very insensitive
- Pipette and gripper automated offset calibration
- Network connectivity and discoverability
- Firmware update for all devices 
- Cancelling a protocol run. We're even more sure we fixed this so definitely tell us if it's not.
- USB connectivity
- Stall detection firing basically ever unless you clearly ran into something

### ODD
- Protocol execution including end-of-protocol screen
- Protocol run monitoring
- Attach and calibrate
- Network connection management, including viewing IP addresses and connecting to wifi networks
- Automatic updates of robot software when new internal releases are created
- Chrome remote devtools - if you enable them and then use Chrome to go to robotip:9223 you'll get devtools
- After a while, the ODD should go into idle; if you touch it, it will come back online



