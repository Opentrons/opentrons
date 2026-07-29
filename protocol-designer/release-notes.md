For more details about this release, please see the full [technical change
log][]. For a list of currently known issues, please see the [Opentrons issue tracker][].

[technical change log]: https://github.com/Opentrons/opentrons/releases
[opentrons issue tracker]: https://github.com/Opentrons/opentrons/issues?q=is%3Aopen+is%3Aissue+label%3Abug

By using Opentrons Protocol Designer, you agree to the Opentrons End-User License Agreement (EULA). You can view the EULA at [opentrons.com/eula](https://opentrons.com/eula).

---

## Opentrons Protocol Designer Changes in 9.0.1

**Welcome to Protocol Designer 9.0.1!**

This release includes bug fixes for Protocol Designer for Opentrons Flex.

### Bug Fixes

- Flex 20 µL filter pipette tips are compatible with the Flex Stacker in Protocol Designer protocols.
- Protocol Designer no longer crashes when selecting multiple wells in a transfer step.
- Flex 96-channel pipettes aspirate and dispense from the proper positions in NEST 8 well reservoirs (22 mL).

## Opentrons Protocol Designer Changes in 9.0.0

**Welcome to Protocol Designer 9.0.0!**

This release is designed specifically for use with Opentrons Flex, and includes several bug fixes and improvements.

### Improvements

- When Protocol Designer detects a collision risk, the error message specifies the deck slot containing labware, modules, or fixtures at risk. To resolve the error, remove the items or move them to a new deck slot.
- In every Protocol Designer step, pipettes must be able to safely pick up accessible tips from their tip rack. Improvements in this release can help you troubleshoot accessible tip errors:
  - Warnings let you know when your deck setup or tip pickup settings present a collision risk with other tips or labware.
  - In a transfer or mix step form, click **Manual tip tracking**, then click to select tips. This form can show you which tips are inaccessible and could cause a collision.
- When you import a protocol with timeline errors, Protocol Designer maintains and displays the errors to help you troubleshoot.

### Bug Fixes

- Protocol Designer allows manual tip tracking with:
  - A partial column pickup (for 5 or more pipette tips).
  - Tip pickups with Flex 20 µL pipette tips.
- Protocols that include partial column (2-7 pipette tips) liquid handling steps aspirate from and dispense into the correct source and destination wells.
- Protocol Designer no longer includes unnecessary collision warnings when:
  - Transferring liquid with every nozzle of a Flex 96-channel pipette.
  - Aspirating from or dispensing to single-well reservoirs.
  - Using the Flex 96-channel pipette to pick up tips from a rack next to a single-well reservoir or an empty Flex Stacker shuttle.
- Move Opentrons Tough Universal Lids onto any compatible labware on the deck.
- Protocol Designer lets you select all accessible wells for partial column tip pickups in compatible labware.

## Opentrons Protocol Designer Changes in 8.10.1

**Welcome to Protocol Designer 8.10.1!**

This hotfix release addresses the following bugs:

- Protocol Designer no longer includes excess collision errors when you choose a safe well and nozzle combination to:
  - transfer liquid to or from labware in the OT-2 Thermocycler Module.
  - use partial tip pickup with an 8- or 1-channel pipette in a 384-well plate.
  - transfer liquid with a 96-channel pipette.
- Protocol Designer lets you customize a location within the source or destination well to blow out excess liquid.

## Opentrons Protocol Designer Changes in 8.10.0

**Welcome to Protocol Designer 8.10.0!**

This release adds full support for Flex 20 µL pipette tips and all available partial tip pickup configurations in Protocol Designer, and includes other bug fixes and improvements.

### New Features

- Use Flex 20 µL pipette tips in your Protocol Designer protocols, including with liquid class transfers.
- Choose from additional partial tip pickup options in Protocol Designer:
  - Flex 96-channel pipette single column (column 1), single row (row A or H), or single nozzle (A1, A12, or H1) tip pickup.
  - Flex 8-channel pipette partial column pickup (2–7 consecutive nozzles ending at H1).
  - OT-2 8-channel pipette partial column pickup (2–7 consecutive nozzles ending at H1).
- Return tips to their original position in the tip rack with a pipette configured for partial tip pickup. Tips are marked "used" and can be picked up again using manual tip tracking.

### Improvements

- Customize your blowout location within a source or destination well.

### Bug Fixes

- Use partial tip pickup for a transfer or mix step in a tube rack without errors.
- Protocol Designer only lets you add a transfer step when the deck contains at least one labware without a lid, accessible to your attached pipette.
- Protocol Designer lets you add compatible Opentrons Tough Universal Lids on custom well plates or reservoirs without errors.
- Labware nicknames now apply to the topmost labware that is not a lid.

### Known Issues

- Opentrons pipettes' [low volume mode](https://docs.opentrons.com/python-api/pipettes/volume-modes/) makes small changes to pipette settings and behavior to ensure accuracy when aspirating and dispensing small volumes. Protocol Designer can make errors in these changes when distributing less than 5 µL with Flex 20 µL pipette tips. If your protocol fails analysis with an error for tip bounds, you'll need to adjust the volumes used in your step.

## Opentrons Protocol Designer Changes in 8.9.1

**Welcome to Protocol Designer 8.9.1!**

This hotfix release addresses a bug to properly export, import, and update Protocol Designer protocols to the latest version.

## Opentrons Protocol Designer Changes in 8.9.0

**Welcome to Protocol Designer 8.9.0!**

This release introduces updated Thermocycler Module steps and includes other bug fixes.

### New Features

- Your Protocol Designer protocol can run Thermocycler Module profiles while pipetting samples or running another module.

### Bug Fixes

- The Flex Stacker Module shows the correct number of labware stored inside.
- Add or remove a Flex Stacker Module or waste chute to the robot deck without triggering protocol errors.

## Opentrons Protocol Designer Changes in 8.8.1

**Welcome to Protocol Designer 8.8.1!**

This hotfix release addresses a bug to allow manual tip selection in any column of a well plate.

## Opentrons Protocol Designer Changes in 8.8.0

**Welcome to Protocol Designer 8.8.0!**

This release adds support for the Flex Stacker Module in Protocol Designer, and includes other bug fixes.

### New Features

- Use the Flex Stacker Module to store and use multiple well plates, PCR plates, or tip racks in your Protocol Designer protocols.

### Bug Fixes

- Protocol Designer properly displays tip racks and their lids on the deck.
- When you choose to mix liquids from the center of a well, Protocol Designer properly exports this location in your finished protocol.

### Known Issues

- Removing a Stacker Module from the deck can also remove other attached hardware. Click **Deck hardware** in the upper left to edit or re-add hardware to the Flex deck.
- Adding a lid to a tiprack placed inside the Flex 96-channel adapter can cause your Protocol Designer protocol to fail analysis in the Opentrons App. In the starting deck, remove the lid from the tip rack before adding to the adapter.

Running a protocol created in Protocol Designer requires Opentrons App version 8.8.0 or newer.

## Opentrons Protocol Designer Changes in 8.7.1

**Welcome to Protocol Designer 8.7.1!**

This hotfix release includes internal updates for debugging.

## Opentrons Protocol Designer Changes in 8.7.0

**Welcome to Protocol Designer 8.7.0!**

This release adds support for manual tip selection and camera steps in Protocol Designer, and includes feature improvements and bug fixes.

### New Features

- Choose between automatic and manual tip tracking for transfer and mix steps in your protocols. In manual tip tracking, Protocol Designer lets you select the tip rack and individual tips the pipette will pick up to transfer or mix liquid.
- Manual tip tracking in Protocol Designer enables reusing tips more than once in a protocol.
- Pick up individual tips with Flex 96-channel and Flex or OT-2 8-channel pipettes.
- Add a camera step in any Protocol Designer protocol. The Flex or OT-2's built-in camera can take a still image of your robot deck at any point during the protocol. Access your images in the Recent Protocol Runs section of the Opentrons App's robot details page.

### Improved Features

- Protocol Designer only shows compatible deck and labware locations to move a lid to.
- Add Opentrons Tough Universal Lids to an available Opentrons Flex Deck Riser placed on the deck.
- Move a tip rack lid to any tip rack on the deck without a lid.
- When adding labware, click to add a tip rack lid to a Flex 96-channel tip rack adapter with a tip rack inside.
- When you click **Duplicate labware**, Protocol Designer duplicates all labware, adapters, lids, and liquids in the deck slot.

### Bug Fixes

- Protocol Designer updates maximum flow rates to the latest version when you import an older protocol.

## Opentrons Protocol Designer Changes in 8.6.3

**Welcome to Protocol Designer 8.6.3!**

This hotfix release addresses the following bugs:

- Protocol Designer no longer crashes when uploading protocols containing custom labware.
- Protocol Designer allows scrolling to view details of a transfer step using a "consolidate" pipette path.
- Eliminates some crashes when deleting liquids that are already used in the protocol.

## Opentrons Protocol Designer Changes in 8.6.1

**Welcome to Protocol Designer 8.6.1!**

This hotfix release updates user information for protocol generation and software versions.

## Opentrons Protocol Designer Changes in 8.6.0

**Welcome to Protocol Designer 8.6.0!**

This release adds support for new instruments, labware, and hardware,enables limited return tip support in Protocol Designer, and includes feature improvements and bug fixes.

### New Features

- Transfer as little as 1 µL in a protocol with the Opentrons Flex 96-Channel Pipette (1–200 µL). This release also adds liquid class transfer support for the pipette.
- Use Opentrons Tough Auto-Sealing Lids on compatible labware in the Thermocycler Module.
- Add new lids to Protocol Designer protocols, including the Opentrons Tough Universal Lid and Opentrons Tough Auto-Sealing Lid. Tip rack lids are also available for Flex tip racks.
- Secure lidded labware properly on the Heater-Shaker Module with the new Opentrons Universal Flat Heater-Shaker Adapter Type B.
- Return an attached pipette tip to the tip rack after aspirating, dispensing, or mixing. Return tip settings in version 8.6.0 are limited to a single return, and you won't be able to pick up these tips again in the same protocol.

### Improved Features

- Add a time in hours for the Heater-Shaker Module to heat or shake samples.
- Exported protocols include step names and details added in Protocol Designer. Each appear as comments above individual steps in the Python protocol file.
- Hover over wells in a labware to view final volumes on the ending deck.
- Protocol Designer includes a warning when deleting a liquid added to labware in your protocol.

### Bug Fixes

- Protocol Designer now raises an error when moving labware to a deleted module.

### Known Issues

- Stacking Opentrons Tough 96 Well Plates (200 µL Full Skirt) during a move step causes protocol analysis failures in the Opentrons App.

## Opentrons Protocol Designer Changes in 8.5.6

**Welcome to Protocol Designer 8.5.6!**

This hotfix release addresses a bug when dispensing into a trash bin or waste chute.

## Opentrons Protocol Designer Changes in 8.5.5

**Welcome to Protocol Designer 8.5.5!**

This hotfix release addresses a bug to allow full use of pipettes and tip racks during liquid class transfers.

## Opentrons Protocol Designer Changes in 8.5.4

**Welcome to Protocol Designer 8.5.4!**

This hotfix release addresses several bugs.

### Bug Fixes

- Set a custom aspirate tip position for any dispense location.
- Protocol Designer correctly reassigns default tip settings when changing pipettes in your protocol.
- Protocol Designer no longer crashes when encountering missing tip rack errors in imported protocols.
- Aspirate and dispense tip positions default to 1 mm above the well bottom if unspecified in your protocols.

## Opentrons Protocol Designer Changes in 8.5.3

**Welcome to Protocol Designer 8.5.3!**

This hotfix release addresses several bugs.

### Bug Fixes

- Crashes and protocol loss no longer occur when:
  - deleting a pipette involved in a mix step.
  - deleting a Protocol Designer step title.
  - checking labware details after deleting a liquid.

- All staging area slots remain when adding new staging areas after initial deck setup.

## Opentrons Protocol Designer Changes in 8.5.2

**Welcome to Protocol Designer 8.5.2!**

This hotfix release addresses several bugs.

### Bug Fixes

- Protocol Designer no longer raises an error when checking your custom labware definitions for well ordering.
- Transfer volumes as large as your tip limit without errors during a multi-dispense with liquid class settings applied.
- Exported Python protocols include numbered commands, making it easier to identify errors.
- Setting well volume over the limit results in a warning rather than a protocol error.
- Crashes and protocol loss no longer occur when viewing liquids added to labware.
- Additional refinement with assigning the correct tip rack to some liquid transfers.

## Opentrons Protocol Designer Changes in 8.5.1

**Welcome to Protocol Designer 8.5.1!**

This hotfix release addresses a bug that caused the incorrect tip rack to be assigned to some liquid transfers.

## Opentrons Protocol Designer Changes in 8.5.0

**Welcome to Protocol Designer v8.5.0!**

This release adds support for liquid classes in Flex protocols, exports Python protocols for Flex and OT-2, and includes feature improvements and bug fixes.

Use Opentrons-verified liquid classes to automatically define transfer settings and optimize liquid handling behavior based on liquid properties like viscosity. When adding liquids to your protocol, select an Opentrons-verified liquid class from the dropdown menu. You can choose whether or not to apply liquid class settings to protocol steps that use compatible Opentrons labware and pipettes.

### New Features

- Make edits to advanced settings like submerge and retract position and speed, touch tip, and air gap to customize each transfer.
- Customize push out volume after a dispense to ensure all liquid leaves the pipette tip.
- Add conditioning volumes to transfer steps. After aspirating liquid, the pipette will aspirate a smaller conditioning volume for a more accurate first dispense.

### Improved Features

- Protocol Designer includes a warning when you clear a labware, a module, or a fixture used in a protocol step.
- Protocol Designer takes extra steps to validate any custom labware you upload.

### Bug Fixes

- Transfer step details show correct aspirate and dispense volumes when distributing liquid (a single aspirate and multiple dispenses).
- During a mix, push out is set to 0 by default for all mixes except for the last, to avoid multiple push out actions. You can choose your own push out volume in a mix step menu.
- Choose a new tip drop location from the dropdown menu when an uploaded protocol is missing a tip drop location.
- Protocol Designer correctly updates adapter and labware combination definitions when you upload a protocol designed in Protocol Designer v7.0.0 or earlier.
- When adding a disposal volume, a blowout location is now required. Older protocols that specified a blowout with no location selected will be updated to blowout in a loaded trash bin or waste chute.
- No longer allow touch tip with incompatible labware. This changes the behavior of imported protocols that had touch tip on incompatible labware.
- If multiple labware end up in the same slot at the same time due to deleting/rearranging steps, an error appears on the protocol timeline.
- If a Heater-Shaker step is created with a a heater set and a timer, the protocol will now wait until the temperature is reached before counting down the timer.
- If the timer of a Heater-Shaker step is toggled on and off, the timer input field no longer errors.
- Successfully delete a defined liquid that has not been assigned to any location.
- Display correct substep details for all transfer paths and pipettes.

Running a protocol created in Protocol Designer now requires Opentrons App version 8.5.1 or newer.

## Opentrons Protocol Designer Changes in 8.4.4

**Welcome to Protocol Designer 8.4.4!**

Changes to file data support importing protocols generated by OpentronsAI.

### Bug Fixes

- When you export a protocol with an unused staging area, gripper, or trash bin, Protocol Designer will include the fixture when your protocol is imported again.
- Fixed a crash when zooming into a slot that has an older version of a labware definition.

### Improved Features

- Increased responsiveness and alignment of the timeline toolbox, step form toolbox, and off-deck view of deck setup.

Running a protocol created in Protocol Designer now requires Opentrons App version 8.3.2 or newer.

## Opentrons Protocol Designer Changes in 8.4.3

**Welcome to Protocol Designer 8.4.3!**

This release adds support for drag and drop labware in Protocol Designer, and includes feature improvements and bug fixes.

When editing your protocol starting deck, click and drag to move any individual piece of labware to a new slot.

### Improvements

- To avoid deck conflicts with fixtures like the trash bin, add only one of each module in protocol setup. Click **Edit protocol** and **Protocol starting deck** to add and edit multiple modules as needed.
- See your protocol starting deck edits more easily with module highlighting when moving labware or editing a module step.

### Bug Fixes

- Protocol Designer always redirects to the protocol overview when you import an existing protocol from the home or settings page.
- When tip racks, labware, or modules aren't assigned to a transfer or module step, improved error recovery in Protocol Designer avoids a crash or unknown error.
- Protocol Designer displays an error for transfer or Flex gripper move steps with off-deck labware, and when a transfer volume exceeds the well limit.
- Touch tip is no longer available during a dispense into the trash bin.

Running a protocol created in Protocol Designer now requires Opentrons App version 8.3.0 or newer.

## Opentrons Protocol Designer Changes in 8.4.2

**Welcome to Protocol Designer 8.4.2!**

This hotfix release addresses a bug during protocol analysis on the Opentrons App caused by an air gap after dispense.

---

## Opentrons Protocol Designer Changes in 8.4.1

Version 8.4.1 was not released due to internal branching issues.

---

## Opentrons Protocol Designer Changes in 8.4.0

**Welcome to Protocol Designer 8.4.0!**

This release adds support for the Absorbance Plate Reader Module and includes feature improvements and bug fixes.

### Bug Fixes

- Move steps added to a Flex protocol now use the gripper by default.
- Use matching X and Y offset values to aspirate and dispense during a Mix step.

All protocols created in Protocol Designer now require version 8.2.0 or higher of the Opentrons App to run.

### New Features

**Absorbance Plate Reader Module GEN1**

You can add an Absorbance Plate Reader Module GEN1 to deck slots A3-D3 on the Flex. You'll also need to use a gripper to safely move the lid on and off the module.

To use the Absorbance Plate Reader Module in your Protocol Designer protocol, add the following steps:

- an Absorbance Plate Reader step to close the lid using the gripper
- an Absorbance Plate Reader step to initialize the module without labware inside. Choose from a single or multiple wavelengths.
- an Absorbance Plate Reader step to open the lid using the gripper
- a Move step to place a plate in the module. Using the gripper is optional.
- an Absorbance Plate Reader step to read the plate using the same wavelength choices.

Data from the Absorbance Plate Reader Module is exported as a .CSV file and can be found on your Flex's detail page in the Opentrons Desktop App. Repeat the steps shown above to open the lid and remove the plate.

---

## Opentrons Protocol Designer Changes in 8.3.0

Welcome to the v8.3.0 release of Opentrons Protocol Designer!

### New Features

- During step creation, labware and modules used are highlighted on the deck.

### Bug Fixes

- Custom labware can be added and moved onto its supported labware.

### Improved Features

- Touch tip and blow out copy is more precise.

---

## Opentrons Protocol Designer Changes in 8.2.2

Welcome to the v8.2.2 release of Opentrons Protocol Designer!

### Bug Fixes

- Fixed an error with the heater-shaker timer field where it would not save from an imported protocol.

### Improved Features

- The analytics modal is dismissible via the settings page for both previous and new users.

---

## Opentrons Protocol Designer Changes in 8.2.1

Welcome to the v8.2.1 release of Opentrons Protocol Designer!

### Bug Fixes

- Fixed blow out not saving when checking it in the form.

---

## Opentrons Protocol Designer Changes in 8.2.0

We’re excited to release the new Opentrons Protocol Designer, now with a fresh redesign! All protocols now require Opentrons App version 8.2.0+ to run. Enjoy the same functionality with the added ability to:

### New Features

- Add multiple Heater-Shaker Modules and Magnetic Blocks to the deck (Flex only).
