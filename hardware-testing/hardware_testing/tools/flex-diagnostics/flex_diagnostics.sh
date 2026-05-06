#! /bin/bash

# This script is used for diagnostics of Flex robot.

instructions() {
    echo "---- Instructions ----"
    echo "Script runs from host computer"
    echo "Ex."
    echo "./flex_diagnostics <action> <sub-action> <robot-ip>"
    echo ""
    echo "action = gather, create, set-ntp, migrate [backup|restore|analyze]"
    echo "gather = Gathers and SCPs all the data, state, and logs from the given robots"
    echo "create = Creates a Tarball on the robot with the data, state, logs, etc."
    echo "set-ntp = Sets the ntp server to the value specified or default."
    echo "migrate backup <source-ip> = Creates a migration tarball."
    echo "migrate restore <target-ip> <migration-tarball.tar.gz> = Transfers tarball to target, inflates it, and rebots the robot."
    echo "migrate backup-local <created_by> = Creates a migration tarball on a Flex."
    echo "migrate restore-local <migration-tarball.tar.gz> = Takes a tarball on the Flex, inflates it, and rebots the robot."
    echo "migrate analyze <migration-tarball.tar.gz> = Print the metadata of a migration tarball."
    echo "robot-ip = list of robot ip addresses to perform action on."
    echo ""
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
		create)
			echo "Create Diagnostics tarball"
			gather "no-scp" "$ip_addresses"
            ;;
        set-ntp)
            echo "Changing NTP settings"
            set_ntp "$ip_addresses"
            ;;
        migrate)
            migrate_main "${@:2}"
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

    # Determine if we should SCP the tarball
    scp_file=true
    ip_addresses=$@
    if [[ $1 =~ "no-scp" ]]; then
        scp_file=false
        ip_addresses="${@:2}"
    fi

    # Iterate through the ip addresses and gather data
    for ip in $ip_addresses; do
        echo "Gathering data for ${ip}, please wait..."
        ssh -q -o stricthostkeychecking=no -o userknownhostsfile=/dev/null \
            root@$ip 'bash -s' <<- 'EOF'

            serial=$(hostnamectl --static)
            today=$(date '+%Y_%m_%d_%H_%M_%S')
            diag_dir="./diag/${serial}_${today}"

            mkdir -p "${diag_dir}"
            mkdir -p "${diag_dir}/logs"
            mkdir -p "${diag_dir}/data"
            mkdir -p "${diag_dir}/system"
            mkdir -p "${diag_dir}/network"
            mkdir -p "${diag_dir}/server"

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

            echo "Gathering server files"
            cp -r /var/lib/opentrons-robot-server/ $diag_dir/server/
            cp -r /var/lib/opentrons-system-server/ $diag_dir/server/

            echo "Gathering logs"
            shopt -s extglob
            cp -r /var/log/!(journal) $diag_dir/logs/
            journalctl > $diag_dir/logs/journal.log
            dmesg > $diag_dir/logs/dmesg.log

            echo "Gathering system state"
            hostname > $diag_dir/system/hostname.txt
            uname -a > $diag_dir/system/uname.txt
            date > $diag_dir/system/datetime.txt
            timedatectl >> $diag_dir/system/datetime.txt || true
            uptime > $diag_dir/system/uptime.txt || true
            ps aux > $diag_dir/system/psaux.txt
            top -c -b -n 10 > $diag_dir/system/top.txt
            free -wl -c 10 -s 10 > $diag_dir/system/free.txt

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
            systemctl status 'opentrons*' >> $diag_dir/system/opentrons_services.txt || true

            if [ -d "$diag_dir" ]; then
                tarfile="${serial}_${today}_diag.tar.gz"
                echo "Creating Tarball ${tarfile}"
                tar -zcvf $tarfile -C ./diag .
            fi

            cleanup
EOF

        if $scp_file; then
            echo "SCP Tarball from $ip..."
            # pull the tarfile if successful
            scp -r -o stricthostkeychecking=no -o userknownhostsfile=/dev/null \
                root@$ip:*diag.tar.gz .

            # clean up
            ssh -q -o stricthostkeychecking=no -o userknownhostsfile=/dev/null \
                root@$ip 'rm -rf *diag*'
        fi
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

            serial=$(hostnamectl --static)
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

is_opentrons_flex() {
    [[ -f "/etc/VERSION.json" ]] || return 1
    [[ -d "/data" && -d "/userfs" ]] || return 1
    return 0
}

