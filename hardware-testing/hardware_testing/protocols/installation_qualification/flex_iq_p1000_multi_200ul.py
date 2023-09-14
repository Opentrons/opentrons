"""Flex IQ: P1000 Multi 200ul."""
from math import pi
from typing import List

from opentrons.protocol_api import ProtocolContext, InstrumentContext, Labware

metadata = {"protocolName": "Flex IQ: P1000 Multi 200ul"}
requirements = {"robotType": "Flex", "apiLevel": "2.15"}

TEST_VOLUME = 200
DUT = "p1000_multi_gen3"
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

SRC_LABWARE_BY_CHANNELS = {
    1: "nest_96_wellplate_2ml_deep",
    8: "nest_12_reservoir_15ml",
    96: "nest_1_reservoir_195ml"
}

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


def _start_volumes_per_trial(volume: float, load_name: str, channels: int, trials: int) -> List[float]:
    ul_per_aspirate = volume * channels
    ul_per_run = ul_per_aspirate * trials
    ul_at_start = ul_per_run + MIN_VOL_SRC[load_name]
    return [
        ul_at_start - (ul_per_aspirate * i)
        for i in range(trials)
    ]


def _dye_start_volumes_per_trial(load_name: str, channels: int, trials: int) -> List[float]:
    return _start_volumes_per_trial(TEST_VOLUME, load_name, channels, trials)


def _diluent_start_volumes_per_trial(load_name: str, trials: int) -> List[float]:
    return _start_volumes_per_trial(max(200 - TEST_VOLUME, 0), load_name, 8, trials)


def _assign_starting_volumes_dye(
        ctx: ProtocolContext,
        pipette: InstrumentContext,
        reservoir: Labware,
) -> None:
    dye = ctx.define_liquid(
        name="Dye",
        description="Dye range for test volume",
        display_color="#FF0000",
    )
    for test in TEST_SOURCES:
        src_ul_per_trial = _dye_start_volumes_per_trial(
            reservoir.load_name, pipette.channels, len(test["destinations"])
        )
        first_trial_ul = src_ul_per_trial[0]
        reservoir[test["source"]].load_liquid(dye, first_trial_ul)


def _assign_starting_volumes_diluent(
        ctx: ProtocolContext,
        pipette: InstrumentContext,
        reservoir: Labware,
) -> None:
    if TEST_VOLUME >= 200:
        return
    diluent = ctx.define_liquid(
        name="Diluent",
        description="Diluent",
        display_color="#0000FF",
    )
    if pipette.channels == 1:
        num_transfers_per_source_well = 1
    else:
        num_transfers_per_source_well = 6
    source_wells = ["A11", "A12"]
    for well in source_wells:
        src_ul_per_trial = _diluent_start_volumes_per_trial(
            reservoir.load_name, num_transfers_per_source_well
        )
        first_trial_ul = src_ul_per_trial[0]
        reservoir[well].load_liquid(diluent, first_trial_ul)


def _transfer(
        volume: float,
        pipette: InstrumentContext,
        reservoir: Labware,
        plate: Labware,
        source: str, destinations: List[str],
        same_tip: bool = False
) -> None:
    src_ul_per_trial = _diluent_start_volumes_per_trial(
        reservoir.load_name, len(destinations)
    )
    src_heights = [_ul_to_mm(reservoir.load_name, ul) for ul in src_ul_per_trial]
    dst_height = _ul_to_mm(plate.load_name, volume)
    if same_tip and not pipette.has_tip:
        pipette.pick_up_tip()
    for dst_name, height_src in zip(destinations, src_heights):
        # calculate pipetting positions
        aspirate_pos = reservoir[source].bottom(height_src - SUBMERGE_MM)
        dispense_pos = plate[dst_name].bottom(dst_height - SUBMERGE_MM)
        blow_out_pos = plate[dst_name].bottom(dst_height + RETRACT_MM)
        # transfer
        if not same_tip:
            pipette.pick_up_tip()
        pipette.aspirate(TEST_VOLUME, aspirate_pos)
        pipette.dispense(TEST_VOLUME, dispense_pos)
        pipette.blow_out(blow_out_pos)
        if not same_tip:
            pipette.drop_tip()


def _transfer_diluent(pipette: InstrumentContext, reservoir: Labware, plate: Labware) -> None:
    diluent_vol = 200 - TEST_VOLUME
    if diluent_vol <= 0:
        return
    target_cols = set([
        dst[1:]
        for test in TEST_SOURCES
        for dst in test["destinations"]
    ])
    destinations = [f"A{col}" for col in target_cols]
    pipette.pick_up_tip()
    for i, dst in enumerate(destinations):
        if i < len(destinations) / 2:
            src = "A11"
        else:
            src = "A12"
        _transfer(diluent_vol, pipette, reservoir, plate, src, destinations, same_tip=True)
    pipette.drop_tip()


def _transfer_dye(pipette: InstrumentContext, reservoir: Labware, plate: Labware) -> None:
    for test in TEST_SOURCES:
        _transfer(TEST_VOLUME, pipette, reservoir, plate, test["source"], test["destinations"])


def run(ctx: ProtocolContext) -> None:
    dye_pipette = ctx.load_instrument(
        DUT,
        "left",
        tip_racks=[ctx.load_labware("opentrons_flex_96_tiprack_200uL", "D1")]
    )
    plate = ctx.load_labware("corning_96_wellplate_360ul_flat", "D3")
    reservoir_dye = ctx.load_labware(SRC_LABWARE_BY_CHANNELS[dye_pipette.channels], "D2")
    _assign_starting_volumes_dye(ctx, dye_pipette, reservoir_dye)
    if TEST_VOLUME < 200:
        diluent_pipette = ctx.load_instrument(
            "p1000_multi_gen3",
            "right",
            tip_racks=[ctx.load_labware("opentrons_flex_96_tiprack_200uL", "C1")]
        )
        if dye_pipette.channels == 8:
            reservoir_diluent = reservoir_dye
        else:
            reservoir_diluent = ctx.load_labware(
                SRC_LABWARE_BY_CHANNELS[diluent_pipette.channels], "C2"
            )
        _assign_starting_volumes_diluent(ctx, dye_pipette, reservoir_diluent)
        _transfer_diluent(diluent_pipette, reservoir_diluent, plate)
    _transfer_dye(dye_pipette, reservoir_dye, plate)


