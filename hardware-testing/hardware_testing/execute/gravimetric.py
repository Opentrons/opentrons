"""Gravimetric."""
from dataclasses import dataclass
from pathlib import Path
from typing import Tuple, List

from opentrons.protocol_api import ProtocolContext

from hardware_testing import labware
from hardware_testing import liquid
from hardware_testing import pipette
from hardware_testing.data import create_run_id_and_start_time
from hardware_testing.labware.position import \
    VIAL_SAFE_Z_OFFSET, overwrite_default_labware_positions
from hardware_testing.labware.layout import \
    LayoutLabware, DEFAULT_SLOTS_GRAV
from hardware_testing.liquid.height import LiquidTracker
from hardware_testing.measure.weight import \
    GravimetricRecorder, GravimetricRecorderConfig
from hardware_testing.pipette.liquid_class import PipetteLiquidClass


LIQUID_CLASS_LOOKUP = {
    300: liquid.defaults.DEFAULT_LIQUID_CLASS_OT2_P300_SINGLE
}


@dataclass
class SetupConfig:
    name: str
    labware_dir: Path
    pipette_volume: int
    pipette_mount: str


def setup(ctx: ProtocolContext, cfg: SetupConfig) -> Tuple[PipetteLiquidClass,
                                                           LiquidTracker,
                                                           LayoutLabware,
                                                           GravimetricRecorder]:
    # RUN ID (for labelling data)
    run_id, start_time = create_run_id_and_start_time()
    # LABWARE
    # NOTE: labware must be fully initialized before the liquid tracker
    _layout = LayoutLabware.build(
        ctx, DEFAULT_SLOTS_GRAV,
        tip_volume=cfg.pipette_volume, definitions_dir=cfg.labware_dir
    )
    overwrite_default_labware_positions(ctx, layout=_layout)
    # LIQUID-LEVEL TRACKING
    _liq_track = LiquidTracker()
    _liq_track.initialize_from_deck(ctx)
    # the vial is weird
    # TODO: if using vial in production, figure out better calibration
    #       that doesn't rely on calibrating to the liquid level
    grav_well = _layout.vial['A1']  # type: ignore[index]
    _liq_track.set_start_volume_from_liquid_height(
        grav_well, grav_well.depth - VIAL_SAFE_Z_OFFSET, name='Water'
    )
    # PIPETTE and LIQUID CLASS
    _liq_pip = PipetteLiquidClass(
        ctx=ctx,
        model=f'p{cfg.pipette_volume}_single_gen2',
        mount=cfg.pipette_mount,
        tip_racks=[_layout.tiprack],  # type: ignore[list-item]
        test_name=cfg.name,
        run_id=run_id,
        start_time=start_time
    )
    _liq_pip.set_liquid_class(liquid.defaults.DEFAULT_LIQUID_CLASS_OT2_P300_SINGLE)
    # SCALE RECORDER
    _recorder = GravimetricRecorder(ctx, GravimetricRecorderConfig(
        test_name=cfg.name,
        run_id=run_id, tag=_liq_pip.unique_name, start_time=start_time,
        duration=0, frequency=10, stable=False
    ))
    return _liq_pip, _liq_track, _layout, _recorder


def run(
    liq_pipette: pipette.liquid_class.PipetteLiquidClass,
    layout: labware.layout.LayoutLabware,
    liquid_level: liquid.height.LiquidTracker,
    recorder: GravimetricRecorder,
    volumes: List[float], samples: int
) -> None:
    liq_pipette.record_timestamp_enable()
    try:
        recorder.record(in_thread=True)
        samples = [v for v in volumes for _ in range(samples)]
        if liq_pipette.pipette.has_tip:
            liq_pipette.pipette.drop_tip()
        grav_well = layout.vial['A1']  # type: ignore[index]
        for i, sample_volume in enumerate(samples):
            print(f'{i + 1}/{len(samples)}: {sample_volume} uL')
            liq_pipette.create_empty_timestamp(tag=str(sample_volume))
            liq_pipette.pipette.pick_up_tip()
            liq_pipette.aspirate(sample_volume, grav_well,
                                 liquid_level=liquid_level)
            liq_pipette.dispense(sample_volume, grav_well,
                                 liquid_level=liquid_level)
            liq_pipette.pipette.drop_tip()
            liq_pipette.save_latest_timestamp()
    finally:
        recorder.stop()


def analyze(recorder: GravimetricRecorder,
            liq_pipette: pipette.liquid_class.PipetteLiquidClass) -> None:
    print('skipping analysis')
