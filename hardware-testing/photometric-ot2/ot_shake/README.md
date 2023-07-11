# OT-Shake

Script for controlling an Opentrons Heater-Shaker during photometric testing.

## Examples

#### Shaking 200 uL

200 uL requires 1 minute of shaking at 1500 rpm.

```
cd ~/Mechanical-Test/Photometric/ot_shake
python ot_shake.py -m COM11 -t 60 -r 1500
```

#### Shaking 201-250 uL

201-250 uL requires 1 minute of shaking at 1100 rpm.

```
cd ~/Mechanical-Test/Photometric/ot_shake
python ot_shake.py -m COM11 -t 60 -r 1100
```
