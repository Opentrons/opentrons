# noqa: D100
from __future__ import annotations
from typing import Any, List, Dict, Optional, Union

from opentrons_shared_data.labware.dev_types import LabwareParameters
from opentrons.protocol_engine.clients import SyncClient as ProtocolEngineClient

from .types import Point
from .well import Well


# TODO(mc, 2021-04-22): move errors to error.py
class TipSelectionError(Exception):  # noqa: D101
    pass


class OutOfTipsError(Exception):  # noqa: D101
    pass


class Labware:  # noqa: D101
    def __init__(
        self,
        engine_client: ProtocolEngineClient,
        labware_id: str,
    ) -> None:
        """Initialize a Labware API provider.

        You should not need to call this constructor yourself. The system will
        create a `Labware` for you when you call :py:meth:`load_labware`.

        Args:
            engine_client: A client to access protocol state.
            labware_id: The labware's identifier in commands and protocol state.
        """
        self._engine_client = engine_client
        self._labware_id = labware_id

    # TODO(mc, 2021-04-22): remove this property; it's redundant and
    # unlikely to be used by PAPI users
    @property
    def api_version(self) -> Any:  # noqa: D102
        raise NotImplementedError()

    @property
    def labware_id(self) -> str:
        """Unique identifier for this labware instance in the protocol.

        This identifier is used to reference this labware in commands and
        protocol state.
        """
        return self._labware_id

    @property
    def uri(self) -> str:  # noqa: D102
        raise NotImplementedError()

    # TODO(mc, 2021-04-22): labware may be on a module, replace Any with Module
    @property
    def parent(self) -> Union[str, Any]:  # noqa: D102
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

    def __eq__(self, other: object) -> bool:
        """Compare for object equality.

        Checks that other object is a `Labware` and has the same identifier.
        """
        return isinstance(other, Labware) and self._labware_id == other._labware_id

    def __hash__(self) -> int:
        """Get hash.

        Uses the labware instance's unique identifier in protocol state.
        """
        return hash(self._labware_id)

    def __getitem__(self, key: str) -> Well:  # noqa: D105
        raise NotImplementedError()

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
