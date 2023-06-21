from pathlib import Path

from typing_extensions import Final

from opentrons.config import get_opentrons_path
from .types import APIVersion

OPENTRONS_NAMESPACE: Final = "opentrons"
CUSTOM_NAMESPACE: Final = "custom_beta"
STANDARD_DEFS_PATH: Final = Path("labware/definitions/2")
USER_DEFS_PATH: Final = get_opentrons_path("labware_user_definitions_dir_v2")

ENGINE_CORE_API_VERSION: Final = APIVersion(2, 14)
"""The earliest Python Protocol API version ("apiLevel") where the protocol's simulation
and execution will be handled by Protocol Engine, rather than the legacy machinery.

Note that even when simulation and execution are handled by the legacy machinery,
Protocol Engine still has some involvement for analyzing the simulation and
monitoring the execution.
"""
