# noqa: D100
from __future__ import annotations
from typing import Any, List, Dict, Optional, Union, cast

from opentrons.protocol_engine.clients import SyncClient as ProtocolEngineClient
from .errors import LabwareIsNotTipRackError
from .types import DeckSlotName, LabwareParameters, Point
from .well import Well


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
        protocol state. This ID will be unique for every piece of labware
        in the protocol, even if labware share the same definition.
        """
        return self._labware_id

    @property
    def uri(self) -> str:
        """A string fully identifying the labware's underlying definition.

        The labware's definition URI will be distinct and different than the
        labware's ``labware_id``, which refers instead to specific instance of
        the labware on the deck during the protocol.

        The definition URI is of the format ``"{namespace}/{load_name}/{version}"``.
        """
        return self._engine_client.state.labware.get_definition_uri(
            labware_id=self._labware_id
        )

    # TODO(mc, 2021-04-22): labware may be on a module, replace Any with Module
    @property
    def parent(self) -> Union[DeckSlotName, Any]:
        """The parent location of this labware.

        If the labware's parent is a string, that string represents a specific
        deck slot. Otherwise, the labware is on a module, and the object
        returned will be a :py:class:`ModuleContext`.
        """
        parent = self._engine_client.state.labware.get_labware_location(
            labware_id=self._labware_id
        )
        return str(parent.slot)

    # TODO(mc, 2021-05-03): document removal of name setter
    @property
    def name(self) -> str:  # noqa: D102
        raise NotImplementedError()

    @property
    def load_name(self) -> str:
        """The load name of this labware's definition.

        This is best used for informational purposes. There is no requirement
        that a load name be unique among other definitions. To specify a fully-
        qualified definition, use :py:meth:`uri`.
        """
        return self._engine_client.state.labware.get_load_name(
            labware_id=self._labware_id
        )

    # TODO(mc, 2021-05-03): this is an internal dictionary of Opentrons-specific
    # data; does it really need to be a public property? Can we expose the
    # definition and call it a day?
    @property
    def parameters(self) -> LabwareParameters:  # noqa: D102
        definition = self._engine_client.state.labware.get_labware_definition(
            labware_id=self._labware_id
        )
        return cast(LabwareParameters, definition.parameters.dict())

    # TODO(mc, 2021-05-03): this is an internal list of Opentrons-specific
    # data; does it really need to be a public property? Can we expose the
    # definition and call it a day?
    @property
    def quirks(self) -> List[str]:  # noqa: D102
        return self._engine_client.state.labware.get_quirks(labware_id=self._labware_id)

    # TODO(mc, 2021-05-03): this property appears to be primarily for magdeck
    # operational logic, and its presence in this interface is no longer
    # necessary with Protocol Engine controlling execution. Can we get rid of it?
    @property
    def magdeck_engage_height(self) -> Optional[float]:    # noqa: D102
        definition = self._engine_client.state.labware.get_labware_definition(
            labware_id=self._labware_id
        )
        return definition.parameters.magneticModuleEngageHeight

    @property
    def calibrated_offset(self) -> Point:
        """The location of the labware's front-bottom-left corner in deck coordinates.

        This value takes into account the labware's calibration data.
        """
        return self._engine_client.state.geometry.get_labware_position(
            labware_id=self._labware_id
        )

    @property
    def highest_z(self) -> float:
        """The z-coordinate of the highest point on the labware.

        This value takes into account the labware's definition as well
        as its calibration data.
        """
        return self._engine_client.state.geometry.get_labware_highest_z(
            labware_id=self._labware_id
        )

    # TODO(mc, 2021-05-03): encode this in a specific `TipRack` interface that
    # extends from Labware
    @property
    def is_tiprack(self) -> bool:
        """Whether this labware is a tiprack."""
        definition = self._engine_client.state.labware.get_labware_definition(
            labware_id=self._labware_id
        )
        return definition.parameters.isTiprack

    # TODO(mc, 2021-05-03): encode this in a specific `TipRack` interface that
    # extends from Labware
    # TODO(mc, 2021-05-03): this property appears to be primarily for pipette
    # operational logic, and its presence in this interface is no longer
    # necessary with Protocol Engine controlling execution. Does it need to be
    # public? Can we expose the definition and call it a day?
    # TODO(mc, 2021-05-03): document removal of tip_length setter
    @property
    def tip_length(self) -> float:
        """The nominal length of tips if this labware is a tiprack.

        Raises:
            LabwareIsNotTipRackError: will raise if this property is accessed
                on a labware instance that is not a tip rack.
        """
        definition = self._engine_client.state.labware.get_labware_definition(
            labware_id=self._labware_id
        )
        if definition.parameters.tipLength is None:
            raise LabwareIsNotTipRackError(f"{self.load_name} is not a tip rack.")
        return definition.parameters.tipLength

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
# todo(MC, 2021-05-04): In support of those free functions, there are two
# errors defined: `TipSelectionError` and `OutOfTipsError`. We need to figure
# out if we need them, too.
