#!/bin/bash

RST_PIN=20
ISP_PIN=21

LOW=0
HIGH=1

DELAY=1.5

# $HIGH) write RESET to ground
echo "$RST_PIN" > /sys/class/gpio/export
echo "out" > /sys/class/gpio/gpio$RST_PIN/direction
echo "$LOW" > /sys/class/gpio/gpio$RST_PIN/value

# 2) write ISP Boot to ground
echo "$ISP_PIN" > /sys/class/gpio/export
echo "out" > /sys/class/gpio/gpio$ISP_PIN/direction
echo "$LOW" > /sys/class/gpio/gpio$ISP_PIN/value

# 3) write RESET back to high (pi's 3.3v)
echo "$HIGH" > /sys/class/gpio/gpio$RST_PIN/value

# 4) delay
sleep $DELAY

# 5) write ISP Boot back to high (pi's 3.3v)
echo "$HIGH" > /sys/class/gpio/gpio$ISP_PIN/value
