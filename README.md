#OT App

##Goals
---
- [x] Connect to Robot (or Virtual Smoothie)
- [x] Protocol Ingestion/Verification
- [x] Task List Generation
- [x] Dynamic Routing
- [x] Previous/Next buttons
- [x] XYZAB Jogging
- [ ] Move to Slot
- [ ] Calibrate Container
- [ ] Calibrate Pipette
- [ ] Protocol Error Reporting
- [ ] Review Saved Positions
- [ ] Run Protocol on Robot
- [ ] Auto Updating (software and firmware)
- [ ] Logging/Crash Reporting
- [ ] Diagnostics Screen
- [ ] Preferences Screen
- [ ] Packaging/Distribution for macOS, Windows, and Linux

##Setup and Usage (NOTE: This is an unfinished Beta project - use at your own risk)
---
###macOS

####Setup:

`git clone https://github.com/OpenTrons/robot_frontend_v2.git`

`cd robot_frontend_v2`

`npm install`

`npm install webpack -g`

`virtualenv -p python3 env` OR `pyenv local 3.4.3` - this step requires Virtualenv or Pyenv, as Python 3+ is necessary for this project.

`source env/bin/activate` is necessary to run if using Virtualenv.

`pip install -r requirements.txt`


####Usage:
`webpack --watch`

This starts Webpack in order to compile and watch assets (SASS, HTML, ES6, Vue)
Next, execute the following in a new terminal session:
`cd server`

You will need to activate your Virtualenv or Pyenv here - refer to the above comment in setup for instructions on how to do so.

`python main.py`

At this point, the Flask server that serves up the Single Page Application and hosts the REST API for interacting with your Opentrons robot over HTTP is running.

You can now open the OT App in your web browser by navigating to 127.0.0.1:5000. You can also open the app in Electron by running `npm start` from the root directory of this folder.

If you would like to interface with the Virtual Smoothieboard (as opposed to the actual robot), you can execute `export Debug=True` before running `python main.py`.
