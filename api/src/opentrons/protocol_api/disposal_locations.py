from __future__ import annotations

from dataclasses import dataclass
from typing_extensions import Protocol as TypingProtocol

from opentrons.types import DeckSlotName
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.api_support.util import requires_version
from opentrons.protocol_engine.clients import SyncClient


# TODO(jbl 2024-02-26) these are hardcoded here since there is a 1 to many relationship going from
#   addressable area names to cutout fixture ids. Currently for trash and waste chute this would not be
#   an issue (trash has only one fixture that provides it, all waste chute fixtures are the same height).
#   The ultimate fix for this is a multiple pass analysis, so for now these are being hardcoded to avoid
#   writing cumbersome guessing logic for area name -> fixture name while still providing a direct link to
#   the numbers in shared data.
_TRASH_BIN_CUTOUT_FIXTURE = "trashBinAdapter"
_TRASH_BIN_OT2_CUTOUT_FIXTURE = "fixedTrashSlot"
_WASTE_CHUTE_CUTOUT_FIXTURE = "wasteChuteRightAdapterCovered"


@dataclass(frozen=True)
class DisposalOffset:
    x: float
    y: float
    z: float


class _DisposalLocation(TypingProtocol):
    """Abstract class for disposal location."""

    def top(self, x: float = 0, y: float = 0, z: float = 0) -> _DisposalLocation:
        """Returns a disposal location with a user set offset."""
        ...

    @property
    def offset(self) -> DisposalOffset:
        """Offset of the disposal location.

        :meta private:

        This is intended for Opentrons internal use only and is not a guaranteed API.
        """
        ...

    @property
    def location(self) -> DeckSlotName:
        """Location of the disposal location.

        :meta private:

        This is intended for Opentrons internal use only and is not a guaranteed API.
        """
        ...

    @property
    def area_name(self) -> str:
        """Addressable area name of the disposal location.

        :meta private:

        This is intended for Opentrons internal use only and is not a guaranteed API.
        """
        ...

    @property
    def height(self) -> float:
        """Height of the disposal location.

        :meta private:

        This is intended for Opentrons internal use only and is not a guaranteed API.
        """
        ...


class TrashBin(_DisposalLocation):
    """Represents a Flex or OT-2 trash bin.

    See :py:meth:`.ProtocolContext.load_trash_bin`.
    """

    def __init__(
        self,
        location: DeckSlotName,
        addressable_area_name: str,
        engine_client: SyncClient,
        api_version: APIVersion,
        offset: DisposalOffset = DisposalOffset(x=0, y=0, z=0),
    ) -> None:
        self._location = location
        self._addressable_area_name = addressable_area_name
        self._offset = offset
        self._api_version = api_version
        self._engine_client = engine_client
        if self._engine_client.state.config.robot_type == "OT-2 Standard":
            self._cutout_fixture_name = _TRASH_BIN_OT2_CUTOUT_FIXTURE
        else:
            self._cutout_fixture_name = _TRASH_BIN_CUTOUT_FIXTURE

    @requires_version(2, 18)
    def top(self, x: float = 0, y: float = 0, z: float = 0) -> TrashBin:
        """Add a location offset to a trash bin.

        The default location (``x``, ``y``, and ``z`` all set to ``0``) is the center of
        the bin on the x- and y-axes, and slightly below its physical top on the z-axis.

        Offsets can be positive or negative and are measured in mm.
        See :ref:`protocol-api-deck-coords`.
        """
        return TrashBin(
            location=self._location,
            addressable_area_name=self._addressable_area_name,
            engine_client=self._engine_client,
            api_version=self._api_version,
            offset=DisposalOffset(x=x, y=y, z=z),
        )

    @property
    def offset(self) -> DisposalOffset:
        """Current offset of the trash bin.

        :meta private:

        This is intended for Opentrons internal use only and is not a guaranteed API.
        """
        return self._offset

    @property
    def location(self) -> DeckSlotName:
        """Location of the trash bin.

        :meta private:

        This is intended for Opentrons internal use only and is not a guaranteed API.
        """
        return self._location

    @property
    def area_name(self) -> str:
        """Addressable area name of the trash bin.

        :meta private:

        This is intended for Opentrons internal use only and is not a guaranteed API.
        """
        return self._addressable_area_name

    @property
    def height(self) -> float:
        """Height of the trash bin.

        :meta private:

        This is intended for Opentrons internal use only and is not a guaranteed API.
        """
        return self._engine_client.state.addressable_areas.get_fixture_height(
            self._cutout_fixture_name
        )


class WasteChute(_DisposalLocation):
    """Represents a Flex waste chute.

    See :py:meth:`.ProtocolContext.load_waste_chute`.
    """

    def __init__(
        self,
        engine_client: SyncClient,
        api_version: APIVersion,
        offset: DisposalOffset = DisposalOffset(x=0, y=0, z=0),
    ) -> None:
        self._engine_client = engine_client
        self._api_version = api_version
        self._offset = offset

    @requires_version(2, 18)
    def top(self, x: float = 0, y: float = 0, z: float = 0) -> WasteChute:
        """Add a location offset to a waste chute.

        The default location (``x``, ``y``, and ``z`` all set to ``0``) is the center of
        the chute's opening on the x- and y-axes, and slightly below its physical top
        on the z-axis. See :ref:`configure-waste-chute` for more information on possible
        configurations of the chute.

        Offsets can be positive or negative and are measured in mm.
        See :ref:`protocol-api-deck-coords`.
        """
        return WasteChute(
            engine_client=self._engine_client,
            api_version=self._api_version,
            offset=DisposalOffset(x=x, y=y, z=z),
        )

    @property
    def offset(self) -> DisposalOffset:
        """Current offset of the waste chute.

        :meta private:

        This is intended for Opentrons internal use only and is not a guaranteed API.
        """
        return self._offset

    @property
    def location(self) -> DeckSlotName:
        """Location of the waste chute.

        :meta private:

        This is intended for Opentrons internal use only and is not a guaranteed API.
        """
        return DeckSlotName.SLOT_D3

    @property
    def area_name(self) -> str:
        """Addressable area name of the waste chute.

        :meta private:

        This is intended for Opentrons internal use only and is not a guaranteed API.
        """
        # TODO(jbl 2024-02-06) this is hardcoded here and should be removed when a multiple pass analysis exists
        #
        # We want to tell Protocol Engine that there's a waste chute in the waste chute location when it's loaded,
        # so analysis can prevent the user from doing anything that would collide with it. At the same time, we
        # do not want to create a false negative when it comes to addressable area conflict. We therefore use the
        # addressable area `1ChannelWasteChute` because every waste chute cutout fixture provides it and it will
        # provide the engine with the information it needs.
        return "1ChannelWasteChute"

    @property
    def height(self) -> float:
        """Height of the waste chute.

        :meta private:

        This is intended for Opentrons internal use only and is not a guaranteed API.
        """
        return self._engine_client.state.addressable_areas.get_fixture_height(
            _WASTE_CHUTE_CUTOUT_FIXTURE
        )
