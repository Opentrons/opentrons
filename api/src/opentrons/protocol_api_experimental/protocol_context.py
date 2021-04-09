# noqa: D100
# Todo: Move to different top-level dir for different linting and typing rules

# Notable differences between legacy context:
# Mount must be a str
# No implicit Optional[List]

import typing

from .instrument_context import InstrumentContext
from .labware import Labware


class ProtocolContext:
    # noqa: D101

    def load_instrument(
        self,
        instrument_name: str,
        mount: str,
        tip_racks: typing.Sequence[typing.Any] = tuple(),  # Todo: Tip rack type
        replace: bool = False
    ) -> InstrumentContext:
        # noqa: D102
        raise NotImplementedError()

    def load_labware(self) -> Labware:
        # noqa: D102
        raise NotImplementedError()

    # All else todo
