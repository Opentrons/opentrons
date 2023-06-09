# Photometric OT2

Script for using an OT2 to validate the installation of plate-reader.

This script runs two procedures back-to-back:
1) Transfer 12 samples of dye to a plate (to be measured in a plate-reader)
2) Measure 12 samples of the same volume on a gravimetric fixture

%CV is calculated separately for each procedure.

The steps above will then be repeated for a total of 8 trials, creating a total of 96 samples per test volume.

Those 8 trials will be ran on the following volumes:
 - 200 uL
 - 20 uL
 - 1 uL
 - 250 uL
 - 970 uL

See explaination and details for each volume below.

# Procedure

An OT2 gravimetric fixture will have installed this software package.

A computer will have installed the Opentrons App, as well as SSH and SCP.

## Calibrate

Calibration is done using the Opentrons App. Each labware and pipette can be calibrated normally with the App.

**NOTE**: The one exception is the `vial` on the scale. This vessel must be given an offset that aligns with the liquid level.

Each unique pipette and deck configuration requires a different protocol for calibration.

- `photometric_calibrate_baseline.py`
  - P300 Multi Gen2 on the RIGHT mount
  - Radwag `AS 82/220.R2`
- `photometric_calibrate_p300.py`
  - P300 Single Gen2 on the LEFT mount
  - Radwag `AS 82/220.R2`
- `photometric_calibrate_p20.py`
  - P300 Single Gen2 on the LEFT mount
  - P20 Single Gen2 on the RIGHT mount
  - Radwag `XA 6/21.4Y.M.A.P` with evaporation trap
- `photometric_calibrate_p1000.py`
  - P1000 Single Gen2 on the RIGHT mount
  - Radwag `AS 82/220.R2`

## Connect and Run

1. Power on gravimetric fixture
2. Connect Ethernet/USB to computer
3. Copy IP address from Opentrons App
4. `ssh -i ~/.ssh/robot_key -o stricthostkeychecking=no -o userknownhostsfile=/dev/null root@<ROBOT_IP>`
5. `cd /data/user_storage`
6. Copy/Paste a command from below

Keep Ethernet/USB connected and SSH session running during entire test run.

## Update Software

1. Power on gravimetric fixture
2. Connect Ethernet/USB to computer
3. Copy IP address from Opentrons App
4. `cd ~/Documents/github/Mechanical-Test`
5. `git pull`
6. `scp -r ./Photometric root@<ROBOT_IP>:/data/user_storage`

# Commands

### Baseline

One baseline reading is required every `10` hours. This command simply fills a plate with baseline liquid.

Calibrate in the Opentrons App using `photometric_calibrate_baseline.py`

```commandline
python mvs_test_ot2.py --baseline --same-tip
```

### 200 uL

Start here. `200` microliters is the most basic photometric test we can run.

Calibrate in the Opentrons App using `photometric_calibrate_p300.py`

```commandline
python mvs_test_ot2.py --volume 200 --row A --dye-cols 1 --photo --grav
python mvs_test_ot2.py --volume 200 --row B --dye-cols 2 --photo --grav
python mvs_test_ot2.py --volume 200 --row C --dye-cols 3 --photo --grav
python mvs_test_ot2.py --volume 200 --row D --dye-cols 4 --photo --grav
python mvs_test_ot2.py --volume 200 --row E --dye-cols 5 --photo --grav
python mvs_test_ot2.py --volume 200 --row F --dye-cols 6 --photo --grav
python mvs_test_ot2.py --volume 200 --row G --dye-cols 7 --photo --grav
python mvs_test_ot2.py --volume 200 --row H --dye-cols 8 --photo --grav
```

### 20 uL

Transfer smaller volumes requires using diluent. Test `20` microliters by first adding `180` microliters of diluent.

Calibrate in the Opentrons App using `photometric_calibrate_p300.py`

```commandline
python mvs_test_ot2.py --volume 180 --row A --dye-cols 1 --photo --same-tip
python mvs_test_ot2.py --volume 20 --row A --dye-cols 2 --photo --grav --has-diluent
python mvs_test_ot2.py --volume 180 --row B --dye-cols 3 --photo --same-tip
python mvs_test_ot2.py --volume 20 --row B --dye-cols 4 --photo --grav --has-diluent
python mvs_test_ot2.py --volume 180 --row C --dye-cols 5 --photo --same-tip
python mvs_test_ot2.py --volume 20 --row C --dye-cols 6 --photo --grav --has-diluent
python mvs_test_ot2.py --volume 180 --row D --dye-cols 7 --photo --same-tip
python mvs_test_ot2.py --volume 20 --row D --dye-cols 8 --photo --grav --has-diluent
```
Replace the trough with a new one before continuing on.
```commandline
python mvs_test_ot2.py --volume 180 --row E --dye-cols 1 --photo --same-tip
python mvs_test_ot2.py --volume 20 --row E --dye-cols 2 --photo --grav --has-diluent
python mvs_test_ot2.py --volume 180 --row F --dye-cols 3 --photo --same-tip
python mvs_test_ot2.py --volume 20 --row F --dye-cols 4 --photo --grav --has-diluent
python mvs_test_ot2.py --volume 180 --row G --dye-cols 5 --photo --same-tip
python mvs_test_ot2.py --volume 20 --row G --dye-cols 6 --photo --grav --has-diluent
python mvs_test_ot2.py --volume 180 --row H --dye-cols 7 --photo --same-tip
python mvs_test_ot2.py --volume 20 --row H --dye-cols 8 --photo --grav --has-diluent
```

