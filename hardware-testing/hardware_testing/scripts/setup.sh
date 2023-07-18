#! /bin/bash

# This script sets up the hardware-testing module to run from usb or some other dir on the Flex robot

USB_DIR=.
PACKAGE_NAME="hardware_testing"
PACKAGE_TAR_FILE="./${PACKAGE_NAME}-*.tar.gz"
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
	is_flex=$(cat $SYSTEM_VERSION_FILE | grep -o OT-3)
	if [ -z $is_flex ]; then
		echo "Make sure robot is a Flex before running setup."
		exit 1
	fi

	# Extract the tarball
	usb_module_filename=$(ls $PACKAGE_TAR_FILE)
	if [ ! -f "$usb_module_filename" ]; then
		echo "Could not find package tarball - ${PACKAGE_TAR_FILE}"
		exit 1;
	fi
	echo "Extracting tarball ${usb_module_filename}"
	tar -xvf $usb_module_filename -C ./

	# Enter the extracted dir
	cd $PACKAGE_NAME*/

	# Get the version of the package
	if [ ! -f $PKG_INFO_FILE ]; then
		echo "error: ${PKG_INFO_FILE} was not found!"
		exit 1;
	fi
	PACKAGE_VERSION=$(cat ${PKG_INFO_FILE} | grep Version)
}

# Sets up the hardware-testing module to be used from usb location
setup() {
	echo "Setting up hardware-testing module ${PACKAGE_VERSION}"
	echo "1. Setting up environment variables"
	here=$(pwd)
	export PYTHONPATH=$PYTHONPATH:$here:
	echo $PYTHONPATH
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
