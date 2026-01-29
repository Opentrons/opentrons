#!/bin/bash
LOCKFILE="/tmp/python_loop.lock"
IP_ADDRESS=$(networkctl status | grep "Address:" | awk '{print $2}')

# Navigate to relevant file
#cd "$(dirname "$0")"
pwd

# CHECK: Is there a lockfile?
if [ -f "$LOCKFILE" ]; then
    # Is the process ID inside that file actually still running?
    if kill -0 "$(cat "$LOCKFILE")" 2>/dev/null; then
        exit 0 # It's already running, so this script just gives up and quits.
    fi
fi

# CREATE: At this point, no one is running. Claim the spot
echo $$ > "$LOCKFILE"

# EXECUTE: Now run the Python function that has the infinite loop.
# We use 'python -m' to make sure it's treated as a module.
python3 -c "from background_helpers import detect_robot_status; detect_robot_status('&IP_ADDRESS')"