---
title: "Opentrons Flex: Command Line Operation Over SSH"
---

Opentrons Flex gives you command-line access to its operating system through a Secure Shell (SSH) terminal connection. Terminal access lets you:

- Run protocols directly via the [Python API and command line](https://docs.opentrons.com/v2/new_advanced_running.html#command-line).
- Perform advanced tasks like customizing the robot's Python environment.
- Execute protocols that reference external files on disk (apart from custom labware definition files).

An SSH key is required to perform these tasks and to issue commands from the terminal. The instructions below will show you how to create an SSH key and use it for terminal authentication and access.

!!!note
    If you're unable to use a Wi-Fi network for SSH, see [Making a hardwired SSH connection][making-a-hardwired-ssh-connection] below.

## Creating an SSH key

Follow these steps to create an SSH key on your Mac, Windows, or Linux computer:

1. Open a terminal window and type this command:

    ```
    ssh-keygen -f robot_key -t ecdsa
    ```

2. Create a passphrase when prompted. This process generates a file, `robot_key.pub`. A passphrase is not required, but you should create one.

2. Copy the `robot_key.pub` file to the root of a USB-A flash drive. You will use this USB drive (and the saved key) for SSH authentication to the robot.

    !!!note
        The flash drive must have a single partition formatted with a file system readable by the embedded Linux system on Flex. FAT32, NTFS, and ext4 file systems are supported. The macOS HFS+ and APFS file systems are not. macOS can read and write to FAT-formatted drives.

3. Eject the USB drive.

## Making a wireless SSH connection

To make an SSH connection:

1. Insert the USB drive that holds the SSH key created earlier into a USB port on your Flex.

2. On your computer, open a terminal window and type the commands shown below. Replace `ROBOT_IP` with the IP address of your Flex.

    ```
    curl \
    --location --request POST \
    'http://ROBOT_IP:31950/server/ssh_keys/from_local'
    ```
    The command is successful when you see a response message that indicates a new key was added.

3. After adding the key, type the command shown below. Replace `ROBOT_IP` with the IP address of your Flex.

    ```
    ssh -i robot_key root@ROBOT_IP
    ```

4. Type the passphrase you set when creating the SSH key.

When an SSH connection is successful, the terminal command prompt changes to `root@` followed by the serial number of your robot (e.g., `root@FLXA1020231007001:~#`). You can now interact with the robot via the terminal window.

## Making a hardwired SSH connection

A hardwired connection uses an Ethernet cable to connect and transmit data directly between your computer and Flex. This is a secure alternative for SSH access in situations where network policies prevent you from making a wireless connection to the robot.

!!!note
    The hardwired SSH procedure requires assigning a static IP address to the robot. You may want to ask for help from your IT support team before proceeding.

### Cable connection

Connect a computer to the robot using an Ethernet cable. If your computer has a built-in RJ-45 Ethernet port, plug one end into the computer and connect the other end to the Ethernet port on the robot. If you're using a computer without an Ethernet port, use an adapter with an Ethernet port to make this connection.

When disconnected from a network, your Flex will assign itself an IP address and subnet mask. You'll need this information to set a static address on your computer within the same IP address range and subnet as your Flex.

### Finding the robot's IP address

You can get the IP address range and subnet mask from the robot by connecting it to your computer and checking the Opentrons App:

1. If the robot is connected by Ethernet cable to a switch or wall jack, disconnect it. Then establish a physical Ethernet connection to your computer, as described above.

2. Launch the Opentrons App.

3. Click the **Devices** tab and find your robot.

    !!!note
        If your robot appears as inactive or inaccessible in the app, wait a few moments. Flex will configure itself and eventually become available again. If this does not happen, turn the robot's power off, wait a few seconds, turn the power back on, and check the app again after the robot boots up.

4. After locating your robot in the app, click the three-dot menu (⋮), select **Robot settings**, and then click the **Networking** tab.

The Networking tab will show you the IP address and subnet mask of your robot. When disconnected from a network, Flex will assign itself a non-routing IP address. Here's an example of a self-assigned IP address on a Flex:

- IP address: 169.254.29.160
- Subnet mask: 255.255.0.0

### Setting a static IP address

The static IP address on your computer needs to be in the same IP range and subnet that your Flex uses. Given the robot's IP address above, you could set your computer's IP address and subnet as shown here:

- IP address: 169.254.29.164
- Subnet mask: 255.255.0.0

After you have a working hardwired connection, follow the instructions in [Making a wireless SSH connection][making-a-wireless-ssh-connection] above.
