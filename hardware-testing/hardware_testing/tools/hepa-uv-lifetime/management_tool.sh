#! /bin/bash

# This script gathers logs from Flex units running the hepa_uv_lifetime_test.py script

DEFAULT_IPS=(
    "10.14.13.7
    10.14.12.28
    10.14.12.158
    10.14.12.102
    10.14.12.122
    10.14.12.110
    10.14.13.1
    10.14.12.123"
)

instructions() {
    echo "---- Instructions ----"
    echo "Script runs from host computer"
    echo "Ex."
    echo "./hepa_lifetime_mgt <action> <host-ip>"
    echo ""
    echo "action = status, gather, clean"
    echo "status = Prints the status of the hepauv script to make sure its running."
    echo "gather = Gathers all the logs from the given robots."
    echo "clean = Cleans up the logs from the given robots."
    echo "host-ip = list of robot ip addresses to perform action on."
}

# Script entry-point
main() {

    # make sure we have action and robot ips
    if [[ "$#" -eq 1 ]]; then
        ip_addresses=$DEFAULT_IPS
    elif [[ "$#" -gt 1 ]]; then
        ip_addresses=${@:2}
    else
        echo "Error, missing args"
        instructions
        exit 1
    fi

	case $1 in
        status)
            echo "Get Script status"
            status "$ip_addresses"
            ;;
		gather)
			echo "Gather logs"
			gather "$ip_addresses"
            ;;
		clean)
			echo "Delete logs"
			cleanup "$ip_addresses"
			;;
        *)
            echo "Invalid args: $@"
            instructions
            ;;
	esac

    echo "Finished"
}

# Prints the status of the hepauv script running on the robots
status() {
    for ip in $@; do
        result=$(ssh -q -o stricthostkeychecking=no -o userknownhostsfile=/dev/null \
            root@$ip "ps aux | pgrep -fl 'python3 -m hardware_testing.scripts.hepa_uv_lifetime_test'" \
        || true)

        # Make sure the script is running
        if [[ $result =~ "python3" ]]; then
            echo "${ip}: RUNNING"
        else
            echo "${ip}: NOT RUNNING"
        fi
    done
}

# Gather logs from given ip addresses
gather() {
    # Create local dir to hold logs
    today=$(date '+%Y_%m_%d_%H_%M_%S')
    log_dir=("./logs/${today}")
    mkdir -p "${log_dir}"
    res="0"
    for ip in $@; do
	    echo "Gathering logs for ${ip}"
        # download the logs
        res=$(scp -q -o stricthostkeychecking=no -o userknownhostsfile=/dev/null \
            root@$ip:/var/log/hepauv_lifetime* "${log_dir}" && echo 1 || true)
    done

    # create a tarball if successful
    if [ "$res" == "1" ]; then
        tar -zcvf "hepauv_lifetime_${today}.tar.gz" -C "${log_dir}" ./
    fi
}

# Clean up logs on robots
cleanup() {
    echo "WARNING: THIS ACTION WILL DELETE THE LIFETIME LOGS"
    read -p "Continue? (Y/N): " confirm
    if [[ $confirm =~ "n" ]]; then
        return
    fi

    for ip in $@; do
        echo "Deleting logs for ${ip}"
        ssh -q -o stricthostkeychecking=no -o userknownhostsfile=/dev/null \
            root@$ip "rm -rf /var/log/hepauv_lifetime_*.log" || true
    done
}

teardown() {
    echo "Error while running script"
    echo "Exiting"
}

set -eE -o pipefail
trap teardown ERR

main "$@"
