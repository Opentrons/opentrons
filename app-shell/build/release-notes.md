# Changes since 3.3.0

For more details, please see the full [technical change log][changelog]

[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md

<!-- start:@opentrons/app -->
## Opentrons App

We've updated the app to give you information about your protocols _before_ you start calibrating and running your robot. On top of that, our **Linux build of the app is now able to self-update!**

### Known issues

- The app's run log is still having problems displaying the current run step, especially if pauses and resumes are involved ([#2047][2047])

### Bug fixes

- Cleaned up some scrolling and modal coverage issues
- Ensured that external links actually get opened in your browser
- Fixed a bug where the arrow keys could change the jog step size (thanks to [Philipp Jaeger][2300] for reporting this issue!)
- Fixed support chat so required configuration information is properly sent

[2047]: https://github.com/Opentrons/opentrons/issues/2047
[2300]: https://github.com/Opentrons/opentrons/issues/2300

### New features

- When updating your app, you're going to see these release notes to see what's changed since the last version
- Linux builds are now packaged as [AppImages][appimage], which means:
    - The Linux version of the app now supports auto-update
    - While we only officially support Ubuntu, the app _should_ now also be able to run on Fedora 21 or later
- We've got a shiny new protocol summary page to give you more information about your protocol at a glance after you upload it
- The app now automatically provides pipette configuration to support chat so our wonderful staff can better help you

[appimage]: https://appimage.org/
<!-- end:@opentrons/app -->


<!-- start:@opentrons/api -->
## OT2 and Protocol API

This update is all about improving the reliability of your robot and getting you new and updated labware definitions! Remember to update your robot after you update your app to get these changes onto your OT2.

### Known issues

- This update includes updates to several labware definitions. Please note **these will not overwrite your current labware definitions**, unless you reset your robot's labware definitions. If you would like to get the updates:
    - In the app, go to "Robots" > your robot > "Advanced Settings" > "Factory Reset"
    - Unfortunately **this will clear out all your previous labware calibrations**
    - You will, however, get various fixes to the base definitions that will reduce the amount of calibration you need to do in the future
- While the underlying definition is now correct, there is a known API bug that is causing the robot to think a `50ml` tube in a `15/50ml` tuberack is the same height as the `15ml` tube

### Bug fixes

- Fixed some problems with the Bio-Rad PCR and 10µL tiprack definitions
- Fixed a variety of problems with how the robot boots that could result in an unresponsive robot
- Ensured that factory reset really does clear the labware database every time
- Fixed a problem with state from protocol simulation hanging around for the actual run (which could confuse the robot into thinking it had a tip on when it did not)
- Removed deck calibration from the factory reset options, because the proper way to reset your deck calibration is to go through the full deck calibration process

### New features

- Added a bunch of new labware definitions!
    - [Opentrons modular tuberack set][tuberacks]
        - `opentrons-tuberack-15ml`
        - `opentrons-tuberack-50ml`
        - `opentrons-tuberack-15_50ml`
        - `opentrons-tuberack-2ml-eppendorf`
        - `opentrons-tuberack-2ml-screwcap`
    - [Opentrons aluminum block set][blocks]
      - `opentrons-aluminum-block-2ml-eppendorf`
      - `opentrons-aluminum-block-2ml-screwcap`
      - `opentrons-aluminum-block-96-PCR-plate`
      - `opentrons-aluminum-block-PCR-strips-200ul`
    - Enjoy using your shiny new tube rack sets and [Temperature Module][tempdeck]!
- Did a lot of plumbing work for upcoming WiFi improvements. (Enterprise networks! Hidden SSIDs!) Keep an eye out for these changes to be finished in an upcoming release
- The API will now automatically keep the firmware of its Smoothie motor controller board up-to-date
- `robot.pause` now supports an optional message to display in the app's run log

    ```
    robot.pause(msg='Waiting for you to click "Resume"')
    ```

- The min. and max. volumes of the default pipette constructors in the protocol API can now be optionally overridden (thanks [@rvinzent][rvinzent]!)

    ```
    p300 = instruments.P300_Single(
        mount='right',
        min_volume=42,
        max_volume=240,
    )
    ```

[tuberacks]: https://shop.opentrons.com/collections/opentrons-tips/products/tube-rack-set-1
[blocks]: https://shop.opentrons.com/products/aluminum-block-set
[tempdeck]: https://shop.opentrons.com/products/tempdeck
[rvinzent]: https://github.com/Opentrons/opentrons/pull/2084
<!-- end:@opentrons/api -->
