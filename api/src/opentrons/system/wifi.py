import hashlib
import logging
import os
import shutil
from typing import Generator, Optional, Dict, Any
from dataclasses import dataclass

from opentrons.config import CONFIG
from opentrons.system import nmcli

log = logging.getLogger(__name__)


class ConfigureArgsError(Exception):
    pass


EAP_CONFIG_SHAPE = {
    "options": [
        {
            "name": method.qualified_name(),
            "displayName": method.display_name(),
            "options": [
                {
                    k: v
                    for k, v in arg.items()
                    if k in ["name", "displayName", "required", "type"]
                }
                for arg in method.args()
            ],
        }
        for method in nmcli.EAP_TYPES
    ]
}


@dataclass(frozen=True)
class Key:
    directory: str
    file: str


@dataclass(frozen=True)
class AddKeyResult:
    created: bool
    key: Key


def add_key(key_file_name: str, key_contents: bytes) -> AddKeyResult:
    """
    Add a key file (for later use in EAP config) to the system.
    """
    keys_dir = CONFIG["wifi_keys_dir"]
    hasher = hashlib.sha256()
    hasher.update(key_contents)
    key_hash = hasher.hexdigest()
    if key_hash in os.listdir(keys_dir):
        files = os.listdir(os.path.join(keys_dir, key_hash))
        if files:
            return AddKeyResult(
                created=False, key=Key(directory=key_hash, file=files[0])
            )
        else:
            log.warning("Key directory with nothing in it: {}".format(key_hash))
            os.rmdir(os.path.join(keys_dir, key_hash))

    key_hash_path = os.path.join(keys_dir, key_hash)
    os.mkdir(key_hash_path)
    with open(os.path.join(key_hash_path, os.path.basename(key_file_name)), "wb") as f:
        f.write(key_contents)
    return AddKeyResult(created=True, key=Key(directory=key_hash, file=key_file_name))


def list_keys() -> Generator[Key, None, None]:
    """
    List wifi keys known to the system.

    :return: A generator yielding Key objects
    """
    keys_dir = CONFIG["wifi_keys_dir"]
    # TODO(mc, 2018-10-24): add last modified info to keys for sort purposes
    for path in os.listdir(keys_dir):
        full_path = os.path.join(keys_dir, path)
        if os.path.isdir(full_path):
            in_path = os.listdir(full_path)
            if len(in_path) > 1:
                log.warning("Garbage in key dir for key {}".format(path))
            yield Key(directory=path, file=in_path[0])
        else:
            log.warning("Garbage in wifi keys dir: {}".format(full_path))


def remove_key(requested_hash: str) -> Optional[str]:
    """
    Try to delete key file

    :param requested_hash: The hash to delete
    :return: The name of the deleted file or None if not found
    """
    keys_dir = CONFIG["wifi_keys_dir"]
    available_keys = os.listdir(keys_dir)
    if requested_hash not in available_keys:
        return None
    key_path = os.path.join(keys_dir, requested_hash)
    name = os.listdir(key_path)[0]
    shutil.rmtree(key_path)
    return name


def get_key_file(key: str) -> str:
    """
    Get the full path of a key file

    :param key: The key to look for
    :return: the path
    """
    keys_dir = CONFIG["wifi_keys_dir"]
    available_keys = os.listdir(keys_dir)
    if key not in available_keys:
        raise ConfigureArgsError(f"Key ID {key} is not valid on the system")
    files_in_dir = os.listdir(os.path.join(keys_dir, key))
    if len(files_in_dir) > 1:
        raise OSError(f"Key ID {key} has multiple files, try deleting and re-uploading")
    return os.path.join(keys_dir, key, files_in_dir[0])


def _eap_check_no_extra_args(config: Dict[str, Any], options: Any) -> None:
    # options is an Any because the type annotation for EAP_CONFIG_SHAPE itself
    # can’t quite express the type properly because of the inference from the
    # dict annotation.
    """Check for args that are not required for this method (to aid debugging)
    ``config`` should be the user config.
    ``options`` should be the options sub-member for the eap method.

    Before this method is called, the validity of the 'eapType' key should be
    established.
    """
    arg_names = [k for k in config.keys() if k != "eapType"]
    valid_names = [o["name"] for o in options]
    for an in arg_names:
        if an not in valid_names:
            raise ConfigureArgsError(
                "Option {} is not valid for EAP method {}".format(an, config["eapType"])
            )


def _eap_check_option_ok(opt: Dict[str, str], config: Dict[str, Any]) -> None:
    """
    Check that a given EAP option is in the user config (if required)
    and, if specified, is the right type.

    ``opt`` should be an options dict from EAP_CONFIG_SHAPE.
    ``config`` should be the user config dict.

    Before this method is called, the validity of the eapType key should be
    established.
    """
    if opt["name"] not in config:
        if opt["required"]:
            raise ConfigureArgsError(
                "Required argument {} for eap method {} not present".format(
                    opt["displayName"], config["eapType"]
                )
            )
        else:
            return
    name = opt["name"]
    o_type = opt["type"]
    arg = config[name]
    if name in config:
        if o_type in ("string", "password") and not isinstance(arg, str):
            raise ConfigureArgsError("Option {} should be a str".format(name))
        elif o_type == "file" and not isinstance(arg, str):
            raise ConfigureArgsError("Option {} must be a str".format(name))


def eap_check_config(eap_config: Dict[str, Any]) -> Dict[str, Any]:
    """Check the eap specific args, and replace values where needed."""
    eap_type = eap_config.get("eapType")
    for method in EAP_CONFIG_SHAPE["options"]:
        if method["name"] == eap_type:
            options = method["options"]
            break
    else:
        raise ConfigureArgsError("EAP method {} is not valid".format(eap_type))

    _eap_check_no_extra_args(eap_config, options)

    for opt in options:  # type: ignore
        # Ignoring most types to do with EAP_CONFIG_SHAPE because of issues
        # wth type inference for dict comprehensions
        _eap_check_option_ok(opt, eap_config)
        if opt["type"] == "file" and opt["name"] in eap_config:
            # Special work for file: rewrite from key id to path
            eap_config[opt["name"]] = get_key_file(eap_config[opt["name"]])
    return eap_config
