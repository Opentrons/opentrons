"""Gravimetric."""
from dataclasses import dataclass
from statistics import stdev
from pathlib import Path
from typing import List
from typing_extensions import Final

from opentrons.protocol_api import ProtocolContext

from hardware_testing import liquid
from hardware_testing.data import create_run_id_and_start_time
from hardware_testing.labware.position import (
    VIAL_SAFE_Z_OFFSET,
    overwrite_default_labware_positions,
)
from hardware_testing.labware.layout import LayoutLabware, DEFAULT_SLOTS_GRAV
from hardware_testing.liquid.height import LiquidTracker
from hardware_testing.measure.weight import (
    GravimetricRecording,
    GravimetricRecorder,
    GravimetricRecorderConfig,
)
from hardware_testing.pipette.liquid_class import PipetteLiquidClass
from hardware_testing.pipette.timestamp import SampleTimestamps


LIQUID_CLASS_LOOKUP: Final = {300: liquid.defaults.DEFAULT_LIQUID_CLASS_OT2_P300_SINGLE}
SCALE_SECONDS_TO_SETTLE: Final = 15
GRAV_STABLE_DURATION: Final = 10
GRAV_STABLE_TIMEOUT: Final = GRAV_STABLE_DURATION + 5
DELAY_SECONDS_AFTER_ASPIRATE: Final = SCALE_SECONDS_TO_SETTLE + GRAV_STABLE_TIMEOUT


@dataclass
class ExecuteGravConfig:
    """Execute Gravimetric Setup Config."""

    name: str
    labware_dir: Path
    pipette_volume: int
    pipette_mount: str


@dataclass
class ExecuteGravItems:
    """Execute Gravimetric Items."""

    liquid_pipette: PipetteLiquidClass
    liquid_tracker: LiquidTracker
    layout: LayoutLabware
    recorder: GravimetricRecorder


def setup(ctx: ProtocolContext, cfg: ExecuteGravConfig) -> ExecuteGravItems:
    """Setup."""
    # RUN ID (for labelling data)
    run_id, start_time = create_run_id_and_start_time()
    # LABWARE
    # NOTE: labware must be fully initialized before the liquid tracker
    _layout = LayoutLabware(
        ctx=ctx, slots=DEFAULT_SLOTS_GRAV, tip_volume=cfg.pipette_volume
    )
    _layout.load(definitions_dir=cfg.labware_dir)
    overwrite_default_labware_positions(ctx, layout=_layout)
    # LIQUID-LEVEL TRACKING
    _liq_track = LiquidTracker()
    _liq_track.initialize_from_deck(ctx)
    # the vial is weird
    # TODO: if using vial in production, figure out better calibration
    #       that doesn't rely on calibrating to the liquid level
    grav_well = _layout.vial["A1"]  # type: ignore[index]
    _liq_track.set_start_volume_from_liquid_height(
        grav_well, grav_well.depth - VIAL_SAFE_Z_OFFSET, name="Water"
    )
    # PIPETTE and LIQUID CLASS
    _liq_pip = PipetteLiquidClass(
        ctx=ctx,
        model=f"p{cfg.pipette_volume}_single_gen2",
        mount=cfg.pipette_mount,
        tip_racks=[_layout.tiprack],  # type: ignore[list-item]
        test_name=cfg.name,
        run_id=run_id,
        start_time=start_time,
    )
    _liq_pip.set_liquid_class(liquid.defaults.DEFAULT_LIQUID_CLASS_OT2_P300_SINGLE)
    # SCALE RECORDER
    # Some Radwag settings cannot be controlled remotely.
    # Listed below are the things the must be done using the touchscreen:
    #   1) Set profile to USER
    #   2) Set screensaver to NONE
    _recorder = GravimetricRecorder(
        ctx,
        GravimetricRecorderConfig(
            test_name=cfg.name,
            run_id=run_id,
            tag=_liq_pip.unique_name,
            start_time=start_time,
            duration=0,
            frequency=10,
            stable=False,
        ),
    )
    return ExecuteGravItems(
        liquid_pipette=_liq_pip,
        liquid_tracker=_liq_track,
        layout=_layout,
        recorder=_recorder,
    )


def run(
    ctx: ProtocolContext,
    items: ExecuteGravItems,
    volumes: List[float],
    samples: int,
) -> None:
    """Run."""
    try:
        items.recorder.record(in_thread=True)
        items.liquid_pipette.record_timestamp_enable()
        sample_volumes = [v for v in volumes for _ in range(samples)]
        if items.liquid_pipette.pipette.has_tip:
            items.liquid_pipette.pipette.drop_tip()
        grav_well = items.layout.vial["A1"]  # type: ignore[index]
        for i, sample_volume in enumerate(sample_volumes):
            ctx.comment(f"{i + 1}/{len(sample_volumes)}: {sample_volume} uL")
            items.liquid_pipette.create_empty_timestamp(tag=str(sample_volume))
            items.liquid_pipette.pipette.pick_up_tip()
            items.liquid_pipette.aspirate(
                sample_volume, grav_well, liquid_level=items.liquid_tracker
            )
            ctx.delay(DELAY_SECONDS_AFTER_ASPIRATE)
            items.liquid_pipette.dispense(
                sample_volume, grav_well, liquid_level=items.liquid_tracker
            )
            items.liquid_pipette.pipette.drop_tip()
            items.liquid_pipette.save_latest_timestamp()
        ctx.comment("One final pause to wait for final reading to settle")
        ctx.delay(DELAY_SECONDS_AFTER_ASPIRATE)
    finally:
        items.recorder.stop()


