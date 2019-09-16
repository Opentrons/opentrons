# Robot OS Changes from 3.11.4 to 3.12.0

For more details about this release, please see the full [technical change log][changelog]

[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md

## New Features

- We've added definitions for various labware and tubes from [NEST Biotechnology][nest]; check them out in the [Labware Library][labware-library-nest]

[nest]: https://nestbiotechnology.en.ec21.com/
[labware-library-nest]: https://labware.opentrons.com/?manufacturer=NEST

## Bug Fixes

- We fixed an issue with the tip probe algorithm to correct for some middle-switch misses
- We removed some badly behaving code that was arbitrarily causing "large" (>4.5 MB) protocol uploads and simulations to fail
- We fixed some problems with our Jupyter notebook configuration that were broken during our operating system update in 3.11.x
  - File deletion has been fixed
  - Migration of pre-3.11 Jupyter Notebooks to the new location `/var/lib/jupyter/notebooks` has also been fixed
- Removed an incorrect Network Manager setting that was blocking auto-IP detection for _all_ Ethernet interfaces instead of only the built-in one
  - Plugging in external USB-to-Ethernet adapters to connect your OT-2 to a wired network should work again

## Known Issues

- While the underlying definition is correct, there is a known API bug that is causing the robot to think a "50 mL" tube in a "15 / 50 mL" tube rack is the same height as the "15 mL" tube
- When attaching or detaching a pipette from the left mount, the robot homes twice in the X direction
