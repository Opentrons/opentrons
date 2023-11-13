For more details about this release, please see the full [technical change log][]. 

[technical change log]: https://github.com/Opentrons/opentrons/releases

---

# Internal Release 1.0.0

## New Stuff In This Release

- Fixed an issue where the robot wasn't actually checking for updates; you will now correctly get prompted to update your robot from the settings tab of the ODD when an update is available, including during onboarding
- You can update the robot by putting a system update (ot3-system.zip) on a flash drive and plugging it in the front USB port, then going to robot settings
- Support for 96-channel pipettes in protocols
- Early provisional support for deck configuration and trash chutes in protocols


## Big Things That Don't Work Yet So Don't Report Bugs About Them

### Robot Control
- Pipette partial tip pickup is present but not fully validated or developed yet. Partial tip pickup on 96 channel pipettes will not use correct motion parameters; using the front channel of a pipette in partial tip pickup does not work.
