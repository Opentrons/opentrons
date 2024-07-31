from typing import Protocol, Sequence

from ..types import Axis


class PositionEstimator(Protocol):
    """Position-control extensions for harwdare with encoders."""

    async def update_axis_position_estimations(self, axes: Sequence[Axis]) -> None:
        """Update the specified axes' position estimators from their encoders.

        This will allow these axes to make a non-home move even if they do not currently have
        a position estimation (unless there is no tracked poition from the encoders, as would be
        true immediately after boot).

        Axis encoders have less precision than their position estimators. Calling this function will
        cause absolute position drift. After this function is called, the axis should be homed before
        it is relied upon for accurate motion.

        This function updates only the requested axes. If other axes have bad position estimation,
        moves that require those axes or attempts to get the position of those axes will still fail.
        """
        ...

    def motor_status_ok(self, axis: Axis) -> bool:
        """Return whether an axis' position estimator is healthy.

        The position estimator is healthy if the axis has
        1) been homed
        2) not suffered a loss-of-positioning (from a cancel or stall, for instance) since being homed

        If this function returns false, getting the position of this axis or asking it to move will fail.
        """
        ...

    def encoder_status_ok(self, axis: Axis) -> bool:
        """Return whether an axis' position encoder tracking is healthy.

        The encoder status is healthy if the axis has been homed since booting up.

        If this function returns false, updating the estimator from the encoder will fail.
        """
        ...
