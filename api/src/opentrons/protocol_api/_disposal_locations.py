from __future__ import annotations

from typing_extensions import Protocol as TypingProtocol

from opentrons.types import DeckSlotName, Point
from opentrons.protocol_engine.clients import SyncClient


# TODO(jbl 2024-02-26) these are hardcoded here since there is a 1 to many relationship going from
#   addressable area names to cutout fixture ids. Currently for trash and waste chute this would not be
#   an issue (trash has only one fixture that provides it, all waste chute fixtures are the same height).
#   The ultimate fix for this is a multiple pass analysis, so for now these are being hardcoded to avoid
#   writing cumbersome guessing logic for area name -> fixture name while still providing a direct link to
#   the numbers in shared data.
_TRASH_BIN_CUTOUT_FIXTURE = "trashBinAdapter"
_WASTE_CHUTE_CUTOUT_FIXTURE = "wasteChuteRightAdapterCovered"


class DisposalLocation(TypingProtocol):
    """Abstract class for disposal location."""

    def top(self, x: float = 0, y: float = 0, z: float = 0) -> DisposalLocation:
        """Returns a disposal location with a user set offset."""
        ...

    @property
    def offset(self) -> Point:
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


class TrashBin(DisposalLocation):
    """Represents a Flex or OT-2 trash bin.

    See :py:meth:`.ProtocolContext.load_trash_bin`.
    """

    def __init__(
        self,
        location: DeckSlotName,
        addressable_area_name: str,
        engine_client: SyncClient,
        offset: Point = Point(x=0, y=0, z=0),
    ) -> None:
        self._location = location
        self._addressable_area_name = addressable_area_name
        self._offset = offset
        self._engine_client = engine_client

    def top(self, x: float = 0, y: float = 0, z: float = 0) -> TrashBin:
        """Returns a trash bin with a user set offset."""
        return TrashBin(
            self._location,
            self._addressable_area_name,
            self._engine_client,
            Point(x=x, y=y, z=z),
        )

    @property
    def offset(self) -> Point:
        """Current offset of the trash bin..

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
            _TRASH_BIN_CUTOUT_FIXTURE
        )


class WasteChute(DisposalLocation):
    """Represents a Flex waste chute.

    See :py:meth:`.ProtocolContext.load_waste_chute`.
    """

    def __init__(self, engine_client: SyncClient, offset: Point = Point()) -> None:
        self._engine_client = engine_client
        # TODO maybe make this some sort of offset vector
        self._offset = offset

    def top(self, x: float = 0, y: float = 0, z: float = 0) -> WasteChute:
        """Returns a waste chute with a user set offset."""
        return WasteChute(self._engine_client, Point(x=x, y=y, z=z))

    @property
    def offset(self) -> Point:
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
        # TODO(jbl 2024-02-06) this is hardcoded here because every possible waste chute combination contains
        #    a 1ChannelWasteChute.
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
