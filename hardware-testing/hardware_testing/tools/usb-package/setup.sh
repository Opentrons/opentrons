#! /bin/bash

# This script sets up the hardware-testing module to run from usb or some other dir on the Flex robot. Read the readme.txt file for setup and instructions.

USB_DIR=$(pwd)
MOUNT_DIR=$(dirname ${USB_DIR})
PACKAGE_VERSION=""
PACKAGE_NAME="hardware_testing"
PACKAGE_DIR=$(echo ${USB_DIR}/${PACKAGE_NAME}-*/)
PACKAGE_TAR_FILE=$(echo ${USB_DIR}/${PACKAGE_NAME}-*.tar.gz)
PKG_INFO_FILE=$PACKAGE_DIR/PKG-INFO
SYSTEM_VERSION_FILE="/etc/VERSION.json"
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
	if [ ! -f $PKG_INFO_FILE ]; then
		echo "error: ${PKG_INFO_FILE} was not found!"
		exit 1;
	fi
	PACKAGE_VERSION=$(cat ${PKG_INFO_FILE} | sed -n '/Version/{n;n;p}')
}


# Helper function to write/delete environment variable profile script
_env_profile() {
	# mount the filesystem rw
	mount -o remount,rw /

	if [[ $1 =~ "delete" ]]; then
		echo "Deleting usb-package env file - ${ENV_PROFILE}"
		rm -rf $ENV_PROFILE
		mount -o remount,ro /
		return;
	fi

	echo "Writing usb-package env profile - $ENV_PROFILE"

cat <<EOF > $ENV_PROFILE
#!/usr/bin/env sh

# Do an auto-teardown if the usb device is not found
if [ ! -d $USB_DIR ]; then
	mount -o remount,rw /
	rm -rf $ENV_PROFILE
	mount -o remount,ro /
	return 1;
fi

echo "Hardware-Testing package enabled at $USB_DIR"
export PYTHONPATH=\$PYTHONPATH:$PACKAGE_DIR

# set OT_SYSTEM_VERSION if not set
if [ -z \$OT_SYSTEM_VERSION ]; then
	export OT_SYSTEM_VERSION="0.0.0"
fi

# set the TESTING_DATA_DIR
export TESTING_DATA_DIR=$USB_DIR/testing_data
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

	# Lets deal with hardware-testing-description file, is /data correct?
	cp -r $USB_DIR/.hardware-testing-description /data/

	echo "Hardware-Testing module has been setup, re-login to apply changes."
}

# Tearsdown the hardare-testing module
teardown() {
	echo "Tearing down hardare-testing module ${PACKAGE_VERSION}"

	# delete the environment profile
	_env_profile delete

	# delete the description file
	rm -rf /data/.hardware-testing-description

	echo "Teardown Success"
}

set -eE -o pipefail
trap teardown ERR

main "$@"
