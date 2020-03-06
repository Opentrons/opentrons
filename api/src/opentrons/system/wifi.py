import hashlib
import logging
import os
import shutil
from typing import Generator, Optional
from dataclasses import dataclass

from opentrons.config import CONFIG
from opentrons.system import nmcli

log = logging.getLogger(__name__)


class ConfigureArgsError(Exception):
    pass


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
    keys_dir = CONFIG['wifi_keys_dir']
    hasher = hashlib.sha256()
    hasher.update(key_contents)
    key_hash = hasher.hexdigest()
    if key_hash in os.listdir(keys_dir):
        files = os.listdir(os.path.join(keys_dir, key_hash))
        if files:
            return AddKeyResult(created=False,
                                key=Key(directory=key_hash,
                                        file=files[0]))
        else:
            log.warning(
                "Key directory with nothing in it: {}"
                .format(key_hash))
            os.rmdir(os.path.join(keys_dir, key_hash))

    key_hash_path = os.path.join(keys_dir, key_hash)
    os.mkdir(key_hash_path)
    with open(os.path.join(key_hash_path,
                           os.path.basename(key_file_name)), 'wb') as f:
        f.write(key_contents)
    return AddKeyResult(created=True,
                        key=Key(directory=key_hash,
                                file=key_file_name))


def list_keys() -> Generator[Key, None, None]:
    """
    List wifi keys known to the system.

    :return: A generator yielding Key objects
    """
    keys_dir = CONFIG['wifi_keys_dir']
    # TODO(mc, 2018-10-24): add last modified info to keys for sort purposes
    for path in os.listdir(keys_dir):
        full_path = os.path.join(keys_dir, path)
        if os.path.isdir(full_path):
            in_path = os.listdir(full_path)
            if len(in_path) > 1:
                log.warning("Garbage in key dir for key {}".format(path))
            yield Key(directory=path,
                      file=in_path[0])
        else:
            log.warning("Garbage in wifi keys dir: {}".format(full_path))


def remove_key(requested_hash: str) -> Optional[str]:
    """
    Try to delete key file

    :param requested_hash: The hash to delete
    :return: The name of the deleted file or None if not found
    """
    keys_dir = CONFIG['wifi_keys_dir']
    available_keys = os.listdir(keys_dir)
    if requested_hash not in available_keys:
        return None
    key_path = os.path.join(keys_dir, requested_hash)
    name = os.listdir(key_path)[0]
    shutil.rmtree(key_path)
    return name


def get_key_file(arg: str) -> str:
    keys_dir = CONFIG['wifi_keys_dir']
    available_keys = os.listdir(keys_dir)
    if arg not in available_keys:
        raise ConfigureArgsError('Key ID {} is not valid on the system'
                                 .format(arg))
    files_in_dir = os.listdir(os.path.join(keys_dir, arg))
    if len(files_in_dir) > 1:
        raise OSError(
            'Key ID {} has multiple files, try deleting and reuploading'
            .format(arg))
    return os.path.join(keys_dir, arg, files_in_dir[0])


EAP_CONFIG_SHAPE = {
    'options': [
        {'name': method.qualified_name(),
         'displayName': method.display_name(),
         'options': [{k: v for k, v in arg.items()
                      if k in ['name',
                               'displayName',
                               'required',
                               'type']}
                     for arg in method.args()]}
        for method in nmcli.EAP_TYPES]
}