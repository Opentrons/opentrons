# Environments for Python code evaluation

The python code we write is split up into multiple pieces. There are some libraries, like the hardware and shared-data subdirectories; some applications, like the robot-server and update-server subdirectory; and some combination app and libraries like the api subdirectory.

Each of these projects is also used in multiple different target environments - the OT-2, the OT-3, the desktop app, development.

This directory contains Pipenv files defining those target environments. Because they are linked to environments rather than projects, multiple projects can be executed within them.

You can set them up by running `make setup`.
