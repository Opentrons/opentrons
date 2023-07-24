"""Dataclass that describes the arguments for trials."""
from dataclasses import dataclass
from typing import List, Optional, Union, Dict
from . import config
from opentrons.protocol_api import ProtocolContext, InstrumentContext, Well, Labware
from .measurement.record import GravimetricRecorder
from .measurement import DELAY_FOR_MEASUREMENT
from .liquid_height.height import LiquidTracker
from hardware_testing.data.csv_report import CSVReport
from hardware_testing.opentrons_api.types import Point
from . import helpers
from . import report
from hardware_testing.data import ui
from hardware_testing.drivers import asair_sensor


@dataclass
class VolumetricTrial:
    """Common arguments for volumetric scripts."""

    ctx: ProtocolContext
    pipette: InstrumentContext
    test_report: CSVReport
    liquid_tracker: LiquidTracker
    inspect: bool
    trial: int
    tip_volume: int
    volume: float
    mix: bool
    acceptable_cv: Optional[float]
    env_sensor: asair_sensor.AsairSensorBase


@dataclass
class GravimetricTrial(VolumetricTrial):
    """All the arguments for a single gravimetric trial."""

    well: Well
    channel_offset: Point
    channel: int
    channel_count: int
    recorder: GravimetricRecorder
    blank: bool
    stable: bool
    cfg: config.GravimetricConfig
    scale_delay: int = DELAY_FOR_MEASUREMENT


@dataclass
class PhotometricTrial(VolumetricTrial):
    """All the arguments for a single photometric trial."""

    source: Well
    dest: Labware
    cfg: config.PhotometricConfig


@dataclass
class TrialOrder:
    """A list of all of the trials that a particular QC run needs to run."""

    trials: List[Union[GravimetricTrial, PhotometricTrial]]


@dataclass
class TestResources:
    """Common arguments to the run method of volumetric tests."""

    ctx: ProtocolContext
    pipette: InstrumentContext
    pipette_tag: str
    tipracks: List[Labware]
    test_volumes: List[float]
    run_id: str
    start_time: float
    operator_name: str
    robot_serial: str
    tip_batch: str
    git_description: str
    tips: Dict[int, List[Well]]
    env_sensor: asair_sensor.AsairSensorBase


def build_gravimetric_trials(
    ctx: ProtocolContext,
    instr: InstrumentContext,
    cfg: config.GravimetricConfig,
    well: Well,
    test_volumes: List[float],
    channels_to_test: List[int],
    recorder: GravimetricRecorder,
    test_report: report.CSVReport,
    liquid_tracker: LiquidTracker,
    blank: bool,
    env_sensor: asair_sensor.AsairSensorBase,
) -> Dict[float, Dict[int, List[GravimetricTrial]]]:
    """Build a list of all the trials that will be run."""
    trial_list: Dict[float, Dict[int, List[GravimetricTrial]]] = {}
    if len(channels_to_test) > 1:
        num_channels_per_transfer = 1
    else:
        num_channels_per_transfer = cfg.pipette_channels
    if blank:
        trial_list[test_volumes[-1]] = {0: []}
        for trial in range(config.NUM_BLANK_TRIALS):
            trial_list[test_volumes[-1]][0].append(
                GravimetricTrial(
                    ctx=ctx,
                    pipette=instr,
                    well=well,
                    channel_offset=Point(),
                    tip_volume=cfg.tip_volume,
                    volume=test_volumes[-1],
                    channel=0,
                    channel_count=num_channels_per_transfer,
                    trial=trial,
                    recorder=recorder,
                    test_report=test_report,
                    liquid_tracker=liquid_tracker,
                    blank=blank,
                    inspect=cfg.inspect,
                    mix=cfg.mix,
                    stable=True,
                    scale_delay=cfg.scale_delay,
                    acceptable_cv=None,
                    cfg=cfg,
                    env_sensor=env_sensor,
                )
            )
    else:
        for volume in test_volumes:
            trial_list[volume] = {}
            for channel in channels_to_test:
                if cfg.isolate_channels and (channel + 1) not in cfg.isolate_channels:
                    ui.print_info(f"skipping channel {channel + 1}")
                    continue
                trial_list[volume][channel] = []
                channel_offset = helpers._get_channel_offset(cfg, channel)
                for trial in range(cfg.trials):
                    trial_list[volume][channel].append(
                        GravimetricTrial(
                            ctx=ctx,
                            pipette=instr,
                            well=well,
                            channel_offset=channel_offset,
                            tip_volume=cfg.tip_volume,
                            volume=volume,
                            channel=channel,
                            channel_count=num_channels_per_transfer,
                            trial=trial,
                            recorder=recorder,
                            test_report=test_report,
                            liquid_tracker=liquid_tracker,
                            blank=blank,
                            inspect=cfg.inspect,
                            mix=cfg.mix,
                            stable=True,
                            scale_delay=cfg.scale_delay,
                            acceptable_cv=None,
                            cfg=cfg,
                            env_sensor=env_sensor,
                        )
                    )
    return trial_list


def build_photometric_trials(
    ctx: ProtocolContext,
    test_report: CSVReport,
    pipette: InstrumentContext,
    source: Well,
    dest: Labware,
    test_volumes: List[float],
    liquid_tracker: LiquidTracker,
    cfg: config.PhotometricConfig,
    env_sensor: asair_sensor.AsairSensorBase,
) -> Dict[float, List[PhotometricTrial]]:
    """Build a list of all the trials that will be run."""
    trial_list: Dict[float, List[PhotometricTrial]] = {}
    for volume in test_volumes:
        trial_list[volume] = []
        for trial in range(cfg.trials):
            trial_list[volume].append(
                PhotometricTrial(
                    ctx=ctx,
                    test_report=test_report,
                    pipette=pipette,
                    source=source,
                    dest=dest,
                    tip_volume=cfg.tip_volume,
                    volume=volume,
                    trial=trial,
                    liquid_tracker=liquid_tracker,
                    inspect=cfg.inspect,
                    cfg=cfg,
                    mix=cfg.mix,
                    acceptable_cv=None,
                    env_sensor=env_sensor,
                )
            )
    return trial_list


def _finish_test(
    cfg: config.VolumetricConfig,
    resources: TestResources,
    return_tip: bool,
) -> None:
    ui.print_title("CHANGE PIPETTES")
    if resources.pipette.has_tip:
        if resources.pipette.current_volume > 0:
            ui.print_info("dispensing liquid to trash")
            trash = resources.pipette.trash_container.wells()[0]
            # FIXME: this should be a blow_out() at max volume,
            #        but that is not available through PyAPI yet
            #        so instead just dispensing.
            resources.pipette.dispense(resources.pipette.current_volume, trash.top())
            resources.pipette.aspirate(10)  # to pull any droplets back up
        ui.print_info("dropping tip")
        helpers._drop_tip(resources.pipette, return_tip)
    ui.print_info("moving to attach position")
    resources.pipette.move_to(
        resources.ctx.deck.position_for(5).move(Point(x=0, y=9 * 7, z=150))
    )
