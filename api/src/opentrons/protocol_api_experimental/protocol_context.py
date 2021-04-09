# noqa: D100

import typing

import opentrons.types
from opentrons.protocols import api_support
from opentrons.protocols.api_support.util import AxisMaxSpeeds
if typing.TYPE_CHECKING:
    from opentrons_shared_data.labware.dev_types import LabwareDefinition

from .instrument_context import InstrumentContext
from .labware import Labware


class ProtocolContext:
    # noqa: D101

    @property
    def api_version(self) -> api_support.types.APIVersion:
        # noqa: D102
        raise NotImplementedError()

    @property
    def max_speeds(self) -> AxisMaxSpeeds:
        # noqa: D102
        raise NotImplementedError()

    def is_simulating(self) -> bool:
        # noqa: D102
        raise NotImplementedError()

    def load_labware_from_definition(
        self,
        # todo(mm, 2021-04-09): LabwareDefinition comes from shared_data,
        # I think. Should we do anything to make this more user-friendly in the
        # docs? Should this function even be user-facing?
        labware_def: 'LabwareDefinition',
        location: opentrons.types.DeckLocation,
        label: typing.Optional[str] = None
    ) -> Labware:
        # noqa: D102
        raise NotImplementedError()

    def load_labware(
        self,
        load_name: str,
        location: opentrons.types.DeckLocation,
        label: typing.Optional[str] = None,
        namespace: typing.Optional[str] = None,
        version: typing.Optional[int] = None,
    ) -> Labware:
        # noqa: D102
        raise NotImplementedError()

    @property
    def loaded_labwares(self) -> typing.Dict[int, Labware]:
        # noqa: D102
        # Changes from APIv2:
        #   * Values in return dict changed from Union[Labware, ModuleGeometry]
        #     to just Labware, because that's what the docs say this method
        #     does?
        raise NotImplementedError()

    # todo(mm, 2021-04-09): Change from typing.Any to a more specific module type
    # when we have those types in this package.
    def load_module(
        self,
        module_name: str,
        location: typing.Optional[opentrons.types.DeckLocation] = None,
        configuration: typing.Optional[str] = None
    ) -> typing.Any:
        # noqa: D102
        raise NotImplementedError()

    # todo(mm, 2021-04-09): Change from typing.Any to a more specific module type
    # when we have those types in this package.
    @property
    def loaded_modules(self) -> typing.Dict[int, typing.Any]:
        # noqa: D102
        raise NotImplementedError()

    def load_instrument(
        self,
        instrument_name: str,
        mount: str,
        tip_racks: typing.Sequence[Labware] = tuple(),
        replace: bool = False
    ) -> InstrumentContext:
        # noqa: D102
        # Changes from APIv2:
        #   * mount must be a str, not types.Mount.
        #   * tip_racks is a Sequence[Labware] defaulting to empty, not an
        #     implicitly optional List[Labware].
        raise NotImplementedError()

    @property
    def loaded_instruments(self) -> typing.Dict[str, InstrumentContext]:
        # noqa: D102
        # Changes from APIv2:
        #   * Optional[InstrumentContext] changed to InstrumentContext,
        #     because that's what the docs specify?
        raise NotImplementedError()

    # todo(mm, 2021-04-09): Figure out a suitable type annotation for msg.
    def pause(self, msg=None) -> None:
        # noqa: D102
        raise NotImplementedError()

    def resume(self) -> None:
        # noqa: D102
        raise NotImplementedError()

    # todo(mm, 2021-04-09): Figure out a suitable type annotation for msg.
    def comment(self, msg=None) -> None:
        # noqa: D102
        raise NotImplementedError()

    # todo(mm, 2021-04-09): Add all other public methods from the APIv2
    # ProtocolContext.

    # Omitted...
    #
    # Appears on docs.opentrons.com but is not versioned:
    #   * build_using()
    #   * cleanup()
    #   * temp_connect()
    #
    # Appears on docs.opentrons.com, is versioned, but underspecified--users
    # probably couldn't actually use this
    #   * bundled_data() (overall feature never left experimental stage;)
    #   * commands()
    #   * clear_commands()
    #   * connect()
    #   * disonnect()
    #
    # Deprecated, but not documented as deprecated:
    #   * load_labware_by_name()
