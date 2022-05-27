# Script for measurement of the Heater Shaker

> Paths below are for a windows machine

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
7. clone the repository
   1. `git clone https://github.com/Opentrons/opentrons.git`
8. move into the repository that you just cloned, (this looks a little funny as the path is opentrons/opentrons but actually reflects the structure of organization on github) 
   1. `cd opentrons`
9.  move to the branch
   2. `git pull origin`
   3. `git switch 10313-hs-labware-script-2`
10. move to the robot-server directory
   4. `cd .\opentrons\robot-server`
11. install this package
   5.  `pipenv install -d`
12. call the help text on the tool
    1.  `pipenv run python .\tests\integration\http_api\live\hs_labware.py -h`
13. follow the instructions
    1.  change the constants (ALL_CAPS_VARIABLES) at the top of `robot-server/tests/integration/http_api/live/hs_labware.py` file per your robot setup.
14. run the script replacing the robot ip with your robot ip
    1.  `pipenv run python .\tests\integration\http_api\live\hs_labware.py --robot_ip 192.168.50.89 --labware_key opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flatpipenv run python .\tests\integration\http_api\live\hs_labware.py`
