# Changes since 3.4.0

For more details, please see the full [technical change log][changelog]

[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md

<!-- start:@opentrons/app -->
## Opentrons App

### Known issues

- Downgrading back to `3.4.0` from later releases _may_ cause the app to crash unless you delete the configuration folder (which will reset your app's configuration):
    - macOS: `~/Library/Application Support/Opentrons`
    - Linux: `~/.config/Opentrons`
    - Windows: `%APPDATA%\Opentrons`
- The app's run log is still having problems displaying the current run step, especially if pauses and resumes are involved ([#2047][2047])

[2047]: https://github.com/Opentrons/opentrons/issues/2047

### Bug fixes

- Fixed a bug that was causing the analytics opt-in modal to fail to pop up on first app launch
- Switched the labware table of the protocol info page to organize by type instead of nickname
- Patched up some problems with robot discovery that could cause robots to fail to appear in environments with many robots present
- Fixed an app crash if a robot reported an invalid server version

### New features

- We put a lot of work into the discovered robots list for this release:
    - The app now displays robots you've connected to in the past as well as robots that it can hear from but are not responding properly to requests
    - We've stripped off that annoying `opentrons-` that would appear in front of every robot's name
    - The "Pipettes and Modules" submenu will now only appear for the robot you've currently selected, so the robot list should be a little less noisy
- We improved the copy of the robot update popup to (hopefully) make it more clear whether you're upgrading, downgrading, or re-installing your robot's software
- We've upgraded our underlying [Electron framework][electron] to version 3, which closes up a few potential security holes and should result in a faster, smoother app experience for you!

[electron]: https://electronjs.org/

<!-- end:@opentrons/app -->


<!-- start:@opentrons/api -->
## OT2 and Protocol API

### Known issues

- While the underlying definition is correct, there is a known API bug that is causing the robot to think a `50ml` tube in a `15/50ml` tuberack is the same height as the `15ml` tube

### Bug fixes

- We fixed a launch configuration problem with the Jupyter Notebook server that could result in a boot failure
- The "Not Now" button for a robot update will now be remembered by the robot, so other users of your robot won't get an update pop-up if you choose to keep your robot at an older software version
- The temperature module now correctly rounds its input to the nearest degree Celsius to reflect what it is physically capable of
- The API will no longer show hidden networks as "--" in its available Wi-Fi networks list

### New features

This release doesn't have any new user facing features, but rest assured that our API team is hard at work laying groundwork for lots of exciting new stuff!

<!-- end:@opentrons/api -->
