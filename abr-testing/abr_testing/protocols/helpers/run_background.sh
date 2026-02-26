#!/bin/bash
LOCKFILE="/tmp/python_loop.lock"
IP_ADDRESS=$(networkctl status | grep "Address:" | awk '{print $2}')

# Navigate to relevant file
cd "$(dirname "$0")"
#pwd

# CHECK: Is there a lockfile?
if [ -f "$LOCKFILE" ]; then
    # Read the lockfile line by line
    while read -r pid; do
        # Is this specific PID actually still running?
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            echo "Process $pid is still running. Exiting."
            exit 0
        fi
    done < "$LOCKFILE"
fi

# check what already exists and kill it
pkill -f "video_capture_buffer"
pkill -f "detect_robot_status"


(python3 -c "from background_helpers import detect_robot_status; detect_robot_status('$IP_ADDRESS')" &)
sleep 0.5
statusProcessID=$!

VIDEO_LENGTH=30
(python3 -c "from background_helpers import change_robot_video_length; change_robot_video_length('$VIDEO_LENGTH',
'$IP_ADDRESS'")
(python3 -c "from background_helpers import video_capture_buffer;
video_capture_buffer($VIDEO_LENGTH, '/var/www/localhost/html/stream/hls/stream.m3u8')" &)
videoBufferProcessID=$!


if kill -0 "$statusProcessID" 2>/dev/null && kill -0 "$videoBufferProcessID" 2>/dev/null; then
  # Push the Python process ID to the Lockfile
  echo "$statusProcessID" > "$LOCKFILE"
  echo "$videoBufferProcessID" >> "$LOCKFILE"
  echo "background processes successfully launched"
else
  echo "background processes failed to launch"
fi