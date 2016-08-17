# Calibration 2.0
Protocol specific step based calibration wizard for 2.0 release. 

### Style Sheet Compilation
This repo ignores all compiled CSS files and SASS caches. To view most recent style updates install compass to compile.

```
$ cd app
$ compass compile
```
or

```
$ compass watch
```
if you are editing the styles directly.

###Setup
First, clone and install the [opentrons_sdk](https://github.com/OpenTrons/opentrons_sdk)
While in opentrons_sdk repo:
```
python3 setup.py install
```
Then, back in robot_frontend_v2 install following:
```
$ pip3 install Flask_SocketIO
$ pip3 install logging
$ pip3 install gevent
```


### Run Server
Currently, to start the server you have to run python file directly. 

```
$ cd app
$ python3 main.py
```

### Routes
The two static:
```
http://localhost:5000/welcome/connect
http://localhost:5000/upload/protocol
```
Clicking [next button] on upload page will bring you to dynamic step wizard based on stub data. Scripts and views are loaded based on routes. Data is loaded based on uniqueIDs within the stub data.
```
http://localhost:5000/protocol_setup/calibrate/uniquekey3
```
