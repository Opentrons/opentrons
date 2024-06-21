#! /bin/bash

# This script is used to gather diagnostics data on the Flex robot.

instructions() {
    echo "---- Instructions ----"
    echo "Script runs from host computer"
    echo "Ex."
    echo "./flex_diagnostics <action> <host-ip>"
    echo ""
    echo "action = gather"
    echo "gather = Gathers all the data, state, and logs from the given robots."
    echo "host-ip = list of robot ip addresses to perform action on."
}

# Script entry-point
main() {

    # make sure we have action and robot ips
    if [[ "$#" -gt 1 ]]; then
        ip_addresses=${@:2}
    else
        echo "Error, missing args"
        instructions
        exit 1
    fi

	case $1 in
		gather)
			echo "Gather Diagnostics data"
			gather "$ip_addresses"
            ;;
        *)
            echo "Invalid args: $@"
            instructions
            ;;
	esac

    echo "Finished"
}

# Gather logs from given ip addresses
gather() {

    for ip in $@; do
        echo "Gathering data for ${ip}, please wait..."
        ssh -q -o stricthostkeychecking=no -o userknownhostsfile=/dev/null \
            root@$ip 'bash -s' <<- 'EOF'

            cleanup() {
                echo "Cleaning up"
                rm -rf $diag_dir
            }

            set -eE -o pipefail
            trap cleanup ERR

            serial=$(cat /var/serial || echo "unknown")
            today=$(date '+%Y_%m_%d_%H_%M_%S')
            diag_dir="./diag/${serial}_${today}"
            echo "Created $diag_dir to hold data"

            mkdir -p "${diag_dir}"
            mkdir -p "${diag_dir}/logs"
            mkdir -p "${diag_dir}/data"
            mkdir -p "${diag_dir}/system"

            echo "Gathering /data files"
            cp -r /data/* $diag_dir/data/
            
            echo "Gathering logs"
            shopt -s extglob
            cp -r /var/log/!(journal) $diag_dir/logs/
            journalctl --boot > $diag_dir/logs/journal.log
            dmesg > $diag_dir/logs/dmesg.log

            echo "Gathering system memory state"
            top -b -n 10 > $diag_dir/system/top.txt
            free -wl -c 10 -s 10 > $diag_dir/system/free.txt

            echo "Gathering systemd service state"
            systemctl status > $diag_dir/system/services_overview.txt
            systemctl status opentrons* >> $diag_dir/system/opentrons_services.txt

            if [  -d "$diag_dir" ]; then
                tarfile="./diag/${serial}_${today}_diag.tar.gz"
                echo "Creating Tarball ${tarfile}"
                tar -zcvf $tarfile $diag_dir
                mv $tarfile ~/
            fi

            cleanup
EOF

        # pull the tarfile if successful
        scp -r -o stricthostkeychecking=no -o userknownhostsfile=/dev/null \
            root@$ip:*diag.tar.gz .

        # clean up
         ssh -q -o stricthostkeychecking=no -o userknownhostsfile=/dev/null \
             root@$ip 'rm -rf *diag*'
    done
}

teardown() {
    echo "Error while running script"
    echo "Exiting"
}

set -eE -o pipefail
trap teardown ERR

main "$@"
