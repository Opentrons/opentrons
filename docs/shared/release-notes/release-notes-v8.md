## Opentrons App Changes in 8.8.0

Welcome to the v8.8.0 release of the Opentrons App! This release includes concurrent module actions and other new features, and addresses several bugs.

### New Features

- Choose to run module actions like setting temperatures, setting shake speed, or running a Thermocycler Module profile without pausing other protocol steps until they're complete. You can run these concurrent module actions with multiple Temperature, Heater-Shaker, or Thermocycler Modules, or simultaneously perform pipetting actions.
- Use the Flex and OT-2's cameras to capture images. Manage camera use, images, and live view from the Opentrons App:
  - Enable or disable the camera. The camera can capture images of the deck during a protocol or take an image when an error occurs.
  - Turn on a live view of the Flex or OT-2 deck during your protocol run.
  - View, download, or delete images after a protocol run.
- Choose to return tips to the tip rack in a Quick Transfer. The pipette will return tips to their original position in the tip rack, and you won't be able to pick up these tips again in the same protocol.

### Bug Fixes

- An attached pipette no longer descends to attach a calibration probe for Labware Position Check, creating more clearance on the deck.
- Changed runtime parameters no longer revert to their default values.

---


## Opentrons App Changes in 8.7.0

Welcome to the v8.7.0 release of the Opentrons App! This release adds support for Opentrons Tough Universal Lids, improves error recovery on the Opentrons App and Flex touchscreen, and addresses several bugs.

### New Features

Use Opentrons Tough Universal Lids on compatible well plates and reservoirs.

### Improvements

- Recover from Flex Stacker errors to resume your protocol:
  - If you try to store labware in the Stacker, but the shuttle is empty.
  - If the Stacker stalls when storing or retrieving labware.

### Bug Fixes

- Liquid colors now match across deck views on the Opentrons App and Flex touchscreen.
- The run log now properly shows robot motor control actions for Flex 96-channel pipettes.
- The API raises an error when the Flex Gripper fails to pick up a lid.
- Deck views in error recovery now include labware loaded in a Flex Stacker.
- Quick transfers no longer crash when adding an air gap or blow out after dispensing.


## Opentrons App Changes in 8.6.0

Welcome to the v8.6.0 release of the Opentrons App! This release adds support for the Flex Stacker Module, as well as other improvements.

### New Features

- Automate labware storage with the Flex Stacker Module. Store additional well plates, reservoirs, or Flex tip racks to move onto the deck during a protocol, increasing workflow throughput.

### Improvements

- Choose from three Opentrons-verified liquid classes to optimize liquid handling in quick transfers.
- Easily tell your tip racks apart during run setup. Colored tip racks now appear in the app to match different tip volume ranges.
- Improvements to Labware Position Check include new prompts to apply offsets before a protocol run.

### Known Issues

- Error recovery may fail when trying to store labware in the Stacker.

---


## Opentrons App Changes in 8.5.1

Welcome to the v8.5.1 release of the Opentrons App!

There are no changes to the Opentrons App in v8.5.1, but it is required for updating the robot software to improve some features.

---


## Opentrons App Changes in 8.5.0

Welcome to the v8.5.0 release of the Opentrons App! This release features the ability to run protocols that use liquid classes to improve pipetting accuracy.

### New Features

- The app now supports running protocols that use liquid class features in the Python API, including Opentrons-verified and custom liquid class definitions.

### Bug Fixes

- Fixes errors (code 422) when performing Labware Position Check on an OT-2.
- Error recovery now provides the correct options when a blowout causes an overpressure error.

---


## Opentrons App Changes in 8.4.1

The 8.4.1 hotfix release fixes two issues:

- Placing a Magnetic Block in slot C2 no longer prevents Labware Position Check from running.
- Existing labware offsets are no longer doubled during Labware Position Check.
- The app no longer crashes during run setup when using certain custom labware.

---


## Opentrons App Changes in 8.4.0

Welcome to the v8.4.0 release of the Opentrons App! This release includes updates to labware offsets on the Flex, as well as other new features, improvements, and bug fixes.

### New Features

- Run Flex protocols with updated liquid handling commands, including pipetting relative to liquid meniscus.
- Run protocols that use the Flex Gripper to remove lids from new tip racks on the deck.
- Run protocols with stacked Opentrons Tough Auto-Sealing Lids.

### Improvements

- More flexible and reliable Labware Position Check workflow. Click **Labware offsets** during run setup to view, apply, and create labware offsets.
  - Check individual labware, in any order.
  - Create and apply default labware offsets to the same labware across your Flex deck.
  - Save and reuse as many offsets as you need from previous runs.
  - Better compatibility with protocols that have runtime parameters.
