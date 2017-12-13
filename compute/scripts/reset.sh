#!/usr/bin/env bash

# write RESET to ground
echo "18" > /sys/class/gpio/export
echo "out" > /sys/class/gpio/gpio18/direction
echo "0" > /sys/class/gpio/gpio18/value

sleep 0.1

# write RESET back to high (pi's 3.3v)
echo "1" > /sys/class/gpio/gpio18/value

printf 'HTTP/1.1 200 OK\n\n'

sleep 0.5 && kill 1 &
