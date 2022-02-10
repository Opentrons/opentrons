For more details about this release, please see the full [technical change
log][]. For a list of currently known issues, please see the [Opentrons issue tracker][].

[technical change log]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md
[opentrons issue tracker]: https://github.com/Opentrons/opentrons/issues?q=is%3Aopen+is%3Aissue+label%3Abug

---

# Opentrons App Changes in 5.0.0-beta.9

Welcome to the beta release of v5.0.0 release of the Opentrons App! After you update your app, please be sure to update any OT-2's you will be using with this beta.

The 5.0.0 release reshapes the way you upload and set up protocols to run on your OT-2. We're very excited for you to try this new experience out, and we appreciate your feedback (and patience) as you use this new software.

This is beta software! You may experience unexpected crashes or missing features not detailed here. Please see the [beta forum][] for more details and to leave feedback.

[beta forum]: https://community.opentrons.com/c/beta/pe-beta/9

## New Features

- A completely revamped protocol upload experience that will walk you through setting up your OT-2 for the run
- A new way to check the positioning of your labware prior to a run, where you can apply offsets to each labware individually
- Quick and easy re-running of your last used protocol

### Bug Fixes

Keep an eye on this space as we release new versions of the beta.

- We have decreased jog latency in Labware Position Check
- We have addressed some inconsitency in labeling and viewing the current command in a run

## Known Issues

This beta is a work in progress! We'll be addressing the following features and issues in upcoming releases of 5.0.0.

- Your last run protocol will not be saved through robot reboots

---

## Opentrons App Changes in 4.7.0

The 4.7.0 release is primarily focused on bug fixes on the robot software side. You shouldn't notice any big changes with this upgrade.

### New Features

None in the Opentrons App.

### Bug Fixes

None in the Opentrons App.

---

## Opentrons App Changes in 4.6.2

The 4.6.2 release is primarily focused on bug fixes on the robot software side and behind the scenes changes in the app for future work. You shouldn't notice any big changes with this upgrade.

### New Features

None in the Opentrons App.

### Bug Fixes

None in the Opentrons App.

#### 4.6.1 to 4.6.2

The 4.6.2 hotfix release contains a small bug fix for an issue where the OT-2's max speed settings within a protocol will be ignored. It does not affect the software running in the Opentrons App.

#### 4.6.0 to 4.6.1

The 4.6.1 hotfix release contains a small configuration change to fix an issue with installing the `opentrons` PyPI package on computers running Python 3.8 and later. It does not affect the software running in the Opentrons App.

---

## Opentrons App Changes in 4.5.0

This release of the app is focused on quality of life improvements as we continue large behind-the-scenes improvements.

### New Features

- Protocol uploads have been made substantially faster! (See OT-2 release notes for more details.)

### Bug Fixes

- Fixed issues with the run timer reading `00:00` in the middle of a paused protocol ([#7740][])

[#7740]: https://github.com/Opentrons/opentrons/issues/7740

---

## Opentrons App Changes in 4.4.0

This is a quiet release on the app front as we make some behind-the-scenes improvements to how the app is built, so we don't have any changes to report here. There are changes to the OT-2 software, though, so make sure you update your app so it can get your robot fully up to date!

---

## Opentrons App Changes in 4.3.1

We've improved module functionality with Opentrons App 4.3.0. The app now supports protocols with two Temperature Modules or two Magnetic Modules for Python API Protocols. All connected modules display their USB port connection (including limited USB port information for hubs). We've also updated how modules are displayed on the Run tab.

### New Features

- Support for 2 Temperature Modules or 2 Magnetic Modules
- The USB port to which each module is attached is now displayed in the protocol info screen

### Bug Fixes

- Fix an issue where robots would sometimes not reappear after an update when connected via USB ([#7608](https://github.com/Opentrons/opentrons/issues/7608))

---

## Opentrons App Changes in 4.2.1

### Changes

- There are no app side changes to this release.

---

## Opentrons App Changes in 4.2.0

### Changes

- Do not automatically resume when the user decides not to confirm cancelling a protocol
  - If you click the "cancel" button and then click "Go back", the protocol will be paused until you click resume.

### Bug Fixes

- Fix several issues that prevented changing the settings of an attached pipette.
- You will now be asked whether you have a calibration block in pre-protocol tip length calibration if you have not saved your answer.

---

## Opentrons App Changes in 4.1.1

There are no changes to the Opentrons App in 4.1.1; it is a bugfix release for an issue with installing Python packages on the OT-2.

---

## Opentrons App Changes in 4.1.0

Opentrons App 4.1.0 brings some new features to robot calibration.

### OT-2 Calibration Changes

- You can now choose any standard or custom tiprack of appropriate volume to use when calibrating your pipette
- You can now jog in Z when calibrating to deck markings
- Downloading robot logs will now download a third file which contains logs from the robot's web server

### Bug Fixes

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
