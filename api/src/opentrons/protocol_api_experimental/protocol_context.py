# noqa: D100

import typing

from .instrument_context import InstrumentContext
from .labware import Labware


class ProtocolContext:  # noqa: D101

    def load_instrument(  # noqa: D102
        self,
        instrument_name: str,
        mount: str,
        tip_racks: typing.Sequence[Labware] = tuple(),
        replace: bool = False
    ) -> InstrumentContext:
        # Changes from APIv2:
        #   * mount must be a str, not types.Mount.
        #   * tip_racks is a Sequence[Labware] defaulting to empty, not an
        #     implicitly optional List[Labware].
        raise NotImplementedError()

    def load_labware(self) -> Labware:  # noqa: D102
        raise NotImplementedError()

    # todo(mm, 2021-04-09): Add all other public methods from the APIv2
    # ProtocolContext.
