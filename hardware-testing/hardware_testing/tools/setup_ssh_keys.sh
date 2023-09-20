#! /bin/bash

IP_ADDRESS=$2
TAR_FILE=flex_setup_ssh.tar.gz
SETUP_DIR=setup_ssh
ROBOT_KEY=$SETUP_DIR/robot_key
ROBOT_KEY_PUB=$SETUP_DIR/robot_key.pub
CONFIG_FILE=$SETUP_DIR/config
REQUIRED_FILES="$ROBOT_KEY $CONFIG_FILE"

main() {
	case $1 in
		local)
			setup_local
			;;
		*)
			setup_flex
			;;
	esac
	echo "Done"
}

setup_local() {
	echo "Setting up local environment"
	if [ ! -f "$TAR_FILE" ]; then
	    echo "Tarfile not found"
	    exit 1;
	fi
	
	echo "Extracting tarfile - ${TAR_FILE}"
	tar -xvf $TAR_FILE

	echo $CONFIG_FILE
	# make sure files exist
	for file in $REQUIRED_FILES
       	do
		echo $file
		if [ ! -f $file ]; then
			echo "file not found - ${file}"
			exit 1;
		fi
	done
	
	echo "Generating public key from private key"
	ssh-keygen -y -f $ROBOT_KEY > $ROBOT_KEY_PUB

	echo "Copying keys"
	cp -R $SETUP_DIR/robot_key* ~/.ssh/
	
	# Edit config
	echo "Setting up ssh config"
	LOCAL_SUBNET=$(echo "${IP_ADDRESS%.*}.*")
	echo "local subnet: ${LOCAL_SUBNET}"
	
	echo "Copy config to ~/.ssh"
	sed -i -e "s/10.13.*.*/$LOCAL_SUBNET/g" $CONFIG_FILE
	cat $CONFIG_FILE >> ~/.ssh/config

	echo "Cleaning up"
	rm -rf $SETUP_DIR
}

setup_flex() {
	echo "Setting up Flex at ${IP_ADDRESS}"
	echo "Make sure you connect the usb thumbdrive"
	curl --location --request POST "http://${IP_ADDRESS}:31950/server/ssh_keys/from_local"  --header 'opentrons-version: 3'
}

teardown() {
	echo "Some error happened"
}

set -eE -o pipefail
trap teardown ERR

main "$@"