- Error recovery now allows you to resume your Flex protocol when the door is opened or a second error occurs.

### Bug Fixes

- Error recovery no longer lets you select more tips than the pipette can pick up at once.

---


## Opentrons App Changes in 8.3.2

Welcome to the v8.3.2 release of the Opentrons App!

There are no changes to the Opentrons App in v8.3.2, but it is required for updating the robot software to improve some features.

---


## Opentrons App Changes in 8.3.1

The 8.3.1 hotfix release includes a small fix to allow all robots to properly reboot after an upgrade to v8.3.0.

---


## Opentrons App Changes in 8.3.0

Welcome to the v8.3.0 release of the Opentrons App! This release adds support for Mandarin in the app or Flex touchscreen and includes other beta features for our commercial partners.

Note: The Mac and Linux versions of the Opentrons App now require macOS 10.16 and Ubuntu 20.04 or newer.

### New Features

- Change the app or Flex touchscreen language to Mandarin in Settings. This feature is only supported in app v8.3.0 or higher. If you need to downgrade your software version, first change the app language back to English in Settings.

### Improved Features

- Improvements to the Flex error recovery feature help protocols recover from detected stalls and collisions, saving you valuable time and resources.

---


## Opentrons App Changes in 8.2.0

Welcome to the v8.2.0 release of the Opentrons App! This release adds support for the Opentrons Absorbance Plate Reader Module, as well as other features.

### New Features

- Run protocols that use the Absorbance Plate Reader and check the status of the module on the robot details screen for your Flex.
- Run protocols that use the new Opentrons Tough PCR Auto-Sealing Lid with the Thermocycler Module GEN2. Stacks of these lids appear in a consolidated view when setting up labware.

### Improved Features

- Error recovery now works in more situations and has more options.
  - Recover from gripper errors.
  - Recover from failure to drop tips.
  - Indicate that an error was improperly detected and skip similar errors later in the run.
  - Choose from more options of where to drop tips as part of recovery.
  - Disable error recovery entirely, if your application requires it. Runs will fail on any error.

### Bug Fixes

- Fixed an app crash when performing certain error recovery steps with Python API version 2.15 protocols.

### Known Issues

- If you attach an Absorbance Plate Reader to _any_ Flex on your local network, you must update all copies of the Opentrons App on the same network to at least v8.1.0.

---


## Opentrons App Changes in 8.1.0

Welcome to the v8.1.0 release of the Opentrons App!

There are no new features in the Opentrons App in v8.1.0, but it is required for updating the robot software to support the latest production version of Flex robots.

### Bug Fixes

- Prevented Flex from showing the first-run screen when powering on a robot that's already set up.

---


## Opentrons App Changes in 8.0.0

Welcome to the v8.0.0 release of the Opentrons App!

### New Features

- Recover from errors during a protocol run on Flex. If certain types of errors occur, you will have the option to manually correct the error and resume your protocol. Follow detailed recovery instructions on the touchscreen or in the app.
- Perform quick transfers on Flex. Set up a new quick transfer directly on the touchscreen, specifying a tip rack and up to two labware for pipetting — no protocol file or coding required! You can save and reuse up to 20 quick transfers on a particular Flex robot.
- Use CSV files as runtime parameters. When setting up a protocol in the app, choose any file on your computer. Or on Flex, select from files already stored on the robot or on an attached USB drive. See the Python API documentation for more information on adding CSV capability to your protocols.

### Improved Features

- Run protocols using the latest version of the Python API (2.20), which adds more partial tip pickup configurations (Flex and OT-2 GEN2 pipettes) and the ability to detect whether a well contains liquid (Flex pipettes only).
- Tap or click on any labware on the deck map to see adapters and modules that are stacked below it.
- Lists of liquids now separately show the total volume and per-well volume (when it is the same in each well containing that liquid).
- Improved instructions for what to do when a Flex protocol completes or is canceled with liquid-filled tips attached to the pipette.

### Known Issues

- Stored labware offsets can't be applied to protocols that require selecting a CSV file as a runtime parameter value. Write the protocol in such a way that it passes analysis with or without the CSV file, or run Labware Position Check after confirming parameter values.
- Error recovery can't perform partial tip pickup, because it doesn't account for the pipette nozzle configuration of 8- and 96-channel pipettes. If a recovery step requires partial tip pickup, cancel the protocol instead.
- Downloading robot logs via USB may take up to 2 minutes on macOS, and may fail entirely on Windows. Use an Ethernet or Wi-Fi connection to download logs if needed.

---
