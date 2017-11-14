#!/bin/bash

export DBUS_SYSTEM_BUS_ADDRESS=unix:path=/host/run/dbus/system_bus_socket

echo "[BOOT] Starting server"
. /usr/src/compute/scripts/api_init.sh &

echo "[BOOT] Advertising local service"
python /usr/src/compute/scripts/announce_mdns.py
