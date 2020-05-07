import enum
from itertools import groupby
from typing import List, Optional
from opentrons.hardware_control.types import BoardRevision


class GpioQueueEvents(enum.Enum):
    EVENT_RECEIVED = enum.auto()
    QUIT = enum.auto()


class PinDir(enum.Enum):
    rev_input = enum.auto()
    input = enum.auto()
    output = enum.auto()


class GPIOPin:

    @classmethod
    def build(cls, name: str, in_out: PinDir, pin: int):
        # use this method if the pin number is the same
        # across all board revisions
        return cls(name, in_out, rev_og=pin,
                   rev_a=pin, rev_b=pin, rev_c=pin)

    @classmethod
    def build_with_rev(cls, name: str, in_out: PinDir,
                       **kwargs):
        return cls(name, in_out, **kwargs)

    def __init__(self, name: str, in_out: PinDir,
                 rev_og: Optional[int] = None,
                 rev_a: Optional[int] = None,
                 rev_b: Optional[int] = None,
                 rev_c: Optional[int] = None):
        self.name = name
        self.in_out = in_out
        self.rev_og = rev_og
        self.rev_a = rev_a
        self.rev_b = rev_b
        self.rev_c = rev_c

    def by_board_rev(self, board_rev: BoardRevision):
        ref = {
            BoardRevision.OG: self.rev_og,
            BoardRevision.A: self.rev_a,
            BoardRevision.B: self.rev_b,
            BoardRevision.C: self.rev_c,
            BoardRevision.UNKNOWN: self.rev_og}
        return ref[board_rev]


class GPIOList(list):
    def __getattr__(self, item):
        return next(filter(lambda x: x.name is item, self), None)

    def by_type(self, pin_dir: PinDir):
        return GPIOList(filter(lambda x: x.in_out is pin_dir, self))

    def by_names(self, names: List[str]):
        return GPIOList(filter(lambda x: x.name in names, self))

    def group_by_pins(self, board_rev: BoardRevision) -> List:
        c = groupby(self, key=lambda x: x.by_board_rev(board_rev))
        l: list = []
        for k, v in c:
            l.append(list(v))
        return l


gpio_list = GPIOList(
    [
        # revision pins (input)
        GPIOPin.build('rev_0', PinDir.rev_input, 17),
        GPIOPin.build('rev_1', PinDir.rev_input, 27),
        # output pins
        GPIOPin.build('frame_leds', PinDir.output, 6),
        GPIOPin.build('blue_button', PinDir.output, 13),
        GPIOPin.build('halt', PinDir.output, 18),
        GPIOPin.build('green_button', PinDir.output, 19),
        GPIOPin.build('audio_enable', PinDir.output, 21),
        GPIOPin.build('isp', PinDir.output, 23),
        GPIOPin.build('reset', PinDir.output, 24),
        GPIOPin.build('red_button', PinDir.output, 26),
        # input pins
        GPIOPin.build('button_input', PinDir.input, 5),
        GPIOPin.build_with_rev('door_sw_filt', PinDir.input,
                               rev_og=20, rev_a=12),
        GPIOPin.build_with_rev('window_sw_filt', PinDir.input,
                               rev_og=20, rev_a=16),
        GPIOPin.build('window_door_sw', PinDir.input, 20)
    ]
)
