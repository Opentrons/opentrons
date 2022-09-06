import typing
import logging
import os
from pathlib import Path
from functools import lru_cache

log = logging.getLogger(__name__)

ENV_SHARED_DATA_PATH = "OT_SHARED_DATA_PATH"


class SharedDataMissingError(IOError):
    pass


class InvalidOpentronsDataURI(IOError):
    pass


class WrongDataKindError(IOError):
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
        log.info("Using override for shared data path: %s", override)
        return Path(override)

    # Check contents of package
    module_path = Path(__file__).parent
    module_data = module_path / "data"
    if module_data.exists():
        log.info(f"Using packaged shared data path: {str(module_data)}")
        return module_data

    # We are likely to be running locally and will find shared-data in repo
    for parent in module_path.parents:
        p = parent / "shared-data"
        if p.exists():
            log.info("Using shared data in path: %s", p)
            return p

    raise SharedDataMissingError()


def load_shared_data(path: typing.Union[str, Path]) -> bytes:
    """
    Load file from shared data directory.

    path is relative to the root of all shared data (ie. no "shared-data")
    """
    with open(get_shared_data_root() / path, "rb") as f:
        return f.read()


def load_shared_data_from_uri(
    uri: typing.Union[str, Path], data_kind_filter: typing.Optional[str] = None
) -> bytes:
    """
    Load file by an opentrons data URI, a URI parsed as if root was
    the directory returned by get_shared_data_root()

    If data_kind_filter is provided, it should be the name of one of the
    data kinds (i.e. labware,robot,deck). If the URI specifies a data kind
    other than the filter, an exception is raised.
    """
    uri_path = Path(uri)
    root = get_shared_data_root()
    if not uri_path.is_absolute():
        raise InvalidOpentronsDataURI()
    try:
        relative = uri_path.relative_to("/")
    except ValueError:
        raise InvalidOpentronsDataURI()
    resolved = (root / relative).resolve()
    # TODO: Whenever we guarantee a python version above 3.9, we can use
    # path.is_relative_to() -> bool
    try:
        parts = resolved.relative_to(root).parts
    except ValueError:
        raise InvalidOpentronsDataURI()
    if data_kind_filter and parts[0] != data_kind_filter:
        raise WrongDataKindError()
    try:
        with open(resolved, "rb") as f:
            return f.read()
    except FileNotFoundError:
        raise InvalidOpentronsDataURI()
