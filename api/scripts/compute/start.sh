#!/bin/bash

export DBUS_SYSTEM_BUS_ADDRESS=unix:path=/host/run/dbus/system_bus_socket
cd /usr/src/api

echo "[BOOT] Starting server"
python /usr/src/api/opentrons/server/main.py '0.0.0.0':31950

