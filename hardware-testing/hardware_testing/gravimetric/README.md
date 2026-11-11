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

## P1000H extra profile: manual replacement after 5 uL

`protocol_replacement/96ch1000_extra.csv` uses a separate A3 probe rack before
the normal T50 / T200 / T1000 sequence. This behavior applies to full-rack
P1000H profiles with `is_extra=TRUE`, tips `50,200,1000`, and T50 test volumes
`5,50` in that order.

Start with **ten T50 racks on adapters**, including one at A3 for initial liquid
probing and evaporation blanks. The A3 rack stays in place and is never moved by
the gripper or recovered into a stacker. Keep the normal P1000H stacker supply
layout, including the spare T50 rack on the B4 shuttle and its six T200 hopper
racks. The C4 and D4 supplies also retain the normal P1000H layout.

The 5 uL trials use the nine preloaded T50 racks in order:
`D2, D3, C2, C3, B1, B2, B3, A1, A2`. After all nine trials pass the existing QC
check, the protocol pauses once. Replace only the nine test racks with fresh T50
racks. Keep the original A3 probe rack in place, without moving or replacing it,
and retain all ten adapters. Leave the stacker supplies unchanged. On resume,
the protocol registers the nine new racks and performs the normal T50 liquid
probe from D2. The normal rack refresh then recovers that probe rack to A4 and
replaces it with the spare T50 from B4. Testing continues with 50 uL, then
T200 / 200 uL and T1000 / 1000 uL using the original stacker flow. No additional
evaporation blank is run. The 5 uL racks leave the deck manually; none enter the
stackers.

With stackers disabled, use the same initial ten-rack deck layout and replacement
pause after 5 uL, with manual rack changes thereafter.
A3 is included in protocol analysis for Labware Position Check. The evaporation
calculation and the `fail_early` behavior are unchanged: a failed 5 uL QC check
stops the run before the replacement pause.

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
