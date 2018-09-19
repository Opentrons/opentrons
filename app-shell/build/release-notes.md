# Changes since 3.3.0

<!-- start:@opentrons/app -->
## Opentrons App

We've updated the app to give you information about your protocols _before_ you start calibrating and running your robot. We hope you like the update!

### Bug fixes

- Fixed support chat so required configuration information is properly sent

### New features

- We've got a shiny new protocol summary page to give you more information about your protocol at a glance after you upload it
- The app now automatically provides pipette configuration to support chat so our wonderful staff can better help you
<!-- end:@opentrons/app -->


<!-- start:@opentrons/api -->
## OT2 and Protocol API

This update is all about new and updated labware definitions! Remember to update your robot after you update your app to get these changes onto your OT2.

### Bug fixes

- Fixed some problems with the Biorad PCR and 10µL tiprack definitions
- Fixed a problem with how the robot launches its API server
- Ensured that factory reset really does clear the labware database every time

### New features

- Added a bunch of new labware definitions
    - [Opentrons modular tuberack set][tuberacks]
    - [Opentrons aluminum block set][blocks]
    - Enjoy using your shiny new tube rack sets and [Temperature Module][tempdeck]!
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
