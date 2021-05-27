Docker Guide  
=======================  
Included in this repo are the tools to run a containerized Opentrons robot stack in docker.

This includes the `robot-server` connected to the hardware emulation application. The emulation application includes the Smoothie and magnetic, temperature, and thermocycler modules.

Requirements
------------------
- A clone of this repo.
- An installation [docker](https://docs.docker.com/get-docker/)
- An installation of [docker-compose](https://docs.docker.com/compose/install/)

How to use
--------------
Start a terminal and change directory to the root of this repo.

1) Build
Enter ```docker-compose build --force-rm``` at the terminal.

2) Run
Enter ```docker-compose up```  at the terminal.  *The build and run stages can be  combined  ```docker-compose up --build```.*

3) Start the Opentrons application. The docker container will appear as `dev`. Connect and run just as you would on a robot.

Known Issues
---
- Pipettes cannot be changed at run time.
- Pipettes are fixed as `p20_multi_v2.0` on the left mount and `p20_single_v2.0` on the right. 
