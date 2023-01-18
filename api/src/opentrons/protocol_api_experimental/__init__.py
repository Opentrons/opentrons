"""An experimental, in-progress rewrite of the public Python Protocol API v2.

This rewrite is to implement the API in terms of the newer Protocol Engine
back-end architecture.

Unless documented otherwise, the behavior of everything should be the same as
APIv2. There may be variation in behavior that was underspecified in APIv2--
we'll try to call this out when we know about it, but there are no guarantees
that those callouts are comprehensive.

This code is totally unsupported. To do science on a robot, use the stable
`opentrons.protocol_api` instead.
"""

# todo(mm, 2021-04-09): The APIv2 analogue to this file exposes some, but not
# all, package members at the top level. For example, you can access
# protocol_api.InstrumentContext, but not protocol_api.Point. We should take
# advantage of the APIv3 break to consolidate the API namespaces.

from .protocol_context import ProtocolContext
from .pipette_context import PipetteContext
from .instrument_context import InstrumentContext
from .module_contexts import (
    MagneticModuleContext,
    TemperatureModuleContext,
    ThermocyclerModuleContext,
    HeaterShakerModuleContext,
)
from .labware import Labware
from .well import Well
from .errors import (
    InvalidPipetteNameError,
    InvalidMountError,
    InvalidModuleLocationError,
    InvalidMagnetEngageHeightError,
)
from .types import (
    DeckSlotName,
    LabwareParameters,
    PipetteName,
    Point,
    Mount,
    DeprecatedMount,
)

__all__ = [
    # Protocol API classes
    "ProtocolContext",
    "PipetteContext",
    "InstrumentContext",
    "MagneticModuleContext",
    "MagneticModuleStatus",
    "TemperatureModuleContext",
    "ThermocyclerModuleContext",
    "HeaterShakerModuleContext",
    "Labware",
    "Well",
    # Protocol API errors
    "InvalidPipetteNameError",
    "InvalidMountError",
    "InvalidModuleLocationError",
    "InvalidMagnetEngageHeightError",
    # Protocol API types and data classes
    "DeckSlotName",
    "LabwareParameters",
    "PipetteName",
    "Point",
    "Mount",
    "DeprecatedMount",
]
