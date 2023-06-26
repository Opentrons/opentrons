#Running Pipette accuracy tests

## Before pushing to the robot

These tests need some special patches applied to the main source code in order to work as intended.
To apply these patches first `cd hardware-testing` from the base of the repository and run `make apply-patches-gravimetric`
This will automatically apply the required changes to the source code.

If you would like to remove those patches you can run `make remove-patches-gravimetric`

### Updating the Patches

There is a script that will automatically update the patches. from the base of the repository run
`python hardware-testing/hardware_testing/scripts/update_patches.py`
if you ware merging your branch onto something other than `origin/edge` you can use the following form
and substitute `internal-release` for whatever branch you're merging in to.
`python hardware-testing/hardware_testing/scripts/update_patches.py --upstream origin/internal-release`

## Photometric tests

## Gravimetric tests