@dataclass
class TimestampedGravRecording:
    """Timestamped Grav Recording."""

    before: GravimetricRecording
    pre_aspirate: GravimetricRecording
    aspirate: GravimetricRecording
    post_aspirate: GravimetricRecording
    pre_dispense: GravimetricRecording
    dispense: GravimetricRecording
    post_dispense: GravimetricRecording


@dataclass
class BeforeAfterGravRecordings:
    """Before After Grav Recordings."""

    before: GravimetricRecording
    after: GravimetricRecording


def _split_recording_from_timestamps(
    recording: GravimetricRecording, timestamps: List[SampleTimestamps]
) -> List[TimestampedGravRecording]:
    def _get_rec_slice(start: float, end: float) -> GravimetricRecording:
        duration = min(end - start, recording.end_time - start)
        return recording.get_time_slice(
            start=start, duration=duration, stable=False, timeout=duration
        )

    split_recs = list()
    for i, t in enumerate(timestamps):
        prev_t = timestamps[i - 1] if i > 0 else None
        next_t = timestamps[i + 1] if i < len(timestamps) - 1 else None
        if prev_t and prev_t.post_dispense:
            before_start = prev_t.post_dispense.time
        else:
            before_start = recording.start_time
        if next_t and next_t.pre_aspirate:
            post_dispense_end = next_t.pre_aspirate.time
        else:
            post_dispense_end = recording.end_time
        assert t.pre_aspirate
        assert t.aspirate
        assert t.post_aspirate
        assert t.pre_dispense
        assert t.dispense
        assert t.post_dispense
        s = TimestampedGravRecording(
            before=_get_rec_slice(before_start, t.pre_aspirate.time),
            pre_aspirate=_get_rec_slice(t.pre_aspirate.time, t.aspirate.time),
            aspirate=_get_rec_slice(t.aspirate.time, t.post_aspirate.time),
            post_aspirate=_get_rec_slice(t.post_aspirate.time, t.pre_dispense.time),
            pre_dispense=_get_rec_slice(t.pre_dispense.time, t.dispense.time),
            dispense=_get_rec_slice(t.dispense.time, t.post_dispense.time),
            post_dispense=_get_rec_slice(t.post_dispense.time, post_dispense_end),
        )
        split_recs.append(s)
    return split_recs


def _isolate_before_after_recordings(
    recordings: List[TimestampedGravRecording],
) -> List[BeforeAfterGravRecordings]:
    before_after_recordings = list()
    for s in recordings:
        b = s.post_aspirate
        a = s.post_dispense
        b_start = b.start_time + SCALE_SECONDS_TO_SETTLE
        a_start = a.start_time + SCALE_SECONDS_TO_SETTLE
        before_after_recordings.append(
            BeforeAfterGravRecordings(
                before=b.get_time_slice(
                    start=b_start,
                    duration=GRAV_STABLE_DURATION,
                    stable=True,
                    timeout=GRAV_STABLE_TIMEOUT,
                ),
                after=a.get_time_slice(
                    start=a_start,
                    duration=GRAV_STABLE_DURATION,
                    stable=True,
                    timeout=GRAV_STABLE_TIMEOUT,
                ),
            )
        )
    return before_after_recordings


def _analyze_recording_and_timestamps(
    ctx: ProtocolContext,
    recording: GravimetricRecording,
    timestamps: List[SampleTimestamps],
) -> None:
    recorded_slices = _split_recording_from_timestamps(recording, timestamps)
    before_after_recordings = _isolate_before_after_recordings(recorded_slices)
    dispense_volumes = [
        r.after.average - r.before.average for r in before_after_recordings
    ]
    assert len(dispense_volumes)
    dispense_avg = sum(dispense_volumes) / len(dispense_volumes)
    dispense_cv = stdev(dispense_volumes) / max(dispense_avg, 0.00000001)
    ctx.comment("Summary:")
    ctx.comment(f"\tAverage: {round(dispense_avg * 1000, 2)} mg")
    ctx.comment(f"\tCV: {round(dispense_cv * 100, 3)}%")
    ctx.comment("\tVolumes:")
    for i, v in enumerate(dispense_volumes):
        ctx.comment(f"\t\t{i + 1})\t{round(v * 1000.0, 2)} mg")


def analyze(ctx: ProtocolContext, items: ExecuteGravItems) -> None:
    """Analyze."""
    # FIXME: this totally breaks when simulating
    if ctx.is_simulating():
        ctx.comment("FIXME: skipping analysis during simulation")
        return
    _analyze_recording_and_timestamps(
        ctx, items.recorder.recording, items.liquid_pipette.get_timestamps()
    )
