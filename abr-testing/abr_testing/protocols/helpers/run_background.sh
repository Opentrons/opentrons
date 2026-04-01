#!/bin/bash
LOCKFILE="/tmp/python_loop.lock"
IP_ADDRESS=$(networkctl status | grep "Address:" | awk '{print $2}')

# Navigate to relevant file
cd "$(dirname "$0")"
pwd

# CHECK: Is there a lockfile?
if [ -f "$LOCKFILE" ]; then
    # Is the process ID inside that file actually still running?
    if kill -0 "$(cat "$LOCKFILE")" 2>/dev/null; then
        exit 0 # It's already running, so this script just give up.
    fi
fi

# check what already exists and kill it
pkill -f "background_helpers"



(python3 -c "from background_helpers import detect_robot_status; detect_robot_status('$IP_ADDRESS')" &)
sleep 0.5
processID=$!

if kill -0 "$processID" 2>/dev/null; then
  # Push the Python process ID to the Lockfile
  echo "$processID" > "$LOCKFILE"
  echo "background process successfully launched"
else
  echo "background process failed to launch"
fi