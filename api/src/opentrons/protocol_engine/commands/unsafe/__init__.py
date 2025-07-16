"""Commands that are "unsafe".

"Unsafe" means that they can cause inaccuracy or incorrect behavior. They should
therefore never be used in protocols, and should only be used otherwise as a last
resort.

These exist as a necessary evil for implementing things like error recovery.
Even in those narrow contexts, these commands must be used with care.
e.g. after an `UpdatePositionEstimators` command, there must be a `Home` command,
or positioning will be subtly wrong. Each unsafe command should document its intended
use case and its caveats.

Because we don't expect unsafe commands to be used in any protocols whose behavior we
must preserve, we may change the commands' semantics over time. We may also change
their shapes if we're confident that it won't break something in robot-server's
persistent storage.
"""


from .unsafe_blow_out_in_place import (
    UnsafeBlowOutInPlaceCommandType,
    UnsafeBlowOutInPlaceParams,
    UnsafeBlowOutInPlaceResult,
    UnsafeBlowOutInPlace,
    UnsafeBlowOutInPlaceCreate,
)
from .unsafe_drop_tip_in_place import (
    UnsafeDropTipInPlaceCommandType,
    UnsafeDropTipInPlaceParams,
    UnsafeDropTipInPlaceResult,
    UnsafeDropTipInPlace,
    UnsafeDropTipInPlaceCreate,
)

from .update_position_estimators import (
    UpdatePositionEstimatorsCommandType,
    UpdatePositionEstimatorsParams,
    UpdatePositionEstimatorsResult,
    UpdatePositionEstimators,
    UpdatePositionEstimatorsCreate,
)

from .unsafe_engage_axes import (
    UnsafeEngageAxesCommandType,
    UnsafeEngageAxesParams,
    UnsafeEngageAxesResult,
    UnsafeEngageAxes,
    UnsafeEngageAxesCreate,
)

from .unsafe_ungrip_labware import (
    UnsafeUngripLabwareCommandType,
    UnsafeUngripLabwareParams,
    UnsafeUngripLabwareResult,
    UnsafeUngripLabware,
    UnsafeUngripLabwareCreate,
)


from .unsafe_place_labware import (
    UnsafePlaceLabwareCommandType,
    UnsafePlaceLabwareParams,
    UnsafePlaceLabwareResult,
    UnsafePlaceLabware,
    UnsafePlaceLabwareCreate,
)

from .unsafe_stacker_manual_retrieve import (
    UnsafeFlexStackerManualRetrieveCommandType,
    UnsafeFlexStackerManualRetrieveParams,
    UnsafeFlexStackerManualRetrieveResult,
    UnsafeFlexStackerManualRetrieve,
    UnsafeFlexStackerManualRetrieveCreate,
)

from .unsafe_stacker_close_latch import (
    UnsafeFlexStackerCloseLatchCommandType,
    UnsafeFlexStackerCloseLatchParams,
    UnsafeFlexStackerCloseLatchResult,
    UnsafeFlexStackerCloseLatch,
    UnsafeFlexStackerCloseLatchCreate,
)

from .unsafe_stacker_open_latch import (
    UnsafeFlexStackerOpenLatchCommandType,
    UnsafeFlexStackerOpenLatchParams,
    UnsafeFlexStackerOpenLatchResult,
    UnsafeFlexStackerOpenLatch,
    UnsafeFlexStackerOpenLatchCreate,
)

from .unsafe_stacker_prepare_shuttle import (
    UnsafeFlexStackerPrepareShuttleCommandType,
    UnsafeFlexStackerPrepareShuttleParams,
    UnsafeFlexStackerPrepareShuttleResult,
    UnsafeFlexStackerPrepareShuttle,
    UnsafeFlexStackerPrepareShuttleCreate,
)

__all__ = [
    # Unsafe blow-out-in-place command models
    "UnsafeBlowOutInPlaceCommandType",
    "UnsafeBlowOutInPlaceParams",
    "UnsafeBlowOutInPlaceResult",
    "UnsafeBlowOutInPlace",
    "UnsafeBlowOutInPlaceCreate",
    # Unsafe drop-tip command models
    "UnsafeDropTipInPlaceCommandType",
    "UnsafeDropTipInPlaceParams",
    "UnsafeDropTipInPlaceResult",
    "UnsafeDropTipInPlace",
    "UnsafeDropTipInPlaceCreate",
    # Update position estimate command models
    "UpdatePositionEstimatorsCommandType",
    "UpdatePositionEstimatorsParams",
    "UpdatePositionEstimatorsResult",
    "UpdatePositionEstimators",
    "UpdatePositionEstimatorsCreate",
    # Unsafe engage axes
    "UnsafeEngageAxesCommandType",
    "UnsafeEngageAxesParams",
    "UnsafeEngageAxesResult",
    "UnsafeEngageAxes",
    "UnsafeEngageAxesCreate",
    # Unsafe ungrip labware
    "UnsafeUngripLabwareCommandType",
    "UnsafeUngripLabwareParams",
    "UnsafeUngripLabwareResult",
    "UnsafeUngripLabware",
    "UnsafeUngripLabwareCreate",
    # Unsafe place labware
    "UnsafePlaceLabwareCommandType",
    "UnsafePlaceLabwareParams",
    "UnsafePlaceLabwareResult",
    "UnsafePlaceLabware",
    "UnsafePlaceLabwareCreate",
    # Unsafe manual retrieve
    "UnsafeFlexStackerManualRetrieveCommandType",
    "UnsafeFlexStackerManualRetrieveParams",
    "UnsafeFlexStackerManualRetrieveResult",
    "UnsafeFlexStackerManualRetrieve",
    "UnsafeFlexStackerManualRetrieveCreate",
    # Unsafe flex stacker close latch
    "UnsafeFlexStackerCloseLatchCommandType",
    "UnsafeFlexStackerCloseLatchParams",
    "UnsafeFlexStackerCloseLatchResult",
    "UnsafeFlexStackerCloseLatch",
    "UnsafeFlexStackerCloseLatchCreate",
    # Unsafe flex stacker open latch
    "UnsafeFlexStackerOpenLatchCommandType",
    "UnsafeFlexStackerOpenLatchParams",
    "UnsafeFlexStackerOpenLatchResult",
    "UnsafeFlexStackerOpenLatch",
    "UnsafeFlexStackerOpenLatchCreate",
    # Unsafe flex stacker prepare shuttle
    "UnsafeFlexStackerPrepareShuttleCommandType",
    "UnsafeFlexStackerPrepareShuttleParams",
    "UnsafeFlexStackerPrepareShuttleResult",
    "UnsafeFlexStackerPrepareShuttle",
    "UnsafeFlexStackerPrepareShuttleCreate",
]
