# noqa: D104

import logging
from typing import List

from opentrons.config import feature_flags as ff
from opentrons.protocols.types import ApiDeprecationError
from opentrons.protocols.api_support.types import APIVersion

from ._version import version

__version__ = version


LEGACY_MODULES = ["robot", "reset", "instruments", "containers", "labware", "modules"]


__all__ = ["version", "__version__", "config"]


def __getattr__(attrname: str) -> None:
    """Prevent import of legacy modules from global.

    This is to officially deprecate deprecate Python API Version 1.0.
    """
    if attrname in LEGACY_MODULES:
        raise ApiDeprecationError(APIVersion(1, 0))
    raise AttributeError(attrname)


def __dir__() -> List[str]:
    return sorted(__all__ + LEGACY_MODULES)


log = logging.getLogger(__name__)


# todo(mm, 2024-05-15): Having functions in the package's top-level __init__.py
# can cause problems with import performance and circular dependencies. Can this
# be moved elsewhere?
def should_use_ot3() -> bool:
    """Return true if ot3 hardware controller should be used."""
    if ff.enable_ot3_hardware_controller():
        try:
            # Try this OT-3-specific import as an extra check in case the feature
            # flag is mistakenly enabled on an OT-2 for some reason.
            from opentrons_hardware.drivers.can_bus import CanDriver  # noqa: F401

            return True
        except ModuleNotFoundError:
            log.exception("Cannot use OT3 Hardware controller.")
    return False
