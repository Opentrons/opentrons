#! /bin/bash

# This script is used to gather diagnostics data on the Flex robot.

instructions() {
    echo "---- Instructions ----"
    echo "Script runs from host computer"
    echo "Ex."
    echo "./flex_diagnostics <action> <host-ip>"
    echo ""
    echo "action = gather, set-ntp"
    echo "gather = Gathers all the data, state, and logs from the given robots."
    echo "set-ntp = Sets the ntp server to the value specified or default."
    echo "host-ip = list of robot ip addresses to perform action on."
}

DEFAULT_NTP="time.google.com"
FALLBACK_NTP="ntp.tencent.com"
FALLBACK_DNS="2001:da8::666 240c::6666"

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
        set-ntp)
            echo "Changing system settings"
            set_ntp "$ip_addresses"
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

            serial="unknown"
            if [ -f "/var/serial" ]; then
                serial=$(cat /var/serial)
            fi
            today=$(date '+%Y_%m_%d_%H_%M_%S')
            diag_dir="./diag/${serial}_${today}"

            mkdir -p "${diag_dir}"
            mkdir -p "${diag_dir}/logs"
            mkdir -p "${diag_dir}/data"
            mkdir -p "${diag_dir}/system"
            mkdir -p "${diag_dir}/network"

            echo "Created $diag_dir to hold data"

            cleanup() {
                echo "Cleaning up"
                rm -rf $diag_dir
            }

            set -eE -o pipefail
            trap cleanup ERR

            echo "Gathering /data files"
            cp -r /data/* $diag_dir/data/
            cp -r /etc/VERSION.json $diag_dir/data/
            cp -r /tmp/.config/Opentrons $diag_dir/data/
            echo $serial > $diag_dir/data/serial.txt
            
            echo "Gathering logs"
            shopt -s extglob
            cp -r /var/log/!(journal) $diag_dir/logs/
            journalctl > $diag_dir/logs/journal.log
            dmesg > $diag_dir/logs/dmesg.log

            echo "Gathering system state"
            uname -a > $diag_dir/system/uname.txt
            ps aux > $diag_dir/system/psaux.txt
            top -c -b -n 10 > $diag_dir/system/top.txt
            free -wl -c 10 -s 10 > $diag_dir/system/free.txt
            #date > $diag_dir/system/datetime.txt
            #timedatectl >> $diag_dir/system/datetime.txt
            uptime > $diag_dir/system/uptime.txt

            echo "Gathering network info"
            /sbin/ifconfig > $diag_dir/network/network.txt
            echo -e "\n\n" >> $diag_dir/network/network.txt
            /sbin/ip --details link show >> $diag_dir/network/network.txt
            echo -e "\n\n" >> $diag_dir/network/network.txt
            ( nmcli dev list || nmcli dev show ) 2>/dev/null |
                grep DNS >> $diag_dir/network/network.txt

            echo "Gathering NTP server info"
            echo -e "\n\n" >> $diag_dir/network/network.txt
            ping -c 2 -w 2 time.google.com >> $diag_dir/network/network.txt || true
            ping -c 2 -w 2 ntp.tencent.com >> $diag_dir/network/network.txt || true
            ping -c 2 -w 2 time.amazonaws.cn >> $diag_dir/network/network.txt || true
 
            echo "Downloading releases.json"
            wget https://builds.opentrons.com/ot3-oe/releases.json -P $diag_dir/network/

            echo "Gathering systemd service state"
            systemctl status > $diag_dir/system/services_overview.txt
            systemctl status opentrons* >> $diag_dir/system/opentrons_services.txt

            if [  -d "$diag_dir" ]; then
                tarfile="${serial}_${today}_diag.tar.gz"
                echo "Creating Tarball ${tarfile}"
                tar -zcvf $tarfile -C ./diag .
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

set_ntp() {
     for ip in $@; do
        ssh -q -o stricthostkeychecking=no -o userknownhostsfile=/dev/null \
            root@$ip "NTP='$FALLBACK_NTP' DNS='$FALLBACK_DNS' bash -s" <<- 'EOF'

            cleanup() {
                echo "Cleaning up"
            }

            set -eE -o pipefail
            trap cleanup ERR

            serial="unknown"
            if [ -f "/var/serial" ]; then
                serial=$(cat /var/serial)
            fi
            today=$(date '+%Y_%m_%d_%H_%M_%S')
            filename="${serial}_${today}_ntp.txt"

            echo "Setting NTP address to $NTP"
            echo -e "timedatectl before setting NTP server\n" > $filename
            timedatectl >> $filename

            mount -o remount,rw /
            sed -i "s/#FallbackNTP=*/FallbackNTP=$NTP /" /etc/systemd/timesyncd.conf
            timedatectl set-ntp true
            systemctl restart systemd-timesyncd
            echo -e "\ntimedatectl after setting NTP server\n" >> $filename
            sleep 5
            timedatectl >> $filename

            echo "Setting DNS address to $DNS"
            echo -e "\n\n-----------------------------------------------" >> $filename
            echo -e "systemd-resolve status before setting DNS\n" >> $filename
            systemd-resolve --status >> $filename
            echo -e "\n\n-----------------------------------------------" >> $filename
            echo -e "\nSetting DNS server" >> $filename
            sed -i "s/#FallbackDNS=*/FallbackDNS='$DNS' /" /etc/systemd/resolved.conf
            echo -e "systemd-resolve status after setting DNS\n" >> $filename
            systemctl restart systemd-resolved
            sleep 5
            systemd-resolve --status >> $filename
EOF

    echo "Fetching NTP file output"
    scp -r -o stricthostkeychecking=no -o userknownhostsfile=/dev/null \
            root@$ip:*ntp.txt .

    # clean up
    ssh -q -o stricthostkeychecking=no -o userknownhostsfile=/dev/null \
        root@$ip 'rm -rf *ntp.txt'

    done
}

teardown() {
    echo "Error while running script"
    echo "Exiting"
}

set -eE -o pipefail
trap teardown ERR

main "$@"
