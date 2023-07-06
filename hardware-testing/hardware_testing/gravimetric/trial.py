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
from .helpers import _get_channel_offset
from . import report

QC_VOLUMES_G = {
    1: {
        50: {  # P50
            50: [1, 50],  # T50
        },
        1000: {  # P1000
            50: [5],  # T50
            200: [],  # T200
            1000: [1000],  # T1000
        },
    },
    8: {
        50: {  # P50
            50: [1, 50],  # T50
        },
        1000: {  # P1000
            50: [5],  # T50
            200: [],  # T200
            1000: [1000],  # T1000
        },
    },
    96: {
        1000: {  # P1000
            50: [5],  # T50
            200: [200],  # T200
            1000: [1000],  # T1000
        },
    },
}


QC_VOLUMES_EXTRA_G = {
    1: {
        50: {  # P50
            50: [1, 10, 50],  # T50
        },
        1000: {  # P1000
            50: [5],  # T50
            200: [50, 200],  # T200
            1000: [1000],  # T1000
        },
    },
    8: {
        50: {  # P50
            50: [1, 10, 50],  # T50
        },
        1000: {  # P1000
            50: [5],  # T50
            200: [50, 200],  # T200
            1000: [1000],  # T1000
        },
    },
    96: {
        1000: {  # P1000
            50: [5],  # T50
            200: [200],  # T200
            1000: [1000],  # T1000
        },
    },
}

QC_VOLUMES_P = {
    96: {
        1000: {  # P1000
            50: [5],  # T50
            200: [],  # T200
            1000: [200],  # T1000
        },
    },
}


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


@dataclass
class GravimetricTrial(VolumetricTrial):
    """All the arguments for a single gravimetric trial."""

    well: Well
    channel_offset: Point
    channel: int
    channel_count: int
    recorder: GravimetricRecorder
    blank: bool
    measure_height: float
    stable: bool
    scale_delay: int = DELAY_FOR_MEASUREMENT


@dataclass
class PhotometricTrial(VolumetricTrial):
    """All the arguments for a single photometric trial."""

    source: Well
    dest: Labware
    do_jog: bool
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
    measure_height: float = 50,
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
                    measure_height=measure_height,
                    mix=cfg.mix,
                    stable=False,
                    scale_delay=cfg.scale_delay,
                    acceptable_cv=None,
                )
            )
    else:
        for volume in test_volumes:
            for channel in channels_to_test:
                if cfg.isolate_channels and (channel + 1) not in cfg.isolate_channels:
                    print(f"skipping channel {channel + 1}")
                    continue
                trial_list[volume] = {channel: []}
                channel_offset = _get_channel_offset(cfg, channel)
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
                            measure_height=measure_height,
                            mix=cfg.mix,
                            stable=True,
                            scale_delay=cfg.scale_delay,
                            acceptable_cv=None,
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
) -> Dict[float, List[PhotometricTrial]]:
    """Build a list of all the trials that will be run."""
    trial_list: Dict[float, List[PhotometricTrial]] = {}
    for volume in test_volumes:
        do_jog = True
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
                    do_jog=do_jog,
                    cfg=cfg,
                    mix=cfg.mix,
                    acceptable_cv=None,
                )
            )
            if volume < 250:
                do_jog = False
    return trial_list
