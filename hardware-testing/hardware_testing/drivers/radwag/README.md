# radwag

Connect to a Radwag scale, configure its settings, and read weights.

Some Radwag settings cannot be controlled remotely.

Listed below are the things the must be done using the touchscreen:
 1) Set profile to USER
 2) Set screensaver to NONE

## Usage

```python
from hardware_testing.drivers import find_port
from hardware_testing.drivers.radwag import RadwagScale

# find port using known VID:PID, then connect
vid, pid = RadwagScale.vid_pid()
scale = RadwagScale.create(port=find_port(vid=vid, pid=pid))
scale.connect()
# read grams and stability marker
grams, is_stable = scale.read_mass()
print(f"Scale reading: grams={grams}, is_stable={is_stable}")
# disconnect from serial port
scale.disconnect()
```
