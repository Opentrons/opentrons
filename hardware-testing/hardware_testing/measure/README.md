# measure

## weight

### scale

Provides a common interface for working with a scale, regardless of hardware model and whether we are simulating or not.

Abstracts away details of driver when possible.

```python
from hardware_testing.opentrons_api import helpers
from hardware_testing.measure.weight.scale import Scale

scale = Scale.build(ctx=helpers.get_api_context("2.13"))
scale.connect()
scale.initialize()
scale.tare(0.0)
mass = scale.read()
print(f"Mass: grams={mass.grams}, stable={mass.stable}, time={mass.time}")
scale.disconnect()
```

### record

The `GravimetricRecorder` class will read from a scale at a constant interval, and save those read values to a CSV file. This is accomplished by (optionally) running in a separate thread.

The idea is that a test should be able to "start" and "stop" a recording stream from the scale. This recording should be in real-time and recoverable if an unintended interruption occurs.

```python
from time import time, sleep
from hardware_testing import data
from hardware_testing.measure.weight import record
from hardware_testing.opentrons_api import helpers

cfg = record.GravimetricRecorderConfig(
    test_name="my-recorder-test",
    run_id=data.create_run_id(),
    start_time=time(),
    duration=0,         # set to non-zero value to record for specific length of time
    frequency=10,       # frequency (per-second / hertz) of sampling rate
    stable=False,       # if True, will only record "stable" measurements
)
recorder = record.GravimetricRecorder(ctx=helpers.get_api_context("2.13"), cfg=cfg)
recorder.record(in_thread=True)  # run in separate thread
sleep(3)
recorder.stop()
rec = recorder.recording
print(f"Recording: average={rec.average}, duration={rec.duration}")
```
