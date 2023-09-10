"""Module to add ssh public keys from usb thumbdrive."""
import os
import hashlib
import subprocess
from pathlib import Path
from typing import Dict, Optional


AUTHORIZED_KEYS = os.path.expanduser("~/.ssh/authorized_keys")


def add_ssh_keys_from_usb(path: Optional[Path] = None) -> None:
    """Find ssh keys on the given path and add them to the authorized_keys."""

    path = path or Path("/media")

    print(f"Searching for public keys in: {path}")
    pub_keys = subprocess.check_output(
        ['find', path, '-type', 'f', '-name', '*.pub']
    ).decode().strip().split()
    if not pub_keys:
        print("No public keys found")
        return

    # Load the current keys and hash them if we have any
    current_keys = dict()
    if os.path.exists(AUTHORIZED_KEYS):
        with open(AUTHORIZED_KEYS, "r") as fh:
            current_keys = {
                hashlib.new("md5", line.encode()).hexdigest(): line
                for line in fh.read().split("\n")
                if line.strip()
            }

    # Update the existing keys if the ssh public key is valid
    with open(AUTHORIZED_KEYS, "a") as fh:
        for key in pub_keys:
            with open(key, "r") as gh:
                ssh_key = gh.read()
                if "ssh-rsa" not in ssh_key:
                    print(f"Invalid ssh public key: {key}")
                    continue
                key_hash = hashlib.new("md5", ssh_key.encode()).hexdigest()
                if not current_keys.get(key_hash):
                    fh.write(ssh_key)
                    print(f"Added new rsa key: {key}")


def clear_ssh_keys() -> None:
    """Delete all the ssh keys on the robot."""
    with open(AUTHORIZED_KEYS, "w") as fh:
        fh.write("\n")
        print(f"Cleared ssh keys: {AUTHORIZED_KEYS}")
