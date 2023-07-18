#! /bin/bash

# This script sets up the hardware-testing module to run from usb or some other dir on the Flex robot

USB_DIR=.
SYSTEM_VERSION_FILE="/etc/VERSION.json"
PKG_INFO_FILE="PKG-INFO"
PACKAGE_VERSION=""

# Script entry-point
main() {
	echo "Validating files"
	validate "$@"

	# execute action
	case $1 in
		teardown)
			echo "Teardown"
			teardown
			;;
		*)
			echo "Setup"
			setup
			;;
	esac
}

# Make sure we have the correct files before doing anything
validate() {
	# Check if we are running on the robot or not
	if [ ! -f $SYSTEM_VERSION_FILE ]; then
		echo "${SYSTEM_VERSION_FILE} not found, make sure you're running this from a robot!"
		exit 1;
	fi
	is_flex=$(cat $SYSTEM_VERSION_FILE | grep OT-3)
	echo "is_flex: $(is_flex)"

	# validate the package files
	if [ ! -z "$2" ]; then
		USB_DIR=$2
		if [ ! -d "$USB_DIR" ]; then
			echo "error: usb dir does not exist - ${USB_DIR}"
			exit 1;
		fi
	fi
	echo "usb dir is - ${USB_DIR}"

	# Get the version of the package
	if [ ! -f $PKG_INFO_FILE ]; then
		echo "error: ${PKG_INFO_FILE} was not found!"
		exit 1;
	fi
	PACKAGE_VERSION="cat ${PKG_INFO_FILE} | grep version"
	# Check that the hardware-testing dir exists
}

# Sets up the hardware-testing module to be used from usb location
setup() {
	echo "Setting up hardware-testing module ${PACKAGE_VERSION}"
	# 1. Lets get our environment variables setup
	# set PYTHONBINDIR to the usb dir
	# maybe set OT_SYSTEM_VERSION for now
	# also set OT_OT3_HARDWARE_CONTROLLER or w.e its called

	# 2. Lets set the logging location for hardware-testing scripts
	# maybe edit the config file we pass the logging usb module??
	# 

	# 3. Lets deal with hardware-testing-description
	# file needs to be part of the tarball so we can place it in its proper location here

	# 4. Lets deal with plot-webpage 
	# file needs to be part of tarball so we can place it in its proper location here

	# 5. Lets apply the patch files
	# patch files are part of this package so we need to apply them here 
	# use the same mechanism we use when applying from makefile

	# 6. Lets deal with hardware-testing data
	# This gets applied in get_testing_data_directory, look into it

	# 7. Lets deal with push-grav-ot3 and replicate that setup here
}

# Tearsdown the hardare-testing module
teardown() {
	echo "Teardown usb package"
}

main "$@"
