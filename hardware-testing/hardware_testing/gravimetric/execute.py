"""Gravimetric."""
from dataclasses import dataclass
from typing_extensions import Final

from opentrons.protocol_api import ProtocolContext

from hardware_testing.data import create_run_id_and_start_time

from .helpers import get_pipette_unique_name
from .liquid_height.height import LiquidTracker
from .measure.weight import GravimetricRecorder, GravimetricRecorderConfig
from .liquid_class.defaults import get_test_volumes
from .liquid_class.pipetting import (
    aspirate_with_liquid_class,
    dispense_with_liquid_class,
    PipettingCallbacks,
)
from .radwag_pipette_calibration_file import VIAL_DEFINITION


VIAL_SAFE_Z_OFFSET: Final = 10
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
    slot_vial: int
    slot_tiprack: int


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
    if ctx.is_simulating():
        get_input = print
    else:
        get_input = input

    """Setup."""
    run_id, start_time = create_run_id_and_start_time()

    # LOAD LABWARE
    tiprack = ctx.load_labware(
        f"opentrons_ot3_96_tiprack_{cfg.tip_volume}ul",
        location=cfg.slot_tiprack,
    )
    vial = ctx.load_labware_from_definition(VIAL_DEFINITION, location=cfg.slot_vial)
    # TODO: apply offsets from LPC

    # LIQUID TRACKING
    liquid_tracker = LiquidTracker()
    _initialize_liquid_from_deck(ctx, liquid_tracker)
    liquid_tracker.set_start_volume_from_liquid_height(
        vial["A1"], vial["A1"].depth - VIAL_SAFE_Z_OFFSET, name="Water"
    )

    # PIPETTE
    pipette = ctx.load_instrument(
        f"p{cfg.pipette_volume}_single", cfg.pipette_mount, tip_racks=[tiprack]
    )

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

    try:
        # RECORD SCALE
        recorder.record(in_thread=True)

        # LOOP THROUGH SAMPLES
        test_volumes = get_test_volumes(cfg.pipette_volume, cfg.tip_volume)
        for volume in test_volumes:
            for trial in range(cfg.trials):
                print(f"{trial + 1}/{cfg.trials}: {volume} uL")
                callbacks = _generate_callbacks_for_trial(recorder, volume, trial)
                if pipette.has_tip:
                    pipette.drop_tip()
                pipette.pick_up_tip()
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

        print("One final pause to wait for final reading to settle")
        ctx.delay(DELAY_SECONDS_AFTER_ASPIRATE)
    finally:
        recorder.stop()

    # TODO: - Read in recording from CSV file
    #       - Isolate each aspirate/dispense sample
    #       - Calculate grams per each aspirate/dispense
    #       - Calculate uL Average and %CV
    #       - Print results
