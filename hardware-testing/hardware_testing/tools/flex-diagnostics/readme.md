# Diagnostics script to gather data about the Flex robot.

This script is used remotely from the host computer

# Instructions


## Running a command from host computer

  ```
  ./flex-diagnostics.sh <action> <robot-ip>
  ```

action = gather, create, set-ntp<br>
robot-ip = list of robot ip addresses to perform action on.<br>
gather = Gathers and SCPs all the data, state, and logs from the given robots<br>
create = Creates a Tarball on the robot with the data, state, logs, etc.<br>
set-ntp = Sets the ntp server to the value specified or default.<br>

## The `gather` command:
    Will gather robot data, logs, etc to a tarball file on
    the Flex and then scp that file to the current host directory.
  ```
  ./flex-diagnostics.sh gather 10.14.10.57

  ex:
    FLXA1020230605001_2025_04_21_01_02_24_diag.tar.gz
  ```

## The `create` command:
    Will gather robot data, logs, etc to a tarball file
    created on the robot, but it WONT be copied over the network via SCP. This
    is useful for unstable/slow networks, which you will need a usb thumbdrive
    to manually copy the tarball.

  ```
  ./flex-diagnostics.sh create 10.14.10.57

  this will create a tarball on the robot home dir like so
  ex:
    FLXA1020230605001_2025_04_21_01_02_24_diag.tar.gz
  ```

## The `set-ntp` command:
   Changes the NTP and DNS server settings to to the ones specified in the script.

  ```
  ./flex-diagnostics.sh set-ntp 10.14.10.57

  ```

## The `migrate` command:
    Tools to migrate user information like protocols, data, etc from one Flex to another.

The `migrate` takes one of the following sub-actions

- `backup` : Creates a migration tarball of user data like /var/lib, /data, and other important dirs + metadata.json
- `restore` : Takes in a migration tarball created with the `backup` command, inflates it on the target, and rebots it.
- `backup-local` : Same as `backup` but runs locally on the Flex from a usb thumbdrive.
- `restore-local` : Same as `restore` but runs locally on the Flex from a usb thumbdrive.
- `analyze`: Print the metadata of a migration tarball created with the `backup` command

### backup
The `backup` sub-action takes in `created_by` and an optional `note` argument in the following format
These are both strings and can be whatever you want, but the created_by is intended to have the name of the person creating the backup; the note argument can have whatever. Note that the double quotes are required for both arguments.

Remote Example:
```bash
./flex_diagnostics migrate backup <source-ip> "<created_by>" "[note]"
./flex_diagnostics migrate backup 192.168.1.1 "Opentrons Support" "Case #: 12345, Replaced on April 1, 2026"
```

Local Example:
```bash
./flex_diagnostics migrate backup-local "<created_by>" "[note]"
./flex_diagnostics migrate backup-local "Opentrons Support Local" "Case #: 12345, Replaced on April 1, 2026"
```

This generates a tarball in the following format `<robot_name>_<datetime>_migrate.tar.gz`, i.e., `TESTROBOT_2026_04_25_19_49_39_migrate.tar.gz`.

### restore
The `restore` sub-action takes in a migration-tarball argument, which is the tarfile created by the `backup` sub-action.

Remote Example:
```bash
./flex_diagnostics migrate restore <target-ip> <migration-tarball.tar.gz>
./flex_diagnostics migrate restore 192.168.1.1 TESTROBOT_2026_04_25_19_49_39_migrate.tar.gz
```

Local Example:
```bash
./flex_diagnostics migrate restore-local <migration-tarball.tar.gz>
./flex_diagnostics migrate restore-local TESTROBOT_2026_04_25_19_49_39_migrate.tar.gz
```

Note: You will be asked to confirm your actions before continuing.
```bash
⚠️  WARNING: This will OVERWRITE the following on the target robot:
   • /data
   • /userfs
   • /var/lib/opentrons-robot-server
   • /var/lib/opentrons-system-server

Continue with restore? (y/N)
```

### analyze
The `analyze` sub-action prints the contents of the metadata in the migration tarball created by the `backup` sub-action.

Example:
```bash
./flex_diagnostics migrate analyze <migration-tarball.tar.gz>"
./flex_diagnostics migrate analyze TESTROBOT_2026_04_25_19_49_39_migrate.tar.gz"
```

