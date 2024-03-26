## OVERVIEW
This is a simple script to help manage the lifetime tests for the Hepa/UV module.

## INSTRUCTIONS

NOTE: This script runs on the host computer and not on the Flex.

# Setting up

First we need to get the testing software on the robot

0. Make sure we have already ran `make setup` at the top level
1. Push the software to the robot like so
    make hardware-testing push-no-restart-ot3 host=<robot-ip>
2. The robot should now have the hepa_uv_lifetime_test.py script under
    /hardware_testing/scripts/hepa_uv_lifetime_test.py
3. Done

# Running the management script

NOTE: Script runs from host computer

./management_tool.sh <action> <host-ip>"

action = status, gather, clean"
status = Prints the status of the hepauv script to make sure its running."
gather = Gathers all the logs from the given robots."
clean = Cleans up the logs from the given robots."
host-ip = list of robot ip addresses to perform action on."

Ex.

./management_tool.sh status 192.168.x.x

