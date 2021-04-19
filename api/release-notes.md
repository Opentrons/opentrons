For more details about this release, please see the full [technical change
log][]. For a list of currently known issues, please see the [Opentrons issue tracker][].

[technical change log]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md
[opentrons issue tracker]: https://github.com/Opentrons/opentrons/issues?q=is%3Aopen+is%3Aissue+label%3Abug

# OT-2 Software Changes in 4.2.1

This is a hotfix to prevent crashing in the Z axis with one pipette. You must re-calibrate your pipette offset and your labware before proceeding to a run if you are
experiencing this issue.

## Bugfixes

- Fixed an issue where tip length calibration was not being accessed correctly during a protocol run, and labware calibration.
  - If you performed pipette calibration in 4.2.0, you will need to re-do that calibration upon this update.

## Known Issues

In 4.2.1 and previous releases, the OT-2 will only use TLS 1.0 for WPA2 Enterprise association. Some RADIUS servers have disabled this version of TLS; it must be enabled to connect the OT-2 to a RADIUS-secured network.

---

# OT-2 Software Changes in 4.2.0

## Bugfixes

- Fixed an issue where the pipette or pipette mount would not descend far enough to access the mounting screws when changing the pipette
- Fixed an issue that would cause the left and right pipettes to be at different heights, even after executing pipette calibration
  - If you are experiencing this issue, you should recalibrate your pipettes after updating.
- Fixed an issue where the OT-2 would be unable to connect to Wi-Fi networks using 802.1x Fast Migration.

## Known Issues

In 4.2.0 and previous releases, the OT-2 will only use TLS 1.0 for WPA2 Enterprise association. Some RADIUS servers have disabled this version of TLS; it must be enabled to connect the OT-2 to a RADIUS-secured network.

---

## OT-2 Software Changes in 4.1.1

This is a hotfix for an issue with package installation; it does not include any behavioral changes for the OT-2.

### Bugfixes

- Fixed an issue where the version of the pyserial dependency in the `opentrons` package metadata did not match the version installed on the OT-2, which would cause installation of Python packages that depend on the `opentrons` package to the robot to fail ([#7250](https://github.com/Opentrons/opentrons/pull/7250))

## OT-2 Software Changes in 4.1.0

Opentrons Robot Software 4.1.0 brings support for some new robot calibration features and some bugfixes. It also brings a new Protocol API level.

### Calibration Changes

- You can now choose any standard or custom tiprack of appropriate volume to use when calibrating your pipette
- You can now jog in Z when calibrating to deck markings

### Protocol API Level 2.9

- In Python Protocol API Level 2.9, we added accessors for well properties that had previously been undocumented. To see more details, see [the documentation](http://docs.opentrons.com/v2/new_labware.html#new-labware-well-properties).

## Bugfixes

- Fixed an issue that prevented calibration of labware in slots 10 and 11 while using a single channel pipette ([#6886](https://github.com/opentrons/opentrons/issues/6886))
- Protocol upload should be much faster

---

## OT-2 Software Changes in 4.0.0

Opentrons Robot Software 4.0.0 is a major software release, bringing an entirely overhauled robot calibration process for the OT-2; a full switch to Opentrons Protocol API Version 2; and improvements to the OT-2's HTTP API.

**After you install this update, you must calibrate your OT-2's pipette offsets and tip lengths before running a protocol.** This will take approximately fifteen minutes, but you will not be able to run a protocol until your OT-2 is calibrated.

In addition, **after you install this update, Opentrons Apps on version 3.21.2 or earlier will not be able to interact with this OT-2 beyond downgrading its software**. This is due to the HTTP API changes described below. Opentrons App Version 4.0.0 is designed to work with the changes, but 3.21.2 and previous cannot interact with an OT-2 on Robot Software 4.0.0 other than downgrading its software.

### OT-2 Calibration Changes

In Opentrons App and Robot Software 4.0.0, the calibration process for the OT-2 is different and improved from major version 3. With these changes, you'll calibrate less often; the calibration processes are shorter, easier, and more reliable; and you can finally use different kinds of tips on the same pipette in the same protocol accurately.

For more in-depth information on the changes, [click here](https://support.opentrons.com/en/articles/3499692-how-calibration-works-on-the-ot-2).

### Full Use of Python Protocol API Version 2

We released Python Protocol API Version 2 almost a year ago, and have been continuously improving it since, with 8 new intermediate API levels, each containing bugfixes, improvements, or support for new hardware. It's ready to be the only way Python protocols are written for the OT-2. Accordingly, in 4.0.0 and subsequent releases, **the OT-2 will not accept Python Protocol API Version 1 protocols**.

### HTTP API Changes

Robot Software 4.0.0 is a big step forward in a well-defined, stable, HTTP API for the OT-2. This API is what the Opentrons App uses to communicate with the OT-2, and documentation for it is available on the OT-2's IP address, port 31950 at `/docs`. In Robot Software 4.0.0, interaction with this API now requires use of the `Opentrons-Version` header, set to either `*` (to accept any version) or `2`.

We consider the HTTP API a core part of the OT-2's API, and changes to it will be documented in release notes just like Python Protocol API changes.

### Other Changes

- New Python Protocol API version: 2.8
  - You can now specify blow out locations in `transfer`, `consolidate`, and `distribute` to be the source well, destination well, or trash
  - `Well` now has the method `from_center_cartesian`, which allows you to calculate positions relative to the well center in X, Y, and Z
  - For more information, see [the Python Protocol API documentation](https://docs.opentrons.com/v2/versioning.html#version-2-8)
- Protocol Designer protocols will now always be executed with API Version 2.8 behaviors
  - Future changes to the behavior executed in Protocol Designer protocols will be communicated here
- `transfer`, `consolidate`, and `distribute` will now do nothing if passed a 0 transfer volume.
