#!/bin/bash

export DBUS_SYSTEM_BUS_ADDRESS=unix:path=/host/run/dbus/system_bus_socket

echo "[BOOT] Starting server"
cd /usr/src/api
python /usr/src/api/opentrons/server/main.py -H 0.0.0.0 -P 31950 &

echo "[BOOT] Advertising local service"
python /usr/src/compute/scripts/announce_mdns.py
