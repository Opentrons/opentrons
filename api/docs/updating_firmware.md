#Updating Firmware

The motorcontroller inside all Opentrons liquid handlers (called Smoothieboard or just Smoothie) will need it's firmware updated if you are planning to use the Opentrons API and accompanying 2.0 app. The process is simple, and can be done from your computer in under a minute.

To summarize, there are two files on your Smoothie that must be replaced; `FIRMWARE.CUR` and `config`. 

##Step 1
###Download Files

[Download the zipped files from here](https://github.com/Opentrons/smoothie-config/archive/1.2.0.zip). After downloading, unpack the zip file to view its contents.

##Step 2
###Open the Smoothie's Drive

![Select Config File](img/Update-Firmware/driveIcon.png)

Power on and plug in your Opentrons liquid handler, and make sure you do not have the app open. You will notice the Smoothieboard shows up on the computer as a Mass Storage Device, like an external hard drive or flash drive.

![Select Config File](img/Update-Firmware/firmware_files.png)

Open the Smoothie's storage device to see it's `FIRMWARE.CUR` and `config` files. There might be other files there, but the two you need to worry about are `FIRMWARE.CUR` and `config`, because these are what we will be replacing.

##Step 3
###Copy Over `firmware.bin`

From the folder you downloaded from GitHub, find the `firmware.bin` file.

![Select Config File](img/Update-Firmware/SelectFirmwareBin.png)

Drag `firmware.bin` to the Smoothie's drive. Your drive should now look like the following:

![Select Config File](img/Update-Firmware/dragFirmwareBin.png)

##Step 4
###Select Your Opentrons Model Config

Opentrons [come in three models](https://opentrons.com/robots), the Standard, Pro, and Hood. Each model requires a unique "config" file to go along with it. Find the config file that matches your robot (the folders are named after each model).

![Select Config File](img/Update-Firmware/SelectConfigFile.png)

Drag the `config` file from the correct folder onto the Smoothie's drive. You will be overwriting the old `config` file, so your computer may ask if you would like to proceed with replacing it.

![Select Config File](img/Update-Firmware/replaceConfig.png)

##Step 5
###Restart

Unmount the Smoothie's driver from your computer, and power cycle the robot. When the Smoothieboard powers on, it will read the `firmware.bin` file, then save it as `FIRMWARE.CUR`. It will then read the new `config` file, and your liquid handler now has updated firmware.
