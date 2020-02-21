import typing
import sys
import logging
import os
from pathlib import Path
from functools import lru_cache

log = logging.getLogger(__name__)

ENV_SHARED_DATA_PATH = "OT_SHARED_DATA_PATH"


class SharedDataMissingError(IOError):
    pass


@lru_cache(maxsize=1)
def get_shared_data_root() -> Path:
    """
    Get the root directory of the shared data.

    Steps (first to succeed wins):
    1) Use environment variable in OT_SHARED_DATA_PATH
    2) Look in "shared_data" in the root of the installed package
    3) Look for "shared-data" in parent directories.
    4) Raise exception
    """
    # Check environment variable
    override = os.environ.get(ENV_SHARED_DATA_PATH)
    if override is not None:
        log.info('Using override for shared data path: %s', override)
        return Path(override)

    # Check contents of package
    module_path = Path(sys.modules['opentrons'].__file__).parent
    p = module_path / "shared_data"
    if p.exists():
        log.info('Using packaged shared data path: %s', p)
        return p

    # We are likely to be running locally and will find shared-data in repo
    for parent in p.parents:
        p = parent / "shared-data"
        if p.exists():
            log.info('Using shared data in path: %s', p)
            return p

    raise SharedDataMissingError()


def load_shared_data(path: typing.Union[str, Path]) -> bytes:
    """
    Load file from shared data directory.

    path is relative to the root of all shared data (ie. no "shared-data")
    """
    with open(str(get_shared_data_root() / path), 'rb') as f:
        return f.read()
