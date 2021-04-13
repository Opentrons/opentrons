# noqa: D100
from __future__ import annotations
import logging

from typing import (
    List, Dict, Optional
)

from opentrons.protocols.geometry.well_geometry import WellGeometry
from opentrons.types import Location, Point, LocationLabware
from opentrons.protocols.api_support.types import APIVersion
from opentrons_shared_data.labware.dev_types import LabwareParameters


MODULE_LOG = logging.getLogger(__name__)


class TipSelectionError(Exception):  # noqa: D101
    pass


class OutOfTipsError(Exception):  # noqa: D101
    pass


class Well:  # noqa: D101
    def __init__(  # noqa: D107
            self,
            well_name: str,
            labware: Labware
    ) -> None:

        self._well_name = well_name
        self._labware = labware

    @property
    def api_version(self) -> APIVersion:  # noqa: D102
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
        raise NotImplementedError()

    @property
    def geometry(self) -> WellGeometry:  # noqa: D102
        raise NotImplementedError()

    @property
    def diameter(self) -> Optional[float]:  # noqa: D102
        raise NotImplementedError()

    @property
    def length(self) -> Optional[float]:  # noqa: D102
        raise NotImplementedError()

    @property
    def width(self) -> Optional[float]:  # noqa: D102
        raise NotImplementedError()

    @property
    def depth(self) -> float:  # noqa: D102
        raise NotImplementedError()

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

    def from_center_cartesian(self, x: float, y: float, z: float) -> Point:  # noqa: D102, E501
        raise NotImplementedError()

    def __repr__(self) -> str:  # noqa: D105
        raise NotImplementedError()

    def __eq__(self, other: object) -> bool:  # noqa: D105
        raise NotImplementedError()

    def __hash__(self) -> int:  # noqa: D105
        raise NotImplementedError()


class Labware:  # noqa: D101

    def __init__(self, resource_id: str) -> None:  # noqa: D107
        self._resource_id = resource_id

    @property
    def api_version(self) -> APIVersion:  # noqa: D102
        raise NotImplementedError()

    def __getitem__(self, key: str) -> Well:  # noqa: D105
        raise NotImplementedError()

    @property
    def uri(self) -> str:  # noqa: D102
        raise NotImplementedError()

    @property
    def parent(self) -> LocationLabware:  # noqa: D102
        raise NotImplementedError()

    @property
    def name(self) -> str:  # noqa: D102
        raise NotImplementedError()

    @name.setter
    def name(self, new_name: str) -> None:
        raise NotImplementedError()

    @property
    def load_name(self) -> str:  # noqa: D102
        raise NotImplementedError()

    @property
    def parameters(self) -> LabwareParameters:  # noqa: D102
        raise NotImplementedError()

    @property
    def quirks(self) -> List[str]:  # noqa: D102
        raise NotImplementedError()

    @property
    def magdeck_engage_height(self) -> Optional[float]:  # noqa: D102
        raise NotImplementedError()

    @property
    def calibrated_offset(self) -> Point:  # noqa: D102
        raise NotImplementedError()

    def well(self, idx: int) -> Well:  # noqa: D102
        raise NotImplementedError()

    def wells(self) -> List[Well]:  # noqa: D102
        raise NotImplementedError()

    def wells_by_name(self) -> Dict[str, Well]:  # noqa: D102
        raise NotImplementedError()

    def rows(self) -> List[List[Well]]:  # noqa: D102
        raise NotImplementedError()

    def rows_by_name(self) -> Dict[str, List[Well]]:  # noqa: D102
        raise NotImplementedError()

    def columns(self) -> List[List[Well]]:  # noqa: D102
        raise NotImplementedError()

    def columns_by_name(self) -> Dict[str, List[Well]]:  # noqa: D102
        raise NotImplementedError()

    @property
    def highest_z(self) -> float:  # noqa: D102
        raise NotImplementedError()

    @property
    def is_tiprack(self) -> bool:  # noqa: D102
        raise NotImplementedError()

    @property
    def tip_length(self) -> float:  # noqa: D102
        raise NotImplementedError()

    @tip_length.setter
    def tip_length(self, length: float) -> None:
        raise NotImplementedError()

    def __repr__(self) -> str:  # noqa: D105
        raise NotImplementedError()

    def __eq__(self, other: object) -> bool:  # noqa: D105
        raise NotImplementedError()

    def __hash__(self) -> int:  # noqa: D105
        raise NotImplementedError()

    # For Opentrons internal use only.
    # Not part of the public Python Protocol API.
    @property
    def resource_id(self) -> str:  # noqa: D102
        return self._resource_id

    # todo(mm, 2021-04-09): The following methods appear on docs.opentrons.com
    # (accidentally?) but aren't versioned. Figure out whether we need to
    # include them here.
    #   * next_tip()
    #   * use_tips()
    #   * previous_tip()
    #   * return_tips()


# todo(mm, 2021-04-09): In addition to the Labware class, the APIv2
# analogue to this module provides several free functions. Some of them
# appear on docs.opentrons.com, but none of them are versioned with
# @requires_version, so it's unclear if they're meant to be part of the public
# API. We need to figure out whether we need to include them here.
