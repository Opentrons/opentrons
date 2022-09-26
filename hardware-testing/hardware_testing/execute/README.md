# execute

Implementation details for individual productions tests.

The idea here is that the top-level protocol should be as small as possible, so details can be put in `execute` like:

- Number of cycles/samples
- Volumes to be tested
- Speed/depth parameters
- Pass/fail criteria

## gravimetric

Implements a gravimetric evaluation of an OT2 single-channel GEN2 pipette.

A `LiquidClassSettings` is used to control the pipetting movements, while a `GravimetricRecorder` saves all scale data to disk.

After the test is complete, the recording is read back, and each aspirate/dispense weight is calculated from the recording.
