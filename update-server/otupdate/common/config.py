"""
otupdate.common.config: Handlers for reading update server configuration
"""

import os
import logging
import json
from typing import Any, Dict, Mapping, NamedTuple, Optional, Tuple

from aiohttp.web import Request

from . import constants

LOG = logging.getLogger(__name__)

DEFAULT_CERT_PATH = "/etc/opentrons-robot-signing-key.crt"
REQUIRED_DATA = [
    ("signature_required", bool, True),
    ("download_storage_path", str, "/var/lib/otupdate/downloads"),
    ("update_cert_path", str, DEFAULT_CERT_PATH),
]
DEFAULT_PATH = "/var/lib/otupdate/config.json"
PATH_ENVIRONMENT_VARIABLE = "OTUPDATE_CONFIG_PATH"
CONFIG_VARNAME = constants.APP_VARIABLE_PREFIX + "config"


class Config(NamedTuple):
    """Configuration elements for the update server"""

    signature_required: bool
    #: Whether the system requires updates to be signed
    download_storage_path: str
    #: Where update files that are downloaded should be stored
    path: str
    #: Where this config file was loaded from and should be saved
    update_cert_path: str
    #: The path to the x.509 certificate used to verify update files


def config_from_request(req: Request) -> Config:
    return req.app[CONFIG_VARNAME]


def _ensure_load(path: str) -> Optional[Mapping[str, Any]]:
    try:
        contents = open(path, "r").read()
    except OSError:
        LOG.exception("Couldn't load config file, defaulting")
        return None
    try:
        data = json.loads(contents)
    except json.JSONDecodeError:
        LOG.exception("Couldn't parse config file, defaulting")
        return None
    if not isinstance(data, dict):
        LOG.exception("Bad data type for config file: not dict at top")
        return None
    return data


def _ensure_values(data: Mapping[str, Any]) -> Tuple[Dict[str, Any], bool]:
    """Make sure we have appropriate keys and say if we should write"""
    to_return = {}
    should_write = False
    for keyname, typekind, default in REQUIRED_DATA:
        if keyname not in data:
            LOG.debug(f"Defaulted config value {keyname} to {default}")
            to_return[keyname] = default
            should_write = True
        elif not isinstance(data[keyname], typekind):
            LOG.warning(
                f"Config value {keyname} was {type(data[keyname])} not"
                f" {typekind}, defaulted to {default}"
            )
            to_return[keyname] = default
            should_write = True
        else:
            to_return[keyname] = data[keyname]
    return to_return, should_write


def load_from_path(path: str) -> Config:
    """
    Load a config from a file and ensure its structure.
    Writes a default if necessary
    """
    data = _ensure_load(path)
    if not data:
        data = {}
    values, should_write = _ensure_values(data)
    values.update({"path": path})
    config = Config(**values)
    if config.signature_required:
        if not os.path.exists(config.update_cert_path):
            LOG.warning(
                f"No signing cert is present in {config.update_cert_path}, "
                "code signature checking disabled"
            )
            config = config._replace(signature_required=False)
            config = config._replace(update_cert_path=DEFAULT_CERT_PATH)
    if should_write:
        save_to_path(path, config)
    return config


def _get_path(args_path: Optional[str]) -> str:
    """Find the valid path from args then env then default"""
    env_path = os.getenv(PATH_ENVIRONMENT_VARIABLE)
    for path, source in ((args_path, "arg"), (env_path, "env")):
        if not path:
            LOG.debug(f"config.load: skipping {source} (path None)")
            continue
        else:
            LOG.debug(f"config.load: using config path {path} from {source}")
            return path
    return DEFAULT_PATH


def load(args_path: str = None) -> Config:
    """
    Load the config file, selecting the appropriate path from many sources
    """
    return load_from_path(_get_path(args_path))


def save_to_path(path: str, config: Config) -> None:
    """
    Save the config file to a specific path (not what's in the config)
    """
    LOG.debug(f"Saving config to {path}")
    with open(path, "w") as cf:
        cf.write(json.dumps({k: v for k, v in config._asdict().items() if k != "path"}))


def save(config: Config) -> None:
    """Save the config element back to wherever it was loaded"""
    save_to_path(config.path, config)
