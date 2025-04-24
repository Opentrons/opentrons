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