migrate_main() {
    if [[ "$#" -lt 1 ]]; then
        echo ""
        echo "Error: migrate requires a sub-action"
        echo "Usage:"
        echo "  ./flex_diagnostics migrate backup <source-ip> <created_by> [note]"
        echo "  ./flex_diagnostics migrate restore <target-ip> <migration-tarball.tar.gz>"
        echo "  ./flex_diagnostics migrate backup-local <created_by> [note]"
        echo "  ./flex_diagnostics migrate restore-local <migration-tarball.tar.gz>"
        echo "  ./flex_diagnostics migrate analyze <migration-tarball.tar.gz>"
        echo ""
        instructions
        exit 1
    fi

    local subcmd=$1
    shift

    case $subcmd in
        backup)
            if [[ -z "$1" || -z "$2" ]]; then
                echo "Error: 'backup' requires <source-ip> and <created_by>"
                exit 1
            fi
            migrate_backup false "$1" "$2" "${3:-}"
            ;;
        backup-local)
            if [[ -z "$1" ]]; then
                echo "Error: 'backup-local' requires <created_by>"
                exit 1
            fi
            migrate_backup true "$1" "$2" "${3:-}"
            ;;
        restore)
            if [[ -z "$2" ]]; then
                echo "Error: restore requires the path to a migration tarball"
                exit 1
            fi
            migrate_restore false "$1" "$2"
            ;;
        restore-local)
            if [[ -z "$1" ]]; then
                echo "Error: restore-local requires the path to a migration tarball"
                exit 1
            fi
            migrate_restore true "${1:-}"
            ;;
        analyze)
            if [[ -z "$1" ]]; then
                echo "Error: analyze requires path to a migration tarball"
                exit 1
            fi
            migrate_analyze "$1"
            ;;
        *)
            echo "Invalid migrate sub-action: $subcmd"
            echo "Valid: backup, restore, analyze"
            exit 1
            ;;
    esac
}

