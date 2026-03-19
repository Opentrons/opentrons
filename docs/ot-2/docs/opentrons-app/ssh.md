---
title: "Opentrons OT-2: Command Line Operation Over SSH"
description: "SSH access instructions"
---

The OT-2 gives you command-line access to its operating system through a Secure Shell (SSH) terminal connection. Terminal access lets you:

- Run protocols directly via the <font color="red">Python API and command line</font>.
- Perform advanced tasks like customizing the robot's Python environment.
- Execute protocols that reference external files on disk (apart from custom labware definition files).

SSH key is required to perform these tasks and to issue commands from the terminal. The instructions below will show you how to create an SSH key and connect to an OT-2 via the terminal.

## Before you begin

The OT-2 requires an Ethernet connection to generate an IP address and to register a security key. This means you cannot use a wireless connection for SSH. Instead, you must connect your computer to the robot with an Ethernet cable before working through the steps in this procedure.

![Robot and computer connected via Ethernet cable](../images/usb-ethernet.png)

If you're using a computer without an Ethernet port, use the dongle that shipped with your OT-2 or another adapter with an Ethernet port.

## Create an SSH key

Follow these steps to create an SSH key on your Mac, Windows, or Linux computer:

1. Open a terminal window and type this command:

    ```bash
    ssh-keygen -f ot2_ssh_key -t ecdsa
    ```

2. Create a passphrase when prompted. A passphrase is not required, but you should create one.

## Install the key on your OT-2

3. Open the Opentrons App and click **Devices**.

4. Find the OT-2 you want to work with.

5. Click the three-dot menu (⋮) for that robot and then click **Robot settings**.

6. Click the **Networking** tab. Note the IP address for your OT-2. You will use it in the next step.

    <font color="red">PLACEHOLDER FOR IMAGE</font>

7. Type the commands shown below in the terminal window. Replace `ROBOT_IP` with the IP address of your OT-2.

    ```
    curl \
    -H 'Content-Type: application/json' \
    -d "{\"key\":\"$(cat ot2_ssh_key.pub)\"}" \
    http://ROBOT_IP:31950/server/ssh_keys
    ```

    When successful, the robot responds with a message that the key has been added.

8. Type the command shown below in the terminal window. Replace `ROBOT_IP` with the IP address of your OT-2.

    `ssh -i ot2_ssh_key root@ROBOT_IP`

    !!! note
        The first time you connect, the terminal will:
        - Show a message indicating the authenticity of the host can't be established. Ignore the message.
        - Ask if you want to continue. Type the full word `yes` and click **Enter** or **Return** to continue.

9. Verify the connection. The terminal will show ASCII art that spells "OT2" when the connection is successful.

    ```
          @@@@@    @@@@@
        @@@@          @@@@
       @@@      @@      @@@    @@@@@@   @@@@@
      @@@      @@@@      @@@   @@@@@@  &@' '@@
      @@     @@@@@@@@    &@@     @@         @@
      @@    .@@@    @    #@@     @@        @@
      @@@    @      @    @@@     @@       @@
       @@@    @@..@@    @@@      @@      @@
        @@@@          @@@@       @@     @@@@@&
          @@@@@@@@@@@@@@         ##    &@@@@@#
             (@@@@@@.
    ```

You can now interact with the OT-2 via the terminal.