The metadata.json file contains information about the migration, including the robot it was created from.
```
{
  "created_by": "brayan almonte",
  "backup_date": "2026-04-25 19:49:39 UTC",
  "note": "TEST NOTES",
  "robot_serial": "TESTROBOT",
  "robot_name": "TESTROBOT",
  "version_file": {
    "robot_type": "OT-3 Standard",
    "build_type": "develop",
    "openembedded_version": "v0.9.14-27-g2bc6ea52",
    "openembedded_sha": "2bc6ea52ce6d45081cbcc19b8ccb0acbc1338537",
    "openembedded_branch": "main",
    "opentrons_api_version": "9.0.0",
    "opentrons_api_sha": "cec17768757679758f07f28cd9295417b4a90878",
    "opentrons_api_branch": "edge",
    "auth_server_version": "9.0.0",
    "auth_server_sha": "cec17768757679758f07f28cd9295417b4a90878",
    "auth_server_branch": "edge",
    "firmware_version": "v68-3-g5aa35919",
    "firmware_sha": "5aa35919ae63a90d52c53258d6b5258f5fdcf02f",
    "firmware_branch": "main",
    "robot_server_version": "9.0.0",
    "robot_server_sha": "cec17768757679758f07f28cd9295417b4a90878",
    "robot_server_branch": "edge",
    "system_server_version": "9.0.0",
    "system_server_sha": "cec17768757679758f07f28cd9295417b4a90878",
    "system_server_branch": "edge",
    "update_server_version": "9.0.0",
    "update_server_sha": "cec17768757679758f07f28cd9295417b4a90878",
    "update_server_branch": "edge",
    "usb_bridge_version": "9.0.0",
    "usb_bridge_sha": "cec17768757679758f07f28cd9295417b4a90878",
    "usb_bridge_branch": "edge"
  }
}
```


## The `emmc-health` command:
    Tools to gather data on the eMMC (Flash) of a Flex and determine if the SOM
    needs to be replaced.

The `emmc-health` takes one of the following sub-actions

- `report` = Shows eMMC health (lifetime estimation, PRE_EOL, etc.) creates csv report on the host."
- `report-local` = Shows eMMC health (lifetime estimation, PRE_EOL, etc.) creates csv report on the Flex."
- `analyze` = Takes a csv report generated by the 'report' sub-action and ranks it by Lifetime."


### report
The `report` sub-action takes in a list of ip addresses and creates a csv report of the wear and tear of the eMMC.

Remote Example:
```bash
./flex_diagnostics emmc-health report <source-ip ...>
./flex_diagnostics emmc-health report 10.14.1.111 10.14.1.123
```

Local Example:
```bash
./flex_diagnostics emmc-health report-local
```

These command have 2 outputs:
1. It prints out the `analysis` of the robots ranked by eMMC wear and tear.
    - Devices reporting `🔥 CRITICAL` or `⚠️ HIGH` are at or near end-of-life and are
    very likely to fail and should require a SOM migration using the `backup` and `restore` commands.
2. It produces a csv file `emmc-health_{date}.csv` with all the data collected.
    This file can be used with the `analyze` command to prodice the ranked `analysis`
    above.


### analyze
```bash
./flex_diagnostics emmc-health analyze <csv-file>
./flex_diagnostics emmc-health analyze emmc-health_2026_05_11_19_13_37.csv
```

Here is a sample of what the analysis output should look like
```
Gathering eMMC Health
=== Analyzing existing eMMC health report: emmc-health_2026_05_11_20_19_16.csv ===


=================================================================
                  RANKED ROBOTS BY eMMC WEAR (Lifetime)
=================================================================
────────────────────────────────────────────────────────────────────────────────
🔥 CRITICAL     10.14.1.1       NickBotzo                Serial: FLXXXXXXXX
   Lifetime     : "A: Exceeded | B: Exceeded"
   Journal Size : 1.0 GB     |   Total Writes : 150.84 GB
   Top Service  : opentrons-robot-server.service        Lines (60m) : 105767
   Biggest File/Dir : 1.1G	/var/log

   Top 10 Files/Dirs:
     • 1.1G /var/log
     • 366M /data/ODD/__ot_system_update__
     • 76M /var/lib
     • 31M /data/ODD/Cache
     • 8.0M /data/ODD/logs
     • 4.0M /data/ODD/DIPS-wal
     • 448K /data/ODD/Dictionaries
     • 428K /var/user-packages
     • 300K /data/ODD/GPUCache
     • 300K /data/ODD/DawnWebGPUCache

────────────────────────────────────────────────────────────────────────────────
🔥 CRITICAL     10.14.1.2    aahRealMonsters          Serial: FLXXXXXXXX
   Lifetime     : "A: Exceeded | B: Exceeded"
   Journal Size : 1.0 GB     |   Total Writes : 9.46 GB
   Top Service  : opentrons-robot-server.service        Lines (60m) : 4211
```


## Manually copy a tarball to a thumbdrive
  1. ssh to the robot
    `ssh root@10.14.10.57`<br>
  2. run `ls` to see the tarball created<br>
    `FLXA1020230605001_2025_04_21_01_02_24_diag.tar.gz`<br>
  3. plug in usb thumbdrive to Flex<br>
  4. Check thumbdrive with `ls /media`<br>
    `BOOT-mmcblk0p1 ENFAIN-sda1 RFS-mmcblk0p2 RFS2-mmcblk0p3`
  5. Copy the tarball to the thumbdrive (ENFAIN-sda1 for example)<br>
    `cp FLXA1020230605001_2025_04_21_01_02_24_diag.tar.gz /media/ENFAIN-sda1/`<br>
  6. Remove the tarball from the robot<br>
    `rm ~/FLXA1020230605001_2025_04_21_01_02_24_diag.tar.gz`<br>
  7. Unmount the drive once done (ENFAIN-sda1 for example)<br>
    `umount /media/ENFAIN-sda1`
