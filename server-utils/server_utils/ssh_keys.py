"""Module to copy ssh keys from usb thumbdrive.."""
import os
import hashlib
import subprocess
from pathlib import Path
from typing import Dict, List, Tuple


AUTHORIZED_KEYS = os.path.expanduser("~/.ssh/fake_authorized_keys")


def get_keys() -> Dict[str, str]:                                     
    """Return a list of tuples of [md5(pubkey), pubkey]"""
    with open(AUTHORIZED_KEYS, 'r') as fh:
        return {
            hashlib.new("md5", line.encode()).hexdigest(): line
            for line in fh.read().split("\n")
            if line.strip()
        }


def add_ssh_keys_from_usb(path: Path = None) -> None:
    """Update ssh rsa keys from usb thumbdrive."""

    path = path or Path("/media")

    print(f"Searching for public keys in: {path}")
    pub_keys = subprocess.check_output(
        ['find', path, '-type', 'f', '-name', '*.pub']
    ).decode().strip().split()

    if not pub_keys:
        print("No public keys found")
        return

    # lets load the existing keys
    current_keys = get_keys()
    new_keys = list()
    for key in pub_keys:
        print(f"Found potential key: {key}")
        print("Validating")
        key_hash = hashlib.new("md5", key.encode()).hexdigest() 
        if not current_keys.get(key_hash):
            new_keys.append(key)

    # Update the authorized_keys file if we have valid keys
    if new_keys:
        print(f"Adding new keys to: {AUTHORIZED_KEYS}")
        with open(AUTHORIZED_KEYS, 'a') as fh:
            for key in new_keys:
                print(f"Added new rsa key: {key}")
                with open(key, "r") as gh:
                    fh.write(gh.read())


def clear_ssh_keys() -> None:
    """Clear all the ssh keys."""
    with open(AUTHORIZED_KEYS, 'w') as fh:
        fh.write("\n")
        print(f"Cleared ssh keys: {AUTHORIZED_KEYS}")

