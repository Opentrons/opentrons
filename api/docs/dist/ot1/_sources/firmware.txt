.. _firmware:

================
Firmware Updates
================

The motorcontroller inside all Opentrons liquid handlers (called Smoothieboard or just Smoothie) will need it's firmware updated if you are planning to use the Opentrons API and accompanying 2.0 app. The process is simple, and can be done from your computer in under a minute.

To summarize, there are two files on your Smoothie that must be replaced; ``FIRMWARE.CUR`` and ``config``. 

Download Files
----------------------

Download the zipped files from here:

https://github.com/OpenTrons/smoothie-config/archive/2.0.0.zip

After downloading, unpack the zip file to view its contents. The latest firmware files are found in folder "v2.0.0".

Open the Smoothie's MicroSD Card
---------------------------------

Power OFF and unplug your Opentrons liquid handler's USB cable. Remove the microSD card from Smoothieboard (just above the USB connector on the robot), and connect it to your personal computer or laptop. It will show up as a storage device on your computer.

.. image:: img/update-firmware/firmware_files.png

Open the microSD storage device to see it's ``FIRMWARE.CUR`` and ``config`` files. There might be other files there, but the two you need to worry about are ``FIRMWARE.CUR`` and ``config``, because these are what we will be replacing.

Select Your Model's Config
----------------------------------

Opentrons `come in three models`__, the Standard, Pro, and Hood. Each model requires a unique ``config`` and ``firmware.bin`` file to go along with it. Find the files that matches your robot (the folders are named after each model).

__ https://opentrons.com/robots

** Note: We have release a "Plus" version of our robots, which have faster motors. If you received a robot after April 2017, and if your robot's Z motor is all black (no silver on the outside) than you have a "Plus" model.

.. image:: img/update-firmware/SelectConfigFile.png

Copy Over Files
---------------------------------

Drag both the ``config`` file and ``firmware.bin`` from the correct folder onto the microSD card. You will be overwriting the old ``config`` file, so your computer may ask if you would like to proceed with replacing it.

.. image:: img/update-firmware/replaceConfig.png

The contents of the microSD card should now look like this:

.. image:: img/update-firmware/dragFirmwareBin.png

Restart
---------------

Unmount the Smoothie's microSD card from your computer, and connect it back to your powered OFF robot. When the robot powers on, it will read the ``firmware.bin`` file, then save it as ``FIRMWARE.CUR``. It will then read the new ``config`` file, and your liquid handler now has updated firmware.
