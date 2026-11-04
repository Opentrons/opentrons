#Running Pipette accuracy tests

## Gripper stacker offset calibration

For keyboard calibration of all 80 stacker/deck routes, see the
[offset calibration guide](offset_calibration/README.md).

## Gravimetric speed runtime parameters

`protocol_replacement/gravimetric_speed.py` uses independent controls for the two impact devices:

| App parameter | Default | Behavior |
|---|---|---|
| Use Impact Protection V2 | Off | Connects and controls the separate V2 grating controller when enabled. |
| Use 96CH Impact Protection | On | Controls the dedicated 96ch fixture, including Home clearance before stacker moves. |
| Use 96CH Stackers | On | Enables stackers for 96-channel full-rack testing. |

The existing `use_impact_protection` variable now refers to the dedicated 96ch fixture.
The new `use_impact_protection_v2` variable independently controls V2 for all pipette types.
Turning V2 off does not disable the 96ch fixture. When V2 is explicitly enabled, a missing V2 still fails initialization.
Re-upload the updated protocol and create a new run to use the new parameter defaults.

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

python3 -m hardware_testing.gravimetric --pipette 1000 --channels 96 --photometric --tip 50
python3 -m hardware_testing.gravimetric --pipette 1000 --channels 96 --photometric --tip 200

## Gravimetric tests

###P1000 single channel QC
python3 -m hardware_testing.gravimetric --pipette 1000 --channels 1
python3 -m hardware_testing.gravimetric --pipette 1000 --channels 1 --extra
###P1000 multi channel QC
python3 -m hardware_testing.gravimetric --pipette 1000 --channels 8
python3 -m hardware_testing.gravimetric --pipette 1000 --channels 8 --extra
###P1000 96 channel QC
python3 -m hardware_testing.gravimetric --pipette 1000 --channels 96
###P50 single channel QC
python3 -m hardware_testing.gravimetric --pipette 50 --channels 1
python3 -m hardware_testing.gravimetric --pipette 50 --channels 1 --extra
###P50 multi channel QC
python3 -m hardware_testing.gravimetric --pipette 50 --channels 8
python3 -m hardware_testing.gravimetric --pipette 50 --channels 8 --extra
###Increment tests
python3 -m hardware_testing.gravimetric --pipette 1000 --channels 1 --increment --tip 50
python3 -m hardware_testing.gravimetric --pipette 1000 --channels 1 --increment --tip 200
python3 -m hardware_testing.gravimetric --pipette 1000 --channels 1 --increment --tip 1000
python3 -m hardware_testing.gravimetric --pipette 1000 --channels 8 --increment --tip 50
python3 -m hardware_testing.gravimetric --pipette 1000 --channels 8 --increment --tip 200
python3 -m hardware_testing.gravimetric --pipette 1000 --channels 8 --increment --tip 1000
python3 -m hardware_testing.gravimetric --pipette 50 --channels 1 --increment --tip 50
python3 -m hardware_testing.gravimetric --pipette 50 --channels 8 --increment --tip 50