### 250 uL

The largest volume we can measure photometrically is `250` microliters per well.

The big difference here is that the shaking step must be ran at a lower RPM, to avoid splashing.

Calibrate in the Opentrons App using `photometric_calibrate_p300.py`

```commandline
python mvs_test_ot2.py --volume 250 --row A --dye-cols 1 --photo --grav
python mvs_test_ot2.py --volume 250 --row B --dye-cols 2 --photo --grav
python mvs_test_ot2.py --volume 250 --row C --dye-cols 3 --photo --grav
python mvs_test_ot2.py --volume 250 --row D --dye-cols 4 --photo --grav
python mvs_test_ot2.py --volume 250 --row E --dye-cols 5 --photo --grav
python mvs_test_ot2.py --volume 250 --row F --dye-cols 6 --photo --grav
python mvs_test_ot2.py --volume 250 --row G --dye-cols 7 --photo --grav
python mvs_test_ot2.py --volume 250 --row H --dye-cols 8 --photo --grav
```

### 970 uL

Measuring volumes greater than the per-well max (eg: `250`) can be done by dividing the sample between multiple wells.

The pipette will "distribute" or run a "multi-dispense". The number of dispense is set with the `--hv-divide` argument.

**NOTE**: The largest volume this test uses is `970` instead of the pipette's max `1000`, because the Opentrons API does not yet support the liquid-class functionality implemented in this script.

**NOTE**: Because test volumes are divided between 4 wells, each trial yields 3 samples instead of the usual 12. This means that filling an entire wellplate will yield 24 samples instead of 96.

Calibrate in the Opentrons App using `photometric_calibrate_p1000.py`

```commandline
python mvs_test_ot2.py --pip-size 1000 --volume 970 --hv-divide 4 --row A --dye-cols 1 --photo --grav
python mvs_test_ot2.py --pip-size 1000 --volume 970 --hv-divide 4 --row B --dye-cols 2 --photo --grav
python mvs_test_ot2.py --pip-size 1000 --volume 970 --hv-divide 4 --row C --dye-cols 3 --photo --grav
python mvs_test_ot2.py --pip-size 1000 --volume 970 --hv-divide 4 --row D --dye-cols 4 --photo --grav
python mvs_test_ot2.py --pip-size 1000 --volume 970 --hv-divide 4 --row E --dye-cols 5 --photo --grav
python mvs_test_ot2.py --pip-size 1000 --volume 970 --hv-divide 4 --row F --dye-cols 6 --photo --grav
python mvs_test_ot2.py --pip-size 1000 --volume 970 --hv-divide 4 --row G --dye-cols 7 --photo --grav
python mvs_test_ot2.py --pip-size 1000 --volume 970 --hv-divide 4 --row H --dye-cols 8 --photo --grav
```

### 1 uL

Testing `1` microliter also requires diluent. Also, measuring `1` microliter requires a more accurate scale.

Calibrate in the Opentrons App using `photometric_calibrate_p20.py`

```commandline
python mvs_test_ot2.py --pip-mount left --volume 199 --row A --dye-cols 1 --photo --same-tip
python mvs_test_ot2.py --pip-size 20 --volume 1 --row A --dye-cols 2 --photo --grav --has-diluent
python mvs_test_ot2.py --pip-mount left --volume 199 --row B --dye-cols 3 --photo --same-tip
python mvs_test_ot2.py --pip-size 20 --volume 1 --row B --dye-cols 4 --photo --grav --has-diluent
python mvs_test_ot2.py --pip-mount left --volume 199 --row C --dye-cols 5 --photo --same-tip
python mvs_test_ot2.py --pip-size 20 --volume 1 --row C --dye-cols 6 --photo --grav --has-diluent
python mvs_test_ot2.py --pip-mount left --volume 199 --row D --dye-cols 7 --photo --same-tip
python mvs_test_ot2.py --pip-size 20 --volume 1 --row D --dye-cols 8 --photo --grav --has-diluent
```
Replace the trough with a new one before continuing on.
```commandline
python mvs_test_ot2.py --pip-mount left --volume 199 --row E --dye-cols 1 --photo --same-tip
python mvs_test_ot2.py --pip-size 20 --volume 1 --row E --dye-cols 2 --photo --grav --has-diluent
python mvs_test_ot2.py --pip-mount left --volume 199 --row F --dye-cols 3 --photo --same-tip
python mvs_test_ot2.py --pip-size 20 --volume 1 --row F --dye-cols 4 --photo --grav --has-diluent
python mvs_test_ot2.py --pip-mount left --volume 199 --row G --dye-cols 5 --photo --same-tip
python mvs_test_ot2.py --pip-size 20 --volume 1 --row G --dye-cols 6 --photo --grav --has-diluent
python mvs_test_ot2.py --pip-mount left --volume 199 --row H --dye-cols 7 --photo --same-tip
python mvs_test_ot2.py --pip-size 20 --volume 1 --row H --dye-cols 8 --photo --grav --has-diluent
```
