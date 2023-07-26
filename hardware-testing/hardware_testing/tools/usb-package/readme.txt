## OVERVIEW
The usb-package bundles up the hardware_testing module so it can run from a usb thumbdrive on the Flex.

## INSTRUCTIONS

### How to make package:
make -C hardware-testing setup-usb-module
This will produce a tar file **hardware_testing_usb-<version>.tar.gz** in **hardware-testing/dist/**
example:
	hardware_testing_usb-0.0.1.tar.gz

You can also make and install the tar file to a target with the **usb_dir** option
This will extract the contents to the specified location
make -C hardware-testing setup-usb-module usb_dir="/Volumes/ENFAIN/"

### How to deploy:
If you use the **usb_dir** option the usb-package will be installed on the usb drive
You can also manually extract the tar file onto a target like so
tar -xvf hardware_testing_usb-0.0.1.tar.gz -C "<drive-location>"

### How to install on the Flex:
Once you have an usb thumdrive with the usb-packge deployed you can plug in the thumbdrive to
a Flex and start the setup script to install the required files like so

0. Make sure the Flex is powered on
1. ssh to the robot with
	ssh root@<ip-address>
	NOTE: You can also use screen or similar if you are using an FTDI connection
	screen /dev/<ftdi-device> 115200
2. Plug in the hardware-testing thumbdrive to the Flex
	The device should be mounted to **/media/sda** or similar
	Note: You can also manually mount the thumbdrive with
	a. From the Linux command line list usb devices with
		blkid
		Note:
		Your drive address should be something like
		**/dev/sda: LABEL="ENFAIN"...**
		The LABEL should be the name of your usb thumbdrive
	b. mount the drive
		mount /dev/sda /mnt
	c. the device should now be accessed thorugh /mnt
3. Navigate to the mounted drive
	a. if drive was automatically mounted, run
	cd /media/sdx/hardware_testing_usb where x is the enumerated drive
	b. or if mounted manually
		cd /mnt/hardware_testing_usb
4. Run the setup script
	a. From the usb-packge dir **hardware_testing_usb** run
	./setup
5. Re-logging to apply
	a. from the command shell run
	logout
	b. use ssh or screen to log back in
	see step 1 above.
6. You should now see
	**Hardware-Testing package enabled at <mount-location>/hardware_testing_usb**

	Note: **<mount-location>** is where the thumbdrive was mounted typically **/media/sdx**
	but could also be **/mnt** or different if mounted manually
7. Done
	a. The hardware-testing package is now setup and can be used as normal
	example:
		python3 -m hardware_testing.scripts.module_calibration


### How to uninstall from the Flex:
With the usb thumbdrive plugged into the Flex
1. Navigate to usb-packge dir
	cd <mount-location>/hardware_testing_usb
2. Run the setup script
	./setup teardown
	You should see **Teardown Success**
3. The usb drive can now be removed


### Troubleshoting

If the usb thumbdrive is removed and replugged it could enumerate differently.
This means you will need to run the ./setup script again
