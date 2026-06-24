For more details about this release, please see the full [technical change
log][].

[technical change log]: https://github.com/Opentrons/opentrons-ot2/releases

By using Opentrons OT-2 Protocol Designer, you agree to the Opentrons End-User License Agreement (EULA). You can view the EULA at [opentrons.com/eula](https://opentrons.com/eula).

---

## Opentrons OT-2 Protocol Designer 26.6.0

This release is designed specifically for use with Opentrons OT-2 robots, and includes several bug fixes and improvements.

### Improvements

- When OT-2 Protocol Designer detects a collision risk, the error message specifies the deck slot containing labware, modules, or fixtures at risk. To resolve the error, remove the items or move them to a new deck slot.
- In every OT-2 Protocol Designer step, pipettes must be able to safely pick up accessible tips from their tip rack. Improvements in this release can help you troubleshoot accessible tip errors:
  - Warnings let you know when your deck setup or tip pickup settings present a collision risk with other tips or labware.
  - In a transfer or mix step form, click **Manual tip tracking**, then click to select tips. This form can show you which tips are inaccessible and could cause a collision.
- When you import a protocol with timeline errors, OT-2 Protocol Designer maintains and displays the errors to help you troubleshoot.

### Bug Fixes

- OT-2 Protocol Designer allows manual tip tracking with a partial column pickup (for 5 or more pipette tips).
- Fixed an error caused by returning tips in certain transfers above a pipette's maximum volume.
- Protocols that include partial column (2-7 pipette tips) liquid handling steps aspirate from and dispense into the correct source and destination wells.
- Protocol Designer lets you select all accessible wells for partial column tip pickups in compatible labware.

---

For information on previous releases of Protocol Designer (for OT-2 and Opentrons Flex), see the [Protocol Designer Release Notes](https://github.com/Opentrons/opentrons/blob/edge/protocol-designer/release-notes.md).
