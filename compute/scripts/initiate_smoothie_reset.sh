#!/bin/bash

# 1) write RESET to ground
echo "6" > /sys/class/gpio/export
echo "out" > /sys/class/gpio/gpio18/direction
echo "0" > /sys/class/gpio/gpio18/value

# 2) write ISP Boot to ground
echo "8" > /sys/class/gpio/export
echo "out" > /sys/class/gpio/gpio18/direction
echo "0" > /sys/class/gpio/gpio18/value

# 3) write RESET back to high (pi's 3.3v)
echo "6" > /sys/class/gpio/export
echo "out" > /sys/class/gpio/gpio18/direction
echo "1" > /sys/class/gpio/gpio18/value

# 4) delay 0.5 second
sleep(0.5)

# 5) write ISP Boot back to high (pi's 3.3v)
echo "8" > /sys/class/gpio/export
echo "out" > /sys/class/gpio/gpio18/direction
echo "1" > /sys/class/gpio/gpio18/value


# after this setup state is entered, the device that is connected to the
# smoothie over serial should execute the lpc21isp
# 6) run lpc21isp
# 7) write RESET to ground
# 8) write RESET back to high (pi's 3.3v)
