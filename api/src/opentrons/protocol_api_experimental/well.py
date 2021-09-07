# noqa: D100
from __future__ import annotations
from typing import TYPE_CHECKING, Any, Optional

from opentrons.protocols.geometry.well_geometry import WellGeometry
from opentrons.protocol_engine.clients import SyncClient as ProtocolEngineClient

from .types import Location, Point

if TYPE_CHECKING:
    from .labware import Labware


class Well:  # noqa: D101
    def __init__(
        self,
        engine_client: ProtocolEngineClient,
        labware: Labware,
        well_name: str,
    ) -> None:
        """Initialize a Well API provider.

        You should not need to call this constructor yourself. The system will
        create `Well`s for you when you call :py:meth:`load_labware`.

        Args:
            engine_client: A client to access protocol state.
            labware: The well's parent Labware instance.
            well_name: The unique name of the well inside its parent labware.
        """
        self._engine_client = engine_client
        self._labware = labware
        self._well_name = well_name
        self._well_definition = self._engine_client.state.labware.get_well_definition(
            labware_id=labware.labware_id, well_name=well_name
        )

    # TODO(mc, 2021-04-22): remove this property; it's redundant and
    # unlikely to be used by PAPI users
    @property
    def api_version(self) -> Any:  # noqa: D102
        raise NotImplementedError()

    @property
    def parent(self) -> Labware:  # noqa: D102
        return self._labware

    @property
    def has_tip(self) -> bool:  # noqa: D102
        raise NotImplementedError()

    @has_tip.setter
    def has_tip(self, value: bool) -> None:
        raise NotImplementedError()

    @property
    def max_volume(self) -> float:  # noqa: D102
        return self._well_definition.totalLiquidVolume

    # TODO(mc, 2021-04-22): explore collapsing WellGeometry into Well
    @property
    def geometry(self) -> WellGeometry:  # noqa: D102
        raise NotImplementedError()

    @property
    def diameter(self) -> Optional[float]:  # noqa: D102
        return self._well_definition.diameter

    @property
    def length(self) -> Optional[float]:  # noqa: D102
        raise NotImplementedError()

    @property
    def width(self) -> Optional[float]:  # noqa: D102
        raise NotImplementedError()

    @property
    def depth(self) -> float:  # noqa: D102
        return self._well_definition.depth

    @property
    def display_name(self) -> str:  # noqa: D102
        raise NotImplementedError()

    @property
    def well_name(self) -> str:  # noqa: D102
        return self._well_name

    def top(self, z: float = 0.0) -> Location:  # noqa: D102
        raise NotImplementedError()

    def bottom(self, z: float = 0.0) -> Location:  # noqa: D102
        raise NotImplementedError()

    def center(self) -> Location:  # noqa: D102
        raise NotImplementedError()

    def from_center_cartesian(  # noqa: D102
        self,
        x: float,
        y: float,
        z: float,
    ) -> Point:
        raise NotImplementedError()

    def __repr__(self) -> str:  # noqa: D105
        return f"Well:{self._well_name}<Labware:{self.parent}>"

    def __eq__(self, other: object) -> bool:
        """Compare for object equality.

        Checks that other object is a `Well` and belongs to the same labware.
        """
        return (
            isinstance(other, Well)
            and self.well_name == other.well_name
            and self.parent == other.parent
        )

    def __hash__(self) -> int:  # noqa: D105
        raise NotImplementedError()
