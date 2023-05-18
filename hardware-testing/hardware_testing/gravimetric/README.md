#Running Pipette accuracy tests

## Before pushing to the robot

These tests need some special patches applied to the main source code in order to work as intended.
To apply these patches first `cd hardware-testing` from the base of the repository and run `make apply-patches-gravimetric`
This will automatically apply the required changes to the source code.

If you would like to remove those patches you can run `make remove-patches-gravimetric`

### Updating the Patches

In order to change the patches for testing first make sure you have checked out your branch
use the `make apply-patches-gravimetric` to load the old changes first
Now you can edit the source code and when you are ready you can run `make update-patches-gravimetric`

the changes you made will now be updated in the hardware_testing/gravimetric/overrides/\*.patch files
and you can commit those changes to your branch with a clean source code.
the `make update-patches-gravimetric` will remove the patches so after creating your commit simply run
`make apply-patches-gravimetric` again to resume working on your changes.

## Photometric tests

## Gravimetric tests