migrate_backup() {
    local is_local=$1
    local ip=$2
    local created_by=$3
    local note="${4:-}"
    local output_dir="/tmp"
    if $is_local; then
        if ! is_opentrons_flex; then
            instructions
            echo "⚠️  Can't use local commands when not on the Flex."
            exit 1
        fi

        ip="localhost"
        created_by=$2
        note="${3:-}"
        output_dir=$(pwd)
    fi

    echo "=== Creating migration backup from $ip ==="
    echo "Created By : $created_by"
    echo "Note       : $note"

    ssh -q -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
        root@$ip 'bash -s' <<-EOF

        set -eE -o pipefail
        trap 'echo "Backup failed on robot"' ERR

        host_name=\$(hostnamectl --pretty)
        serial=\$(cat /var/serial 2>/dev/null || echo \$host_name)
        today=\$(date '+%Y_%m_%d_%H_%M_%S')
        backup_date=\$(date '+%Y-%m-%d %H:%M:%S %Z')
        tarfile="\${serial}_\${today}_migrate.tar.gz"

        # ==================== INCLUDE LIST ====================
        # Add or remove top-level directories/files you want to backup
        declare -a INCLUDES=(
            "/data"
            "/var/lib"
            "/userfs/etc"
        )

        # Add serial if it exists
        [ -f "/var/serial" ] && INCLUDES+=("/var/serial")

        # ==================== EXCLUDE LIST ====================
        # Paths to exclude (relative to /)
        declare -a EXCLUDES=(
            "data/ODD/__ot_system_update__"
            "*/Local Extension Settings"
            "*/Local Extension Settings/*"
            "data/ODD/Local*"
            "data/ODD/*.ldb"
            "data/ODD/Cache"
            "var/log"
            "var/lib/otupdate/downloads"
            "var/lib/opkg"
            "var/lib/opkg/*"
        )
        # =====================================================

        echo "Creating metadata file..."
        mkdir -p /tmp/migrate_metadata

        cat > /tmp/migrate_metadata/metadata_compact.json <<- METADATA
        {
          "created_by": "${created_by}",
          "backup_date": "\${backup_date}",
          "note": "${note}",
          "robot_serial": "\${serial}",
          "robot_name": "\${host_name}",
          "version_file": \$(cat /etc/VERSION.json 2>/dev/null | jq . || echo "null")
        }
METADATA

        # Pretty print the metadata JSON
        jq . /tmp/migrate_metadata/metadata_compact.json > /tmp/migrate_metadata/metadata.json
        cat /tmp/migrate_metadata/metadata.json

        # Build tar arguments
        declare -a tar_args=()
        for excl in "\${EXCLUDES[@]}"; do
            tar_args+=( --exclude="\${excl}" )
        done
        for inc in "\${INCLUDES[@]}"; do
            tar_args+=( "\${inc}" )
        done

        echo "Creating migration tarball..."
        tar -zcvf "$output_dir/\${tarfile}" \
            "\${tar_args[@]}" \
            -C /tmp/migrate_metadata metadata.json 2>&1

        echo "----------------------------------------"
        echo "Migration backup created: ${output_dir}/\$tarfile"
        ls -lh "${output_dir}/\$tarfile"

        rm -rf /tmp/migrate_metadata
EOF

    if ! $is_local; then
        echo "Downloading migration tarball to host..."
        scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
            root@$ip:${output_dir}/*_migrate.tar.gz ./

        ssh -q -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
            root@$ip 'rm -f /tmp/*_migrate.tar.gz'
    fi

    echo "✅ Backup completed. Tarball saved locally."
}

migrate_restore() {
    local is_local=$1
    local ip=$2
    local tarball=$3
    if $is_local; then
        if ! is_opentrons_flex; then
            instructions
            echo "⚠️  Can't use local commands when not on the Flex."
            exit 1
        fi

        ip="localhost"
        tarball=$(realpath $2)
    fi

    if [[ ! -f "$tarball" ]]; then
        echo "Error: Tarball '$tarball' not found!"
        exit 1
    fi

    echo "=== Restoring migration data to $ip from $tarball ==="

    if tar -xOf "$tarball" metadata.json > /tmp/restore_metadata.json 2>/dev/null; then
        jq . /tmp/restore_metadata.json 2>/dev/null || cat /tmp/restore_metadata.json
        echo ""
    else
        echo "Warning: Could not extract metadata.json from tarball"
    fi

    echo "⚠️  WARNING: This will OVERWRITE data on the target robot:"
    echo "   • /data"
    echo "   • /userfs"
    echo "   • /var/lib/opentrons-robot-server"
    echo "   • /var/lib/opentrons-system-server"
    echo "   • Other user data"
    echo ""
    echo "Continue with restore? (y/N)"
    read -r confirm

    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "Restore cancelled by user."
        rm -f /tmp/restore_metadata.json
        exit 1
    fi

    if ! $is_local; then
        echo "Uploading tarball to robot..."
        scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
            "$tarball" root@$ip:/tmp/
    fi

    echo "Running restore on robot..."

    ssh -q -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
        root@$ip 'bash -s' <<-EOF

        set -eE -o pipefail
        trap 'echo "Restore failed on robot!"' ERR

        if $is_local; then
            tarball=${tarball}
        else
            tarball=\$(ls /tmp/*_migrate.tar.gz 2>/dev/null)
        fi

        if [[ -z "\$tarball" ]]; then
            echo "Error: No migration tarball found: \$tarball"
            exit 1
        fi

        echo "Stopping Opentrons services..."
        systemctl stop opentrons-robot-server 2>/dev/null || true

        echo "Remounting root filesystem read-write..."
        mount -o remount,rw / || true

        echo "Extracting migration data..."
        tar -zxvf "\$tarball" \
        --exclude="metadata.json" \
        -C /

        echo "Migration data restored successfully."

        if [ "$is_local" = false ]; then
            echo "Cleaning up..."
            rm -f \$tarball
        fi

        echo ""
        echo "=== RESTARTING ROBOT ==="
        reboot
EOF

    rm -f /tmp/restore_metadata.json
    echo "✅ Restore completed on $ip"
}

migrate_analyze() {
    local tarball=$1

    if [[ ! -f "$tarball" ]]; then
        echo "Error: Tarball '$tarball' not found!"
        exit 1
    fi

    echo "=== Metadata Analysis for: $tarball ==="
    echo "File size: $(ls -lh "$tarball" | awk '{print $5}')"
    echo "----------------------------------------"

    if tar -xOf "$tarball" metadata.json > /tmp/migrate_metadata.json 2>/dev/null; then
        if command -v jq >/dev/null 2>&1; then
            jq . /tmp/migrate_metadata.json
        else
            cat /tmp/migrate_metadata.json
        fi
        rm -f /tmp/migrate_metadata.json
    else
        echo "❌ Could not find metadata.json in the tarball."
        echo "   This may not be a valid migration backup."
    fi
}

teardown() {
    echo "Error while running script"
    echo "Exiting"
}

set -eE -o pipefail
trap teardown ERR

main "$@"
