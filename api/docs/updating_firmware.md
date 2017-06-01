#Updating Firmware

The motorcontroller inside all Opentrons liquid handlers (called Smoothieboard or just Smoothie) will need it's firmware updated if you are planning to use the Opentrons API and accompanying 2.0 app. The process is simple, and can be done from your computer in under a minute.

To summarize, there are two files on your Smoothie that must be replaced; `FIRMWARE.CUR` and `config`. 

##Step 1
###Download Files

[Download the zipped files from here](https://github.com/OpenTrons/smoothie-config/archive/2.0.0.zip). After downloading, unpack the zip file to view its contents.

##Step 2
###Open the Smoothie's Drive

![Card Icon](img/Update-Firmware/driveIcon.png)

Power off your Opentrons liquid handler, remove the microSD card from the Smoothieboard. You will notice the microSD card shows up on the computer as a Mass Storage Device, like an external hard drive or flash drive.

![Select Config File](img/Update-Firmware/firmware_files.png)

Open the Smoothie's storage device to see it's `FIRMWARE.CUR` and `config` files. There might be other files there, but the two you need to worry about are `FIRMWARE.CUR` and `config`, because these are what we will be replacing.

##Step 3
###Select Your Opentrons Model Config

Each model requires a unique "config" and "firmware.bin" file to go along with it, so make sure you are selecting the correct model for you robot.

Opentrons [come in three models](https://opentrons.com/robots), the Standard, Pro, and Hood. Also, Opentrons has release the "plus" models which have faster motors than our previous robots. The "plus" models have an all black Z motor (up/down), while the original robots have a silver motor with black center.

![Select Config File](img/Update-Firmware/SelectConfigFile.png)

Drag both the `config` and `firmware.bin` files from the correct folder and to the Smoothie's microSD card driver. You will be overwriting the old `config` file, so your computer may ask if you would like to proceed with replacing it.

![Select Config File](img/Update-Firmware/replaceConfig.png)

Your drive should now look like the following:

![Select Config File](img/Update-Firmware/dragFirmwareBin.png)

##Step 4
###Restart

Unmount the Smoothie's driver from your computer, and power cycle the robot. When the Smoothieboard powers on, it will read the `firmware.bin` file, then save it as `FIRMWARE.CUR`. It will then read the new `config` file, and your liquid handler now has updated firmware.
