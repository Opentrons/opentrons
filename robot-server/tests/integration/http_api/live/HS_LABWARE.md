# Script for measurement of the Heater Shaker

> Commands below are for a windows machine

1. Open command line
2. Have git installed
   1. `git --version`
3. Have python 3.7 installed
   1. `python --version`
4. Install pipenv globally
   1. `pip install --global -U pipenv`
5. make a directory where the code will live
   1. `mkdir opentrons`
6. go into that directory
   1. `cd opentrons`
7. clone in the code
   1. `git clone https://github.com/Opentrons/opentrons.git`
8. move to the robot-server directory
   1. `cd opentrons/robot-server`
9. install this package
   1.  `pipenv install -d`
10. call the help text on the tool
    1.  `pipenv run python tests/integration/http_api/live/hs_labware.py -h`
11. follow the instructions
    1.  change the constants (ALL_CAPS_VARIABLES) at the top of `robot-server/tests/integration/http_api/live/hs_labware.py` file per your robot setup.
12. run the script
    1.  `pipenv run python tests/integration/http_api/live/hs_labware.py --robot_ip 192.168.50.89 --labware_key opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat`
