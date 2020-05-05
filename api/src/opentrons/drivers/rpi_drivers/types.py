import enum
from collections import defaultdict
from typing import Dict, List, Union
from opentrons.hardware_control.types import BoardRevision


class Pins(enum.Enum):
    def __str__(self):
        return self.name


class OutputPins(Pins):
    frame_leds = 6
    blue_button = 13
    halt = 18
    green_button = 19
    audio_enable = 21
    isp = 23
    reset = 24
    red_button = 26


class RevPins(Pins):
    rev_0 = 17
    rev_1 = 27


class InputPins(Pins):
    button_input = {
        BoardRevision.OG: 5,
        BoardRevision.A: 5,
        BoardRevision.B: None,
        BoardRevision.C: None
    }
    door_sw_filt = {
        BoardRevision.OG: 20,
        BoardRevision.A: 12,
        BoardRevision.B: None,
        BoardRevision.C: None
    }
    window_sw_filt = {
        BoardRevision.OG: 20,
        BoardRevision.A: 16,
        BoardRevision.B: None,
        BoardRevision.C: None
    }
    window_door_sw = {
        BoardRevision.OG: 20,
        BoardRevision.A: 20,
        BoardRevision.B: None,
        BoardRevision.C: None
    }

    @classmethod
    def by_board_rev(cls, board_rev):
        return {input.name: input.value[board_rev]
                for input in list(InputPins)}


def group_by_gpio(
        input_dict: Dict[str, int]) -> Dict[int, List[str]]:
    d: Dict[int, List[str]] = defaultdict(list)
    for key, value in sorted(input_dict.items()):
        d[value].append(key)
    return d


GPIOPins = Union[OutputPins, RevPins, InputPins]
