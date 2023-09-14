"""Flex IQ: P1000 Multi 200ul."""
from math import pi
from typing import List

from opentrons.protocol_api import ProtocolContext

metadata = {"protocolName": "Flex IQ: P1000 Multi 200ul"}
requirements = {"robotType": "Flex", "apiLevel": "2.15"}

TEST_VOLUME = 200
DUT = "p1000_multi_gen3"
SOURCE = "nest_12_reservoir_15ml"
TEST_SOURCES = [
    {
        "source": "A1",
        "destinations": ["A1", "A2", "A3", "A4", "A5", "A6"],
    },
    {
        "source": "A2",
        "destinations": ["A7", "A8", "A9", "A10", "A11", "A12"],
    }
]

SUBMERGE_MM = 1.5
RETRACT_MM = 5.0

MIN_VOL_SRC = {
    "nest_96_wellplate_2ml_deep": 500,
    "nest_12_reservoir_15ml": 3000,
    "nest_1_reservoir_195ml": 30000,
}


class LiquidHeightInFlatBottomWell:

    def __init__(
            self,
            bottom_diameter: float,
            top_diameter: float,
            height: float,
            resolution_mm: float = 0.1
    ) -> None:
        self._bottom_radius = bottom_diameter / 2
        self._top_radius = top_diameter / 2
        self._height = height
        self._resolution_mm = resolution_mm

    def _volume_of_frustum(self, surface_height: float, surface_radius: float) -> float:
        """Calculate the volume of a frustum given its height and radii."""
        a = pi * self._bottom_radius * surface_radius
        b = pi * surface_radius**2
        c = pi * self._bottom_radius**2
        return (a + b + c) * (surface_height / 3)

    def height_from_volume(self, volume: float) -> float:
        """Given the volume, compute the height of the liquid in the well."""
        _rad_diff = self._top_radius - self._bottom_radius
        low, high = 0, self._height
        while high - low > self._resolution_mm:
            mid = (low + high) / 2
            r_mid = self._bottom_radius + (mid / self._height) * _rad_diff
            if self._volume_of_frustum(mid, r_mid) < volume:
                low = mid
            else:
                high = mid
        return (low + high) / 2

    def volume_from_height(self, height: float) -> float:
        """Given the height, compute the volume of the liquid in the well."""
        _rel_height = height / self._height
        _rad_diff = self._top_radius - self._bottom_radius
        surface_radius = self._bottom_radius + _rad_diff * _rel_height
        return self._volume_of_frustum(height, surface_radius)


LIQUID_HEIGHT_LOOKUP = {
    "nest_1_reservoir_195ml": [
        (0, 0),
        (195000, 25)
    ],
    "nest_12_reservoir_15ml": [
        (0, 0),
        (300, 1),
        (600, 2),
        (900, 3),
        (1400, 4),
        (1900, 5),
        (2500, 6),
        (3076, 7),
        (3651, 8),
        (4227, 9),
        (4802, 10),
        (5378, 11),
        (5953, 12),
        (6529, 13),
        (7104, 14),
        (7680, 15),
        (8255, 16),
        (8831, 17),
        (9406, 18),
        (9982, 19),
        (10558, 20),
        (11133, 21),
        (11709, 22),
        (12284, 23),
        (12860, 24),
        (13435, 25),
        (14500, 26.85),
    ],
    "nest_96_wellplate_2ml_deep": [
        (0, 0),
        (2000, 38)
    ],
}


def _ul_to_mm(load_name: str, ul: float) -> float:
    if load_name in LIQUID_HEIGHT_LOOKUP:
        lookup = LIQUID_HEIGHT_LOOKUP[load_name]
        for i in range(len(lookup) - 1):
            low = lookup[i]
            high = lookup[i + 1]
            if ul > low[0]:
                ul_scale = (ul - low[0]) / (high[0] - low[0])
                return (ul_scale * (high[1] - low[1])) + low[1]
    elif load_name == "corning_96_wellplate_360ul_flat":
        well = LiquidHeightInFlatBottomWell(
            bottom_diameter=6.35, top_diameter=6.858, height=10.668
        )
        return well.height_from_volume(ul)
    raise ValueError(f"unable to find height of {ul:.1} ul in {load_name}")


def _dye_heights_per_trial(load_name: str, channels: int, trials: int) -> List[float]:
    ul_per_aspirate = TEST_VOLUME * channels
    ul_per_run = ul_per_aspirate * trials
    ul_at_start = ul_per_run + MIN_VOL_SRC[load_name]
    ul_per_trial = [
        ul_at_start - (ul_per_aspirate * i)
        for i in range(trials)
    ]
    mm_per_trial = [
        _ul_to_mm(load_name, ul)
        for ul in ul_per_trial
    ]
    return mm_per_trial


def run(ctx: ProtocolContext) -> None:
    reservoir = ctx.load_labware(SOURCE, "D2")
    plate = ctx.load_labware("corning_96_wellplate_360ul_flat", "D3")
    tip_rack_200 = ctx.load_labware("opentrons_flex_96_tiprack_200uL", "D1")
    dut = ctx.load_instrument(DUT, "left", tip_racks=[tip_rack_200])

    for test in TEST_SOURCES:
        src_heights = _dye_heights_per_trial(
            reservoir.load_name, dut.channels, len(test["destinations"])
        )
        dst_height = _ul_to_mm(plate.load_name, 200)  # always ends at 200ul
        for dst_name, height_src in zip(test["destinations"], src_heights):
            # calculate pipetting positions
            aspirate_pos = reservoir[test["source"]].bottom(height_src - SUBMERGE_MM)
            dispense_pos = plate[dst_name].bottom(dst_height - SUBMERGE_MM)
            blow_out_pos = plate[dst_name].bottom(dst_height + RETRACT_MM)
            # transfer
            dut.pick_up_tip()
            dut.aspirate(TEST_VOLUME, aspirate_pos)
            dut.dispense(TEST_VOLUME, dispense_pos)
            dut.blow_out(blow_out_pos)
            dut.drop_tip()
