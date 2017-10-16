#!/bin/bash

#run after the smoothie has a new build flashed

# 7) write RESET to ground
echo "6" > /sys/class/gpio/export
echo "out" > /sys/class/gpio/gpio18/direction
echo "0" > /sys/class/gpio/gpio18/value

# 8) write RESET back to high (pi's 3.3v)
echo "6" > /sys/class/gpio/export
echo "out" > /sys/class/gpio/gpio18/direction
echo "1" > /sys/class/gpio/gpio18/value

