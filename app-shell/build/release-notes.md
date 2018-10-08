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

### New features

<!-- end:@opentrons/app -->


<!-- start:@opentrons/api -->
## OT2 and Protocol API

### Known issues

- While the underlying definition is correct, there is a known API bug that is causing the robot to think a `50ml` tube in a `15/50ml` tuberack is the same height as the `15ml` tube

### Bug fixes

### New features

<!-- end:@opentrons/api -->
