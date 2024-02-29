"""Flex: Diluent using 96ch."""
from math import pi
from typing import List, Optional, Dict, Tuple

from opentrons.protocol_api import ProtocolContext, InstrumentContext, Labware

##############################################
#                EDIT - START                #
##############################################

# FIXME: make these variables configurable through RUNTIME-VARIABLES

metadata = {"protocolName": "Flex: Diluent using 96ch"}
requirements = {"robotType": "Flex", "apiLevel": "2.15"}

NUM_PLATES = 5
CHANGE_TIP = False
RETURN_TIP = False
FILL_MULTIPLE_PLATES = True

PIPETTE_NAME = "flex_96channel_1000"
RESERVOIR_NAME = "nest_1_reservoir_195ml"

LIQUID_NAME = "Diluent"
LIQUID_DESCRIPTION = "Artel MVS Diluent"
LIQUID_COLOR = "#0000FF"

TARGET_VOLUME = 195
TARGET_PUSH_OUT = 15
TARGET_SOURCES = [
    {
        "source": "A1",
        "destinations": ["A1"],
    }
]

##############################################
#                 EDIT - END                 #
##############################################

SUBMERGE_MM = {
    "aspirate": 3.0,
    "dispense": 1.0,
}
RETRACT_MM = 5.0
MIN_MM_FROM_BOTTOM = 1.0

TOUCH_TIP_SPEED = 30
TOUCH_TIP_DEPTH = -1

DELAY_ASPIRATE = 1.0
DELAY_DISPENSE = 0.5

MIN_VOL_SRC = {
    "nest_96_wellplate_2ml_deep": 500,
    "nest_12_reservoir_15ml": 3000,
    "nest_1_reservoir_195ml": 30000,
}


