"""Gravimetric."""
from dataclasses import dataclass
from typing import List
from typing_extensions import Final

from opentrons.protocol_api import ProtocolContext

from hardware_testing.data import create_run_id_and_start_time
from hardware_testing.opentrons_api.types import OT3Mount, Point
from hardware_testing.opentrons_api.helpers_ot3 import clear_pipette_ul_per_mm

from .helpers import get_pipette_unique_name
from .workarounds import get_sync_hw_api, get_latest_offset_for_labware
from .increments import get_volume_increments
from .liquid_height.height import LiquidTracker, initialize_liquid_from_deck
from .measure.weight import GravimetricRecorder, GravimetricRecorderConfig
from .liquid_class.defaults import get_test_volumes
from .liquid_class.pipetting import (
    aspirate_with_liquid_class,
    dispense_with_liquid_class,
    PipettingCallbacks,
)
from .radwag_pipette_calibration_file import VIAL_DEFINITION


LOW_VOLUME_UPPER_LIMIT_UL: Final = 2.0
VIAL_SAFE_Z_OFFSET: Final = 10
DELAY_SECONDS_BEFORE_ASPIRATE: Final = 1
DELAY_SECONDS_AFTER_ASPIRATE: Final = 1
DELAY_SECONDS_AFTER_DISPENSE: Final = 1


@dataclass
class ExecuteGravConfig:
    """Execute Gravimetric Setup Config."""

    name: str
    pipette_volume: int
    pipette_mount: str
    tip_volume: int
    trials: int
    labware_offsets: List[dict]
    slot_vial: int
    slot_tiprack: int
    increment: bool
    low_volume: bool


def _generate_callbacks_for_trial(
    recorder: GravimetricRecorder, volume: float, trial: int
) -> PipettingCallbacks:
    def _tag(t: str) -> str:
        return f"{t}-{int(volume)}-{trial}"

    return PipettingCallbacks(
        on_submerging=lambda: recorder.set_sample_tag(_tag("submerge")),
        on_aspirating=lambda: recorder.set_sample_tag(_tag("aspirate")),
        on_dispensing=lambda: recorder.set_sample_tag(_tag("dispense")),
        on_retracting=lambda: recorder.set_sample_tag(_tag("retract")),
        on_blowing_out=lambda: recorder.set_sample_tag(_tag("blowout")),
        on_exiting=recorder.clear_sample_tag,
    )


def run(ctx: ProtocolContext, cfg: ExecuteGravConfig) -> None:
    """Run."""
    if ctx.is_simulating():
        get_input = print
    else:
        get_input = input  # type: ignore[assignment]

    """Setup."""
    run_id, start_time = create_run_id_and_start_time()

    # LOAD LABWARE
    tiprack = ctx.load_labware(
        f"opentrons_ot3_96_tiprack_{cfg.tip_volume}ul",
        location=cfg.slot_tiprack,
    )
    tiprack.set_calibration(
        get_latest_offset_for_labware(cfg.labware_offsets, tiprack)
    )
    vial = ctx.load_labware_from_definition(VIAL_DEFINITION, location=cfg.slot_vial)
    vial.set_calibration(
        get_latest_offset_for_labware(cfg.labware_offsets, vial)
    )

    # LIQUID TRACKING
    liquid_tracker = LiquidTracker()
    initialize_liquid_from_deck(ctx, liquid_tracker)
    liquid_tracker.set_start_volume_from_liquid_height(
        vial["A1"], vial["A1"].depth - VIAL_SAFE_Z_OFFSET, name="Water"
    )

    # PIPETTE
    pipette = ctx.load_instrument(
        f"p{cfg.pipette_volume}_single", cfg.pipette_mount, tip_racks=[tiprack]
    )

    # GET TEST VOLUMES
    if cfg.increment:
        test_volumes = get_volume_increments(cfg.pipette_volume, cfg.tip_volume)
        clear_pipette_ul_per_mm(
            get_sync_hw_api(ctx)._obj_to_adapt,  # type: ignore[arg-type]
            OT3Mount.LEFT if cfg.pipette_mount == "left" else OT3Mount.RIGHT,
        )
    else:
        test_volumes = get_test_volumes(cfg.pipette_volume, cfg.tip_volume)
    # anything volumes < 2uL must be done on the super-high-precision scale
    if cfg.low_volume:
        test_volumes = [v for v in test_volumes if v < LOW_VOLUME_UPPER_LIMIT_UL]
    else:
        test_volumes = [v for v in test_volumes if v >= LOW_VOLUME_UPPER_LIMIT_UL]
    if not test_volumes:
        raise ValueError("no volumes to test, check the configuration")

    # SCALE
    # Some Radwag settings cannot be controlled remotely.
    # Listed below are the things the must be done using the touchscreen:
    #   1) Set profile to USER
    #   2) Set screensaver to NONE
    recorder = GravimetricRecorder(
        GravimetricRecorderConfig(
            test_name=cfg.name,
            run_id=run_id,
            tag=get_pipette_unique_name(pipette),
            start_time=start_time,
            duration=0,
            frequency=5,
            stable=False,
        ),
        simulate=ctx.is_simulating(),
    )

    # USER SETUP LIQUIDS
    setup_str = liquid_tracker.get_setup_instructions_string()
    print(setup_str)
    get_input("press ENTER when ready...")

    # TEST VIAL LIQUID HEIGHT
    expected_height = liquid_tracker.get_liquid_height(vial["A1"])
    pipette.pick_up_tip()
    pipette.move_to(vial["A1"].bottom(expected_height))
    get_input("Check that tip is touching liquid surface (+/-) 0.1 mm")
    pipette.drop_tip()

    # RECORD SCALE
    recorder.record(in_thread=True)

    try:
        # LOOP THROUGH SAMPLES
        for volume in test_volumes:
            for trial in range(cfg.trials):
                print(f"{trial + 1}/{cfg.trials}: {volume} uL")
                pipette.pick_up_tip()
                pipette.move_to(vial["A1"].top())
                with recorder.samples_of_tag(f"measure-init-{int(volume)}-{trial}"):
                    ctx.delay(DELAY_SECONDS_BEFORE_ASPIRATE)
                callbacks = _generate_callbacks_for_trial(recorder, volume, trial)
                aspirate_with_liquid_class(
                    ctx,
                    pipette,
                    cfg.tip_volume,
                    volume,
                    vial["A1"],
                    liquid_tracker,
                    callbacks=callbacks,
                )
                with recorder.samples_of_tag(f"measure-aspirate-{int(volume)}-{trial}"):
                    ctx.delay(DELAY_SECONDS_AFTER_ASPIRATE)
                dispense_with_liquid_class(
                    ctx,
                    pipette,
                    cfg.tip_volume,
                    volume,
                    vial["A1"],
                    liquid_tracker,
                    callbacks=callbacks,
                )
                with recorder.samples_of_tag(f"measure-dispense-{int(volume)}-{trial}"):
                    ctx.delay(DELAY_SECONDS_AFTER_DISPENSE)
                pipette.drop_tip()
    finally:
        recorder.stop()

    # TODO: - Read in recording from CSV file
    #       - Isolate each aspirate/dispense sample
    #       - Calculate grams per each aspirate/dispense
    #       - Calculate uL Average and %CV
    #       - Print results
