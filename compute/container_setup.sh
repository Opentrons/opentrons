#! /usr/bin/env bash

echo "[ $0 ] Running container setup"

OT_CONFIG_PATH=/data/system
# Clean up opentrons package dir if it"s a first start of a new container
touch /data/id
previous_id=$(cat /data/id)
current_id=$CONTAINER_ID
if [ "$previous_id" != "$current_id" ] ; then
    echo "[ $0 ] First start of a new container (new id < $current_id > old id < $previous_id >). Deleting local Opentrons installation"
    rm -rf /data/packages/usr/local/lib/python3.6/site-packages/opentrons*
    rm -rf /data/packages/usr/local/lib/python3.6/site-packages/ot2serverlib*
    rm -rf /data/packages/usr/local/lib/python3.6/site-packages/otupdate*
    provision=`find_python_module_path.py opentrons`/resources/scripts/provision-api-resources
    echo "[ $0 ] provisioning with $provision"
    python "$provision"
    echo "$current_id" > /data/id
else
    echo "[ $0 ] IDs < $previous_id > match, no container change"
fi

echo "[ $0 ] Container setup complete"
