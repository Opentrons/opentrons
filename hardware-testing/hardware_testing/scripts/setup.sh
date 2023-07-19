#! /bin/bash

# This script sets up the hardware-testing module to run from usb or some other dir on the Flex robot

USB_DIR=$(pwd)
PACKAGE_VERSION=""
PACKAGE_NAME="hardware_testing"
PACKAGE_DIR=$(echo ${USB_DIR}/${PACKAGE_NAME}-*/)
PACKAGE_TAR_FILE=$(echo ${USB_DIR}/${PACKAGE_NAME}-*.tar.gz)
PKG_INFO_FILE=$PACKAGE_DIR/PKG-INFO
SYSTEM_VERSION_FILE="/etc/VERSION.json"
DEFAULT_ENV_PROFILE="/etc/profile.d/ot-environ.sh"
ENV_PROFILE="/etc/profile.d/ot-usb-environ.sh"

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
}

_extract_tarball() {
	echo "Extracting tarball ${usb_module_filename}"
	tar -xvf $usb_module_filename -C $USB_DIR

	# Get the version of the package
	echo "SOEMTHING: $PKG_INFO_FILE"
	if [ ! -f $PKG_INFO_FILE ]; then
		echo "error: ${PKG_INFO_FILE} was not found!"
		exit 1;
	fi
	PACKAGE_VERSION=$(cat ${PKG_INFO_FILE} | grep Version)
}


# Helper function to write/delete environment variable profile script
_env_profile() {
	# mount the filesystem rw
	mount -o remount,rw /

	if [[ $1 =~ "delete" ]]; then
		echo "Deleting usb-package env file - ${ENV_PROFILE}"
		rm -rf $ENV_PROFILE
		return;
	fi

	echo "Writting usb-package env profile - $ENV_PROFILE"

cat <<EOF > $ENV_PROFILE
#!/usr/bin/env sh

# check that the hardware-tesing dir in the usb device exists
if [ ! -d $USB_DIR ]; then
	echo "################## WARNING ##################"
	echo "The Hardware-Testing package is enabled, but was not found."
	echo "Please make sure that the usb is plugged in and mounted to - $USB_DIR."
	echo "If you are done using the Hardware-Testing package, make sure its disabled."
	echo "You can disable by runing './setup teardown' from the usb."
	echo "################## WARNING ##################"
	return 1;
fi

echo "Hardware-Testing package enabled at $USB_DIR"
export PYTHONPATH=\$PYTHONPATH:$USB_DIR

# set OT_SYSTEM_VERSION if not set
if [ -z \$OT_SYSTEM_VERSION ]; then
	export OT_SYSTEM_VERSION="0.0.0"
fi
EOF
	# remount filesystem as ro
	mount -o remount,ro /
}

# Sets up the hardware-testing module to be used from usb location
setup() {
	echo "Setting up hardware-testing module ${PACKAGE_VERSION}"

	# lets extract that tarball
	_extract_tarball

	# Lets set up the environment profile
	_env_profile

	# TODO (ba, 2023-07-19): set the logging location for hardware-testing scripts to usb
	# We need to consilidate hardware-testing logging before being able to do this.

	# Lets deal with plot-webpage since the sdist file only contains .py files
	cp -r $USB_DIR/plot $PACKAGE_DIR/$PACKAGE_NAME/tools/

	# 3. Lets deal with hardware-testing-description
	# file needs to be part of the tarball so we can place it in its proper location here

	# 5. Lets apply the patch files
	# patch files are part of this package so we need to apply them here 
	# use the same mechanism we use when applying from makefile

	# 6. Lets deal with hardware-testing data
	# This gets applied in get_testing_data_directory, look into it

	# 7. Lets deal with push-grav-ot3 and replicate that setup here
	echo "Hardare-Testing module has been setup, re-login to apply changes."
}

# Tearsdown the hardare-testing module
teardown() {
	echo "Teardown usb package"
}

set -e -o pipefail
trap teardown EXIT

main "$@"
