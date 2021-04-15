For more details about this release, please see the full [technical change
log][]. For a list of currently known issues, please see the [Opentrons issue tracker][].

[technical change log]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md
[opentrons issue tracker]: https://github.com/Opentrons/opentrons/issues?q=is%3Aopen+is%3Aissue+label%3Abug

---

# Opentrons App Changes in 4.2.1

## Changes

- There are no app side changes to this release.

---

# Opentrons App Changes in 4.2.0

## Changes

- Do not automatically resume when the user decides not to confirm cancelling a protocol
  - If you click the "cancel" button and then click "Go back", the protocol will be paused until you click resume.

## Bugfixes

- Fix several issues that prevented changing the settings of an attached pipette.
- You will now be asked whether you have a calibration block in pre-protocol tip length calibration if you have not saved your answer.

---

## Opentrons App Changes in 4.1.1

There are no changes to the Opentrons App in 4.1.1; it is a bugfix release for an issue with installing Python packages on the OT-2.

## Opentrons App Changes in 4.1.0

Opentrons App 4.1.0 brings some new features to robot calibration.

### OT-2 Calibration Changes

- You can now choose any standard or custom tiprack of appropriate volume to use when calibrating your pipette
- You can now jog in Z when calibrating to deck markings
- Downloading robot logs will now download a third file which contains logs from the robot's web server

### Bugfixes

- Fixed an issue that prevented calibration of labware in slots 10 and 11 while using a single channel pipette ([#6886](https://github.com/opentrons/opentrons/issues/6886))
- Protocol upload should be much faster

---

## Opentrons App Changes in 4.0.0

Opentrons App 4.0.0 is a major software release, bringing an entirely overhauled robot calibration process for the OT-2; a full switch to Opentrons Protocol API Version 2; and many look and feel improvements.

**After you install this update, you must calibrate your OT-2's pipette offsets and tip lengths before running a protocol**. This will take approximately fifteen minutes, but you will not be able to run a protocol until your OT-2 is calibrated.

### OT-2 Calibration Changes

In Opentrons App and Robot Software 4.0.0, the calibration process for the OT-2 is different and improved from major version 3. With these changes, you'll calibrate less often; the calibration processes are shorter, easier, and more reliable; and you can finally use different kinds of tips on the same pipette in the same protocol accurately.

For more in-depth information on the changes, [click here](https://support.opentrons.com/en/articles/3499692-how-calibration-works-on-the-ot-2).

### Full Use of Python Protocol API Version 2

We released Python Protocol API Version 2 almost a year ago, and have been continuously improving it since, with 8 new intermediate API levels, each containing bugfixes, improvements, or support for new hardware. It's ready to be the only way Python protocols are written for the OT-2. Accordingly, in 4.0.0 and subsequent releases, **the OT-2 will not accept Python Protocol API Version 1 protocols**.

### Look and Feel Changes

In 4.0.0, the Opentrons App has some major changes to the Robots tab and the Pipettes & Modules page. These changes present information about the new calibration data more concisely in a better-organized way. We hope you like it!
