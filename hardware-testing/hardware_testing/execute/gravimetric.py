"""Gravimetric."""
from dataclasses import dataclass
from pathlib import Path
from typing import List

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
    GravimetricRecorder,
    GravimetricRecorderConfig,
)
from hardware_testing.pipette.liquid_class import PipetteLiquidClass


LIQUID_CLASS_LOOKUP = {300: liquid.defaults.DEFAULT_LIQUID_CLASS_OT2_P300_SINGLE}


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
    _layout = LayoutLabware.build(
        ctx,
        DEFAULT_SLOTS_GRAV,
        tip_volume=cfg.pipette_volume,
        definitions_dir=cfg.labware_dir,
    )
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
    items.liquid_pipette.record_timestamp_enable()
    try:
        items.recorder.record(in_thread=True)
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
            items.liquid_pipette.dispense(
                sample_volume, grav_well, liquid_level=items.liquid_tracker
            )
            items.liquid_pipette.pipette.drop_tip()
            items.liquid_pipette.save_latest_timestamp()
    finally:
        items.recorder.stop()


def analyze(ctx: ProtocolContext, items: ExecuteGravItems) -> None:
    """Analyze."""
    print("skipping analysis")
