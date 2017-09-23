#!/bin/bash

export DBUS_SYSTEM_BUS_ADDRESS=unix:path=/host/run/dbus/system_bus_socket

echo "[BOOT] Starting server"
cd /usr/src/api
python /usr/src/api/opentrons/server/main.py

