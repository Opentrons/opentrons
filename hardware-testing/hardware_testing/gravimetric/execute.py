"""Gravimetric."""
import enum
from dataclasses import dataclass
from pathlib import Path
from typing import List, Tuple
from typing_extensions import Final

from opentrons.protocol_api import ProtocolContext, Well

from hardware_testing.gravimetric import liquid
from hardware_testing.data import create_run_id_and_start_time
from hardware_testing.gravimetric.labware.position import (
    VIAL_SAFE_Z_OFFSET,
    overwrite_default_labware_positions,
)
from hardware_testing.gravimetric.labware.layout import (
    load_radwag_vial_definition,
)
from hardware_testing.gravimetric.liquid.height import LiquidTracker
from hardware_testing.gravimetric.measure.weight import (
    GravimetricRecorder,
    GravimetricRecorderConfig,
)
from hardware_testing.gravimetric.pipette.liquid_class import PipetteLiquidClass


SCALE_SECONDS_TO_SETTLE: Final = 15
GRAV_STABLE_DURATION: Final = 10
GRAV_STABLE_TIMEOUT: Final = GRAV_STABLE_DURATION + 5
DELAY_SECONDS_AFTER_ASPIRATE: Final = SCALE_SECONDS_TO_SETTLE + GRAV_STABLE_TIMEOUT
DELAY_SECONDS_AFTER_DISPENSE: Final = SCALE_SECONDS_TO_SETTLE + GRAV_STABLE_TIMEOUT


class SampleTag(enum.Enum):
    PICK_UP_TIP = "pick-up-tip"
    DROP_TIP = "drop-tip"
    ASPIRATE = "aspirate"
    ASPIRATE_STABILIZE = "aspirate-stabilize"
    DISPENSE = "dispense"
    DISPENSE_STABILIZE = "dispense-stabilize"

    def __str__(self) -> str:
        return self.value


@dataclass
class ExecuteGravConfig:
    """Execute Gravimetric Setup Config."""

    name: str
    vial_slot: int
    tiprack_slot: int
    labware_dir: Path
    pipette_volume: int
    pipette_mount: str
    tip_volume: int


def _initialize_liquid_from_deck(ctx: ProtocolContext, lt: LiquidTracker) -> None:
    # NOTE: For Corning 3631, assuming a perfect cylinder creates
    #       an error of -0.78mm when Corning 3631 plate is full (~360uL)
    #       This means the software will think the liquid is
    #       0.78mm lower than it is in reality. To make it more
    #       accurate, give .init_liquid_height() a lookup table
    lt.reset()
    for lw in ctx.loaded_labwares.values():
        if lw.is_tiprack or "trash" in lw.name.lower():
            continue
        for w in lw.wells():
            lt.init_well_liquid_height(w)


def setup(ctx: ProtocolContext, cfg: ExecuteGravConfig) -> Tuple[PipetteLiquidClass, LiquidTracker, GravimetricRecorder]:
    """Setup."""
    run_id, start_time = create_run_id_and_start_time()

    # LOAD LABWARE
    tiprack = ctx.load_labware(
        f"opentrons_ot3_96_tiprack_{cfg.tip_volume}ul",
        location=cfg.tiprack_slot,
    )
    vial = ctx.load_labware_from_definition(
        load_radwag_vial_definition(directory=cfg.labware_dir),
        location=cfg.vial_slot
    )
    overwrite_default_labware_positions([tiprack, vial])

    # LIQUID TRACKING
    _liq_track = LiquidTracker()
    _initialize_liquid_from_deck(ctx, _liq_track)
    _liq_track.set_start_volume_from_liquid_height(
        vial["A1"], vial["A1"].depth - VIAL_SAFE_Z_OFFSET, name="Water"
    )

    # PIPETTE
    _pipette = ctx.load_instrument(
        f"p{cfg.pipette_volume}_single",
        cfg.pipette_mount,
        tip_racks=[tiprack]
    )

    # LIQUID CLASS
    _liq_pip = PipetteLiquidClass(
        pipette=_pipette,
        test_name=cfg.name,
        run_id=run_id,
        start_time=start_time,
        delay_method=ctx.delay
    )
    _liq_pip.set_liquid_class(liquid.defaults.P50_SINGLE_T50_50_UL)

    # SCALE
    # Some Radwag settings cannot be controlled remotely.
    # Listed below are the things the must be done using the touchscreen:
    #   1) Set profile to USER
    #   2) Set screensaver to NONE
    _recorder = GravimetricRecorder(
        GravimetricRecorderConfig(
            test_name=cfg.name,
            run_id=run_id,
            tag=_liq_pip.unique_name,
            start_time=start_time,
            duration=0,
            frequency=10,
            stable=False,
        ),
        simulate=ctx.is_simulating
    )

    # USER SETUP LIQUIDS
    setup_str = _liq_track.get_setup_instructions_string()
    print(setup_str)
    if ctx.is_simulating():
        print("press ENTER when ready...")
    else:
        input("press ENTER when ready...")

    # DONE
    return _liq_pip, _liq_track, _recorder


def run(
    ctx: ProtocolContext,
    liquid_pipette: PipetteLiquidClass,
    liquid_tracker: LiquidTracker,
    recorder: GravimetricRecorder,
    grav_well: Well,
    volumes: List[float],
    samples: int,
) -> None:
    """Run."""
    try:
        # RECORD SCALE + PIPETTING TIMESTAMPS
        recorder.record(in_thread=True)

        # LOOP THROUGH SAMPLES
        sample_volumes = [v for v in volumes for _ in range(samples)]
        for i, sample_volume in enumerate(sample_volumes):

            print(f"{i + 1}/{len(sample_volumes)}: {sample_volume} uL")

            # PICK-UP TIP
            if liquid_pipette.pipette.has_tip:
                with recorder.set_sample_tag(SampleTag.DROP_TIP):
                    liquid_pipette.pipette.drop_tip()
            with recorder.set_sample_tag(SampleTag.PICK_UP_TIP):
                liquid_pipette.pipette.pick_up_tip()

            # ASPIRATE
            with recorder.set_sample_tag(SampleTag.ASPIRATE):
                liquid_pipette.aspirate(
                    sample_volume, grav_well, liquid_level=liquid_tracker
                )
            with recorder.set_sample_tag(SampleTag.ASPIRATE_STABILIZE):
                ctx.delay(DELAY_SECONDS_AFTER_ASPIRATE)

            # DISPENSE
            with recorder.set_sample_tag(SampleTag.DISPENSE):
                liquid_pipette.dispense(
                    sample_volume, grav_well, liquid_level=liquid_tracker
                )
            with recorder.set_sample_tag(SampleTag.DISPENSE_STABILIZE):
                ctx.delay(DELAY_SECONDS_AFTER_DISPENSE)

            # DROP TIP
            with recorder.set_sample_tag(SampleTag.DROP_TIP):
                liquid_pipette.pipette.drop_tip()

        print("One final pause to wait for final reading to settle")
        ctx.delay(DELAY_SECONDS_AFTER_ASPIRATE)
    finally:
        recorder.stop()


def analyze(ctx: ProtocolContext, liquid_pipette: PipetteLiquidClass, recorder: GravimetricRecorder) -> None:
    """Analyze."""
    # FIXME: skipping analysis during simulation
    return
