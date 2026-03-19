---
title: "Opentrons OT-2: Command Line Operation Over SSH"
description: "SSH access instructions"
---

The OT-2 gives you command-line access to its operating system through a Secure Shell (SSH) terminal connection. Terminal access lets you:

- Run protocols directly via the [Python API and command line](../../../python-api/docs/advanced-control/command-line.md).
- Perform advanced tasks like customizing the robot's Python environment.
- Execute protocols that reference external files on disk (apart from custom labware definition files).

An SSH key is required to perform these tasks and to issue commands from the terminal. The instructions below will show you how to create an SSH key and use it for terminal authentication and access.

1.  **Generate your SSH credentials.**
    Open your terminal and run the following command to create a unique "lock and key" set for your robot. This keeps these credentials separate from your other development keys.
    ```bash
    ssh-keygen -f ot2_ssh_key -t ecdsa
    ```
    *When prompted for a passphrase, you can press **Enter** twice to skip it, or provide a password for extra security.*

2.  **Identify the robot's Wired IP address.**
    The OT-2 requires a wired connection to register new security keys.
    * Connect your computer to the OT-2 via the **USB-to-Ethernet cable**.
    * In the Opentrons App, go to **Devices** > **Robot Settings** > **Networking**.
    * Locate the **Wired IP** address (e.g., `169.254.67.5`).

3.  **Register your public key with the robot.**
    You must "handshake" with the robot by sending it your public key. This uses port **31950**, which is specific to the Opentrons API.

    !!! warning "Replace the IP Address"
        In the command below, replace `<ROBOT_IP>` with the actual Wired IP address you found in the previous step.

    ```bash
    curl -H "Content-Type: application/json" -d "{\"key\":\"$(cat ot2_ssh_key.pub)\"}" http://<ROBOT_IP>:31950/server/ssh_keys
    ```

4.  **Establish the SSH connection.**
    Now that the robot recognizes your computer, you can log in as the `root` user.

    !!! info "The 'yes' Prompt"
        The first time you connect, the terminal will ask if you want to continue. You **must** type the full word `yes` and press **Enter**. Typing just `y` will result in a connection failure.

    ```bash
    ssh -i ot2_ssh_key root@<ROBOT_IP>
    ```

5.  **Verify the connection.**
    Once you see the Opentrons ASCII art logo in your terminal, you are successfully connected to the robot's command line. To end the session at any time, type `exit`.