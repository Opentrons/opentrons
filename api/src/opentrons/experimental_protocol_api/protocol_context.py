# Todo: Move to different top-level dir for different linting and typing rules

# Notable differences between legacy context:
# Mount must be a str
# No implicit Optional[List]

import typing


class ProtocolContext:
    def load_instrument(
        self,
        instrument_name: str,
        mount: str,
        tip_racks: typing.Sequence[typing.Any] = tuple(),  # Todo: Tip rack type
        replace: bool
    ):
        raise NotImplementedError()
    
    def load_labware():
        raise NotImplementedError()
    
    # All else todo


        