class _LiquidHeightInFlatBottomWell:
    def __init__(
        self,
        bottom_diameter: float,
        top_diameter: float,
        height: float,
        resolution_mm: float = 0.1,
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
        low, high = 0.0, self._height
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


LIQUID_HEIGHT_LOOKUP: Dict[str, List[Tuple[float, float]]] = {
    "nest_12_reservoir_15ml": [
        (0, 0),
        (3000, 6.0),
        (3500, 7.0),
        (4000, 8.0),
        (5500, 10.5),
        (8000, 14.7),
        (10000, 18.0),
        (12600, 22.5),
        (15000, 26.85),  # full depth of well
    ],
    "nest_1_reservoir_195ml": [
        (0, 0.0),
        (20000, 1.71),
        (30000, 3.31),
        (40000, 4.61),
        (50000, 5.82),
        (60000, 7.31),
        (70000, 8.51),
        (80000, 9.82),
        (100000, 12.32),
        (120000, 15.11),
        (140000, 17.71),
        (160000, 20.32),
        (180000, 22.91),
        (195000, 25.0),
    ],
}


def _convert_ul_in_well_to_height_in_well(load_name: str, ul: float) -> float:
    if load_name in LIQUID_HEIGHT_LOOKUP:
        lookup = LIQUID_HEIGHT_LOOKUP[load_name]
        for i in range(len(lookup) - 1):
            low = lookup[i]
            high = lookup[i + 1]
            if low[0] <= ul <= high[0]:
                ul_scale = (ul - low[0]) / (high[0] - low[0])
                return (ul_scale * (high[1] - low[1])) + low[1]
    elif load_name == "corning_96_wellplate_360ul_flat":
        well = _LiquidHeightInFlatBottomWell(
            bottom_diameter=6.35, top_diameter=6.858, height=10.668
        )
        return well.height_from_volume(ul)
    raise ValueError(f"unable to find height of {ul} ul in {load_name}")


def _start_volumes_per_trial(
    volume: float, load_name: str, channels: int, trials: int
) -> List[float]:
    ul_per_aspirate = volume * channels
    ul_per_run = ul_per_aspirate * trials
    ul_at_start = ul_per_run + MIN_VOL_SRC[load_name]
    return [ul_at_start - (ul_per_aspirate * i) for i in range(trials)]


def _end_volumes_per_trial(
    volume: float, load_name: str, channels: int, trials: int
) -> List[float]:
    return [
        ul - (volume * channels)
        for ul in _start_volumes_per_trial(volume, load_name, channels, trials)
    ]


def _assign_starting_volumes(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    reservoir: Labware,
) -> None:
    liquid = ctx.define_liquid(
        name=LIQUID_NAME,
        description=LIQUID_DESCRIPTION,
        display_color=LIQUID_COLOR,
    )
    for test in TARGET_SOURCES:
        src_ul_per_trial = _start_volumes_per_trial(
            TARGET_VOLUME,
            reservoir.load_name,
            pipette.channels,
            len(test["destinations"]),
        )
        first_trial_ul = src_ul_per_trial[0]
        reservoir[str(test["source"])].load_liquid(liquid, first_trial_ul)


def _transfer(
    ctx: ProtocolContext,
    volume: float,
    pipette: InstrumentContext,
    reservoir: Labware,
    plate: Labware,
    source: str,
    destinations: List[str],
    push_out: Optional[float] = None,
    touch_tip: bool = False,
    volume_already_in_plate: float = 0,
) -> None:
    end_volumes = _end_volumes_per_trial(
        volume, reservoir.load_name, pipette.channels, len(destinations)
    )
    src_heights = [
        _convert_ul_in_well_to_height_in_well(reservoir.load_name, ul)
        for ul in end_volumes
    ]
    volume_in_plate = volume + volume_already_in_plate
    dst_height = _convert_ul_in_well_to_height_in_well(plate.load_name, volume_in_plate)
    for dst_name, height_src in zip(destinations, src_heights):
        # calculate pipetting positions
        aspirate_pos = reservoir[source].bottom(
            max(height_src - SUBMERGE_MM["aspirate"], MIN_MM_FROM_BOTTOM)
        )
        dispense_pos = plate[dst_name].bottom(
            max(dst_height - SUBMERGE_MM["dispense"], MIN_MM_FROM_BOTTOM)
        )
        blow_out_pos = plate[dst_name].bottom(
            max(dst_height + RETRACT_MM, MIN_MM_FROM_BOTTOM)
        )
        # transfer
        if pipette.current_volume > 0:
            pipette.dispense(pipette.current_volume, reservoir[source].top())
        pipette.aspirate(volume, aspirate_pos)
        ctx.delay(seconds=DELAY_ASPIRATE)
        pipette.dispense(volume, dispense_pos, push_out=push_out)
        ctx.delay(seconds=DELAY_DISPENSE)
        pipette.blow_out(blow_out_pos)
        if touch_tip:
            pipette.touch_tip(speed=TOUCH_TIP_SPEED, v_offset=TOUCH_TIP_DEPTH)
        pipette.aspirate(1, blow_out_pos)  # trailing air-gap to avoid droplets
    pipette.move_to(reservoir[source].top(100))

def run(ctx: ProtocolContext) -> None:
    """Run."""
    if "96channel" in PIPETTE_NAME:
        adapter = "opentrons_flex_96_tiprack_adapter"
    else:
        adapter = None
    tips = ctx.load_labware("opentrons_flex_96_tiprack_200uL", "B2", adapter=adapter)
    reservoir = ctx.load_labware(RESERVOIR_NAME, "C2")
    plate = ctx.load_labware("corning_96_wellplate_360ul_flat", "D2")
    pipette = ctx.load_instrument(PIPETTE_NAME, "left", tip_racks=[tips])
    pipette.configure_for_volume(TARGET_VOLUME)
    _assign_starting_volumes(ctx, pipette, reservoir)
    for i in range(NUM_PLATES):
        if not pipette.has_tip:
            pipette.pick_up_tip()
        for test in TARGET_SOURCES:
            _transfer(
                ctx,
                TARGET_VOLUME,
                pipette,
                reservoir,
                plate,
                test["source"],  # type: ignore[arg-type]
                test["destinations"],  # type: ignore[arg-type]
                push_out=TARGET_PUSH_OUT,
                touch_tip=True,
                volume_already_in_plate=0,
            )
        if CHANGE_TIP:
            if RETURN_TIP:
                pipette.return_tip()
            else:
                pipette.drop_tip()
        if not FILL_MULTIPLE_PLATES:
            break
        if i < NUM_PLATES - 1:
            min_vol = int(MIN_VOL_SRC[RESERVOIR_NAME] / 1000)
            ctx.pause(f"liquid is {min_vol}mL per well, "
                      f"refresh to start volumes, "
                      f"and add new Plate")
