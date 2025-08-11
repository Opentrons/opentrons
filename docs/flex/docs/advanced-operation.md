---
title: "Opentrons Flex: Advanced Operation"
---

# Advanced Operation

Flex provides methods of advanced control that let you directly manipulate files on the robot and execute commands outside of protocols.

## Command line operation over SSH

You can work with your Flex through a Secure Shell (SSH) terminal connection. Terminal access lets you [run protocols directly from the command line](https://docs.opentrons.com/v2/new_advanced_running.html#command-line) or perform advanced tasks, such as customizing the Python environment on the robot. Protocols that reference external files on disk (apart from custom labware definition files) must be run from the command line.

!!!note
    - SSH keys are required before you can connect to Flex and issue commands from a terminal.
    - If you're unable to use a Wi-Fi network for SSH, see [Hardwired SSH Connections][hardwired-ssh-connections] below.

### Creating SSH keys

Follow these steps to create SSH keys on your Mac, Windows, or Linux computer:

1. Open a terminal window and type this command:

    ```
    ssh-keygen -f robot_key -t ecdsa
    ```

1. Create a passphrase when prompted. This process generates a file, `robot_key.pub`. A passphrase is not required, but you should create one.

1. Copy the `robot_key.pub` file to the root of a USB-A flash drive. You will use this USB drive (and the saved key) for SSH authentication to the robot.

    !!!note
        The flash drive must have a single partition formatted with a file system readable by the embedded Linux system on Flex. FAT32, NTFS, and ext4 file systems are supported. The macOS HFS+ and APFS file systems are not. macOS can read and write to FAT-formatted drives.

1. Eject the USB drive.

### Making an SSH connection

To make an SSH connection:

1. Insert the USB drive that holds the SSH key created earlier into a USB port on your Flex.

1. On your computer, open a terminal window and type the commands shown below. Replace `ROBOT_IP` with the IP address of your Flex.

    ```
    curl \
    --location --request POST \
    'http://ROBOT_IP:31950/server/ssh_keys/from_local'
    ```
    The command is successful when you see a response message that indicates a new key was added.

1. After adding the key, type the command shown below. Replace `ROBOT_IP` with the IP address of your Flex.

    ```
    ssh -i robot_key root@ROBOT_IP
    ```

1. Type the passphrase you set when creating the SSH key.

When an SSH connection is successful, the terminal command prompt changes to `root@` followed by the serial number of your robot (e.g., `root@FLXA1020231007001:~#`). You can now interact with the robot via the terminal window.

### Hardwired SSH connections

A hardwired connection uses an Ethernet cable to connect and transmit data directly between your computer and Flex. This is a secure alternative for SSH access in situations where network policies prevent you from making a wireless connection to the robot.

!!!note
    The hardwired SSH procedure requires assigning a static IP address to the robot. You may want to ask for help from your IT support team before proceeding.

#### Physical connection

Connect a computer to the robot using an Ethernet cable. If your computer has a built-in RJ-45 Ethernet port, plug one end into the computer and connect the other end to the Ethernet port on the robot. If you're using a computer without an Ethernet port, use an adapter with an Ethernet port to make this connection.

When disconnected from a network, your Flex will assign itself an IP address and subnet mask. You'll need this information to set a static address on your computer within the same IP address range and subnet as your Flex.

#### Finding the robot's IP address

You can get the IP address range and subnet mask from the robot by connecting it to your computer and checking the Opentrons App:

1. If the robot is connected by Ethernet cable to a switch or wall jack, disconnect it. Then establish a physical Ethernet connection to your computer, as described above.

1. Launch the Opentrons App.

1. Click the **Devices** tab and find your robot.

    !!!note
        If your robot appears as inactive or inaccessible in the app, wait a few moments. Flex will configure itself and eventually become available again. If this does not happen, turn the robot's power off, wait a few seconds, turn the power back on, and check the app again after the robot boots up.

1. After locating your robot in the app, click the three-dot menu (⋮), select **Robot settings**, and then click the **Networking** tab.

The Networking tab will show you the IP address and subnet mask of your robot. When disconnected from a network, Flex will assign itself a non-routing IP address. Here's an example of a self-assigned IP address on a Flex:

- IP address: 169.254.29.160
- Subnet mask: 255.255.0.0

#### Setting a static IP address

The static IP address on your computer needs to be in the same IP range and subnet that your Flex uses. Given the robot's IP address above, you could set your computer's IP address and subnet as shown here:

- IP address: 169.254.29.164
- Subnet mask: 255.255.0.0

After you have a working hardwired connection, follow the instructions in [Making an SSH Connection][making-an-ssh-connection] above.

## Jupyter Notebook

Flex runs a [Jupyter Notebook](https://jupyter.org/) server on port 48888, which you can connect to with your web browser. Use Jupyter to individually run discrete chunks of Python code, called *cells*. This is a convenient environment for writing and debugging protocols, since you can define different parts of your protocol in different notebook cells, and run a single cell at a time.

Access your robot's Jupyter Notebook either:

- In the Opentrons App. Go to **Devices** > your robot > **Robot Settings** > **Advanced** and then click **Launch Jupyter Notebook**.

- In your web browser. Navigate directly to `http://<robot-ip>:48888`, replacing `<robot-ip>` with the local IP address of your Flex.

For more details on using Jupyter, including preparing executable cells
of code and running them on a robot, see the [Jupyter Notebook section](https://docs.opentrons.com/v2/new_advanced_running.html#jupyter-notebook) of the Python Protocol API documentation.

