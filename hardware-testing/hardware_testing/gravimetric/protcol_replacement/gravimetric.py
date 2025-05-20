"""Gravimetric QC protocol."""

from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
import os
import sys
from time import time

from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    InstrumentContext,
    Well,
    Labware,
    Liquid,
    LiquidClass,
)
from opentrons import version
from opentrons.protocol_api._liquid_properties import TransferProperties
from opentrons.protocol_api.core.engine import (
    transfer_components_executor as tx_comps_executor,
)
from opentrons.config import infer_config_base_dir

metadata = {"protocolName": "Gravimetric QC"}
requirements = {"robotType": "Flex", "apiLevel": "2.23"}

SCALE_SECONDS_TO_TRUE_STABILIZE = 60 * 3


def _download_and_extract(version_str: str, base_dir: str) -> None:
    from urllib.request import urlretrieve
    from zipfile import ZipFile

    zipfile = f"https://github.com/Opentrons/opentrons/archive/refs/tags/v{release}.zip"
    where_to_place = os.path.join(base_dir, "hardware_testing")
    urlretrieve(zipfile, os.path.join(base_dir, "source.zip"))
    zf = ZipFile(os.path.join(base_dir, "source.zip"), "r")
    files = [f for f in zf.namelist() if "hardware_testing" in f and "tests" not in f]
    files = [f for f in files if "py" in f]
    start_path = f"opentrons-{version_str}/hardware-testing/hardware_testing/"
    for f in files:
        dest_name = f.replace(start_path, "")
        dest_file = os.path.join(where_to_place, dest_name)
        dat = zf.read(f)
        os.makedirs(os.path.dirname(dest_file), exist_ok=True)
        out = open(dest_file, "wb")
        out.write(dat)
        out.close()
    with open(os.path.join(where_to_place, "VERSION.txt"), "w") as ver_file:
        ver_file.write(version_str)


if os.getenv("RUNNING_ON_VERDIN") is None:
    # we're simulating
    base_dir = str(infer_config_base_dir())
    release = f"{version.replace('a', '-alpha.').replace('b', '-beta.')}"
    version_file_path = os.path.join(base_dir, "hardware_testing", "VERSION.txt")
    if os.path.exists(version_file_path):
        with open(version_file_path, "r") as version_file:
            if version_file.readline() != release:
                _download_and_extract(release, base_dir)
    else:
        _download_and_extract(release, base_dir)
    sys.path.append(base_dir)

from hardware_testing.data import create_run_id, get_git_description  # noqa: E402
from hardware_testing.gravimetric.measurement import (  # noqa: E402
    create_measurement_tag,
    record_measurement_data,
    calculate_change_in_volume,
    MeasurementType,
    MeasurementData,
    SupportedLiquid,
)
from hardware_testing.gravimetric.measurement.scale import Scale  # noqa: E402
from hardware_testing.gravimetric.measurement.environment import (  # noqa: E402
    get_min_reading,
    get_max_reading,
)

from hardware_testing.gravimetric.measurement.record import (  # noqa: E402
    GravimetricRecorder,
    GravimetricRecorderConfig,
)
from hardware_testing.drivers import asair_sensor as AsairDriver  # noqa: E402
from hardware_testing.gravimetric import helpers, report  # noqa: E402

_MEASUREMENTS: List[Tuple[str, MeasurementData]] = list()


@dataclass
class FixtureSettings:
    """Dataclass to hold all the options for a gravimetric script."""

    ctx: ProtocolContext
    name: str
    increment: bool
    run_id: str
    mount: str
    pipette: InstrumentContext
    pipette_volume: int
    pipette_channels: int
    tip_sizes: List[int]
    trials: int
    channels: list[int]
    return_tip: bool
    touch_tip: bool
    liquid_name: str
    liquid: Liquid
    liquid_class: LiquidClass
    tips: Dict[int, List[Well]]
    liquid_source: Well
    volumes: Dict[int, List[float]]
    scale: Scale
    recorder: GravimetricRecorder
    env_sensor: AsairDriver.AsairSensorBase
    robot_serial: str
    scale_serial: str
    env_serial: str
    pipette_tag: str
    test_report: report.CSVReport
    scale_delay: int
    blank_trials: int
    isolate_volumes: bool

    @classmethod
    def build(cls, ctx: ProtocolContext) -> "FixtureSettings":
        """Parse the CSV file and build the fixture settings."""

        def lookup_key(key: str, csv: List[List[str]]) -> List[str]:
            for line in csv:
                if line[0] == key:
                    return line[1:]
            raise ValueError(f"{key} is not defined in the csv params.")

        csv_params = (
            ctx.params.qc_test_profile.parse_as_csv()  # type: ignore [attr-defined]
        )
        name = lookup_key("name", csv_params)[0]
        increment = bool(lookup_key("increment", csv_params)[0] == "TRUE")
        mount = lookup_key("mount", csv_params)[0]
        pipette_volume = int(lookup_key("pipette", csv_params)[0])
        pipette_channels = int(lookup_key("pipette", csv_params)[1])
        if pipette_channels == 8:
            channels = [1, 2, 3, 4, 5, 6, 7, 8]
        else:
            channels = [1]
        tip_sizes = [int(tip) for tip in lookup_key("tips", csv_params)]
        trials = int(lookup_key("trials", csv_params)[0])
        return_tip = bool(lookup_key("return_tip", csv_params)[0] == "TRUE")
        touch_tip = bool(lookup_key("touch_tip", csv_params)[0] == "TRUE")
        liquid_name = lookup_key("liquid", csv_params)[0]
        liquid_desc = lookup_key("liquid", csv_params)[1]
        liquid_col = lookup_key("liquid", csv_params)[2]
        liquid_vol_estimate = float(lookup_key("liquid", csv_params)[3])
        tipracks_20ul = [slot for slot in lookup_key("tipracks_20ul", csv_params)]
        tipracks_50ul = [slot for slot in lookup_key("tipracks_50ul", csv_params)]
        tipracks_200ul = [slot for slot in lookup_key("tipracks_200ul", csv_params)]
        tipracks_1000ul = [slot for slot in lookup_key("tipracks_1000ul", csv_params)]
        labware_on_scale = lookup_key("labware_on_scale", csv_params)[0]
        labware_on_scale_well_name = lookup_key("labware_on_scale", csv_params)[1]
        slot_scale = lookup_key("slot_scale", csv_params)[0]
        volumes_to_test_20ul = [
            float(volume) for volume in lookup_key("volumes_to_test_20ul", csv_params)
        ]
        volumes_to_test_50ul = [
            float(volume) for volume in lookup_key("volumes_to_test_50ul", csv_params)
        ]
        volumes_to_test_200ul = [
            float(volume) for volume in lookup_key("volumes_to_test_200ul", csv_params)
        ]
        volumes_to_test_1000ul = [
            float(volume) for volume in lookup_key("volumes_to_test_1000ul", csv_params)
        ]

        volumes = {
            20: volumes_to_test_20ul,
            50: volumes_to_test_50ul,
            200: volumes_to_test_200ul,
            1000: volumes_to_test_1000ul,
        }
        volumes_flat = (
            volumes_to_test_20ul
            + volumes_to_test_50ul
            + volumes_to_test_200ul
            + volumes_to_test_1000ul
        )

        tipracks_20ul_lw = [
            ctx.load_labware("opentrons_flex_96_tiprack_20uL", slot)
            for slot in tipracks_20ul
        ]
        tipracks_50ul_lw = [
            ctx.load_labware("opentrons_flex_96_tiprack_50uL", slot)
            for slot in tipracks_50ul
        ]
        tipracks_200ul_lw = [
            ctx.load_labware("opentrons_flex_96_tiprack_200uL", slot)
            for slot in tipracks_200ul
        ]
        tipracks_1000ul_lw = [
            ctx.load_labware("opentrons_flex_96_tiprack_1000uL", slot)
            for slot in tipracks_1000ul
        ]
        tips = {}

        def add_tips(size: int, tipracks: List[Labware]) -> None:
            if len(tipracks) > 0:
                wells = []
                for rack in tipracks:
                    wells += rack.wells()
                tips[size] = wells

        add_tips(20, tipracks_20ul_lw)
        add_tips(50, tipracks_50ul_lw)
        add_tips(200, tipracks_200ul_lw)
        add_tips(1000, tipracks_1000ul_lw)

        source_well = ctx.load_labware(labware_on_scale, slot_scale)[
            labware_on_scale_well_name
        ]
        liquid_class = ctx.define_liquid_class(liquid_name)
        liquid = ctx.define_liquid(liquid_name, liquid_desc, liquid_col)
        source_well.load_liquid(liquid, liquid_vol_estimate)

        pipette = ctx.load_instrument(
            f"flex_{pipette_channels}channel_{pipette_volume}", mount
        )
        simulating = ctx.is_simulating()
        run_id = create_run_id()
        scale = Scale.build(simulating)
        scale_serial = scale.read_serial_number()
        recorder = GravimetricRecorder(
            GravimetricRecorderConfig(
                test_name=name,
                run_id=run_id,
                start_time=time(),
                duration=0,
                frequency=1000 if simulating else 5,
                stable=False,
            ),
            scale,
            simulate=simulating,
        )
        recorder.record(in_thread=True)
        env_sensor = AsairDriver.BuildAsairSensor(simulating)
        env_serial = env_sensor.get_serial()
        pipette_tag = helpers._get_tag_from_pipette(pipette, False, False)
        ot3api = ctx._core.get_hardware()
        robot_serial = str(ot3api.get_serial_number())
        fw_version = ot3api.fw_version
        git_description = get_git_description()
        operator_name = "unused"

        test_report = report.create_csv_test_report(
            volumes=volumes_flat,
            pipette_channels=pipette_channels,
            increment=increment,
            trials=trials,
            name=name,
            run_id=run_id,
        )
        os.makedirs(f"{test_report.parent}/{test_report._run_id}", exist_ok=True)
        test_report.set_tag(pipette_tag)
        test_report.set_operator(operator_name)
        test_report.set_version(git_description)
        test_report.set_firmware(fw_version)
        report.store_serial_numbers(
            test_report,
            robot=robot_serial,
            pipette=pipette_tag,
            tips=ctx.params.tip_batch,  # type: ignore [attr-defined]
            scale=recorder.serial_number,
            environment=env_serial,
            liquid=liquid_name,
        )

        return cls(
            ctx=ctx,
            name=name,
            increment=increment,
            run_id=run_id,
            mount=mount,
            pipette=pipette,
            pipette_volume=pipette_volume,
            pipette_channels=pipette_channels,
            tip_sizes=tip_sizes,
            trials=trials,
            channels=channels,
            return_tip=return_tip,
            touch_tip=touch_tip,
            liquid_name=liquid_name,
            liquid=liquid,
            liquid_class=liquid_class,
            tips=tips,
            liquid_source=source_well,
            volumes=volumes,
            scale=scale,
            recorder=recorder,
            env_sensor=env_sensor,
            robot_serial=robot_serial,
            scale_serial=scale_serial,
            env_serial=env_serial,
            pipette_tag=pipette_tag,
            test_report=test_report,
            scale_delay=10,
            blank_trials=10,
            isolate_volumes=False,
        )

    def validate_settings(self) -> bool:
        """Make sure all the settings are valid."""
        # TODO validate settings
        # - Enough tips to handle all the volumes/trials
        # - Tips fit on the given pipette

        return True


def add_parameters(parameters: ParameterContext) -> None:
    """Build the runtime parameters."""
    parameters.add_csv_file("QC test profile", "qc_test_profile")

    parameters.add_int(
        display_name="Tip Batch",
        variable_name="tip_batch",
        minimum=10000000,
        maximum=99999999,
        default=20250101,
        description="Date portion of tip batch.",
    )

    parameters.add_str(
        display_name="Tip Cavity",
        variable_name="cavity",
        default="A",
        choices=[
            {"display_name": name, "value": name}
            for name in [
                "A",
                "B",
                "C",
                "D",
                "E",
                "F",
                "G",
                "H",
                "I",
                "J",
                "K",
                "L",
                "M",
                "N",
                "O",
                "P",
            ]
        ],
        description="Set the target temperature for the pre-heat",
    )


def remove_tip(fixture_settings: FixtureSettings) -> None:
    """Either return or drop tip(s)."""
    if fixture_settings.return_tip:
        fixture_settings.pipette.return_tip()
    else:
        fixture_settings.pipette.drop_tip()


def pick_up_tip_for_channel(
    fixture_settings: FixtureSettings, tip: Well, channel: int
) -> None:
    """Do channel offset if needed."""
    # TODO handle 8 channel
    fixture_settings.pipette.pick_up_tip(tip)


def _update_environment_first_last_min_max(test_report: report.CSVReport) -> None:
    # update this regularly, because the script may exit early
    env_data_list = [m.environment for tag, m in _MEASUREMENTS]
    first_data = env_data_list[0]
    last_data = env_data_list[-1]
    min_data = get_min_reading(env_data_list)
    max_data = get_max_reading(env_data_list)
    report.store_environment(
        test_report, report.EnvironmentReportState.FIRST, first_data
    )
    report.store_environment(test_report, report.EnvironmentReportState.LAST, last_data)
    report.store_environment(test_report, report.EnvironmentReportState.MIN, min_data)
    report.store_environment(test_report, report.EnvironmentReportState.MAX, max_data)


def retract_and_wait(
    fixture_settings: FixtureSettings,
    mode: MeasurementType,
    tip: int,
    volume: float,
    trial: int,
    channel: int = 1,  # TODO hookup
    blank: bool = False,
) -> MeasurementData:
    """Retract away from the scale and record the weight."""
    m_tag = create_measurement_tag(mode, None if blank else volume, channel, trial)
    fixture_settings.pipette._retract()
    m_data = record_measurement_data(
        fixture_settings.ctx,
        m_tag,
        fixture_settings.recorder,
        fixture_settings.mount,
        True,  # Stable is always true
        fixture_settings.env_sensor,
        False,  # Shorten is always false
        fixture_settings.scale_delay,
    )
    report.store_measurement(fixture_settings.test_report, m_tag, m_data)
    _MEASUREMENTS.append(
        (
            m_tag,
            m_data,
        )
    )
    _update_environment_first_last_min_max(fixture_settings.test_report)
    return m_data


def aspirate_with_liquid_class(
    fixture_settings: FixtureSettings,
    tip: int,
    volume: float,
    trial: int,
    channel: int,
    transfer_properties: TransferProperties,
    submerge_depth_override: Optional[float] = None,
) -> None:
    """Aspirate with liquid class."""
    fixture_settings.recorder.set_sample_tag(
        create_measurement_tag("aspirate", volume, channel, trial)
    )
    fixture_settings.pipette._core.aspirate_liquid_class(  # type: ignore [attr-defined]
        volume=volume,
        source=fixture_settings.liquid_source,
        transfer_properties=transfer_properties,
        transfer_type=tx_comps_executor.TransferType.ONE_TO_ONE,
        tip_contents=[
            tx_comps_executor.LiquidAndAirGapPair(
                liquid=0,
                air_gap=0,
            )
        ],
        volume_for_pipette_mode_configuration=volume,
    )


def dispense_with_liquid_class(
    fixture_settings: FixtureSettings,
    tip: int,
    volume: float,
    trial: int,
    channel: int,
    transfer_properties: TransferProperties,
    submerge_depth_override: Optional[float] = None,
) -> None:
    """Dispense with Liquid Class."""
    fixture_settings.recorder.set_sample_tag(
        create_measurement_tag("dispense", volume, channel, trial)
    )
    fixture_settings.pipette._core.dispense_liquid_class(  # type: ignore [attr-defined]
        volume=volume,
        dest=fixture_settings.liquid_source,
        transfer_properties=transfer_properties,
        transfer_type=tx_comps_executor.TransferType.ONE_TO_ONE,
        tip_contents=[
            tx_comps_executor.LiquidAndAirGapPair(  # TODO fix
                liquid=volume,
                air_gap=0,
            )
        ],
        add_final_air_gap=True,
        trash_location=fixture_settings.pipette.trash_container,
    )


def run_blank_test(
    fixture_settings: FixtureSettings, tip: int, volume: float, trial: int
) -> List[MeasurementData]:
    """Run a "blank" trial to measure the evaporation."""
    channel = 1
    next_tip = fixture_settings.tips[tip][
        0
    ]  # this is the next tip we're gonna use we just need the uri
    tiprack_uri = next_tip.parent.uri
    transfer_properties = fixture_settings.liquid_class.get_for(
        fixture_settings.pipette.name, tip_rack=tiprack_uri
    )
    fixture_settings.pipette._core.load_liquid_class(  # type: ignore [attr-defined]
        name=fixture_settings.liquid_class.name,
        transfer_properties=transfer_properties,
        tiprack_uri=tiprack_uri,
    )

    pre_aspriate = retract_and_wait(
        fixture_settings, MeasurementType.INIT, tip, volume, trial, blank=True
    )
    aspirate_with_liquid_class(
        fixture_settings,
        tip,
        volume,
        trial,
        channel,
        transfer_properties=transfer_properties,
        submerge_depth_override=15,
    )
    post_aspirate = retract_and_wait(
        fixture_settings, MeasurementType.ASPIRATE, tip, volume, trial, blank=True
    )
    dispense_with_liquid_class(
        fixture_settings,
        tip,
        volume,
        trial,
        channel,
        transfer_properties=transfer_properties,
        submerge_depth_override=15,
    )
    post_dispense = retract_and_wait(
        fixture_settings, MeasurementType.DISPENSE, tip, volume, trial, blank=True
    )
    return [pre_aspriate, post_aspirate, post_dispense]


def run_one_test(
    fixture_settings: FixtureSettings,
    tip: int,
    volume: float,
    trial: int,
    channel: int,
    last_measurement: MeasurementData,
) -> List[MeasurementData]:
    """Pick up, aspirate, and dispense one trial and write it to the report."""
    tip_well = fixture_settings.tips[tip].pop(0)
    tiprack_uri = tip_well.parent.uri
    transfer_properties = fixture_settings.liquid_class.get_for(
        fixture_settings.pipette.name, tip_rack=tiprack_uri
    )
    fixture_settings.pipette._core.load_liquid_class(  # type: ignore [attr-defined]
        name=fixture_settings.liquid_class.name,
        transfer_properties=transfer_properties,
        tiprack_uri=tiprack_uri,
    )
    pick_up_tip_for_channel(fixture_settings, tip_well, channel)
    pre_aspriate = retract_and_wait(
        fixture_settings,
        MeasurementType.INIT,
        tip,
        volume,
        trial,
    )
    aspirate_with_liquid_class(
        fixture_settings, tip, volume, trial, channel, transfer_properties
    )
    post_aspirate = retract_and_wait(
        fixture_settings, MeasurementType.ASPIRATE, tip, volume, trial
    )
    dispense_with_liquid_class(
        fixture_settings, tip, volume, trial, channel, transfer_properties
    )
    post_dispense = retract_and_wait(
        fixture_settings, MeasurementType.DISPENSE, tip, volume, trial
    )
    remove_tip(fixture_settings)
    return [pre_aspriate, post_aspirate, post_dispense]


def run(ctx: ProtocolContext) -> None:
    """Run."""
    fixture_settings = FixtureSettings.build(ctx)
    first_tip = fixture_settings.tips[list(fixture_settings.tips)[0]].pop(0)
    pick_up_tip_for_channel(fixture_settings, first_tip, 1)
    fixture_settings.pipette.require_liquid_presence(fixture_settings.liquid_source)
    blank_measurments: List[List[MeasurementData]] = []
    measurements: Dict[float, List[List[MeasurementData]]] = {}
    ctx.delay(
        seconds=SCALE_SECONDS_TO_TRUE_STABILIZE,
        msg=f"Waiting {SCALE_SECONDS_TO_TRUE_STABILIZE} for scale to stabalize",
    )
    for i in range(fixture_settings.blank_trials):
        blank_measurments.append(
            run_blank_test(
                fixture_settings,
                fixture_settings.tip_sizes[0],
                fixture_settings.volumes[fixture_settings.tip_sizes[0]][0],
                i,
            )
        )
    liq = SupportedLiquid.from_string(fixture_settings.liquid_name)
    asp_evaps = [
        calculate_change_in_volume(blank[0], blank[1], liq)
        for blank in blank_measurments
    ]
    disp_evaps = [
        calculate_change_in_volume(blank[1], blank[2], liq)
        for blank in blank_measurments
    ]
    avg_asp_evap = sum(asp_evaps) / len(asp_evaps)
    avg_disp_evap = sum(disp_evaps) / len(disp_evaps)
    report.store_average_evaporation(
        fixture_settings.test_report,
        avg_asp_evap,
        avg_disp_evap,
    )
    volume_lost_during_blank = calculate_change_in_volume(
        blank_measurments[0][0], blank_measurments[-1][-1], liq
    )
    if not ctx.is_simulating():
        fixture_settings.liquid_source.load_liquid(
            fixture_settings.liquid,
            fixture_settings.liquid_source.current_liquid_volume()  # type: ignore[arg-type]
            - volume_lost_during_blank,
        )
    remove_tip(fixture_settings)

    last_measurement = blank_measurments[-1][-1]

    for tip in fixture_settings.tips:
        for volume in fixture_settings.volumes[tip]:
            trial_asp_dict: Dict[int, List[float]] = {
                t: [] for t in range(fixture_settings.trials)
            }
            trial_disp_dict: Dict[int, List[float]] = {
                t: [] for t in range(fixture_settings.trials)
            }
            actual_asp_list_channel: List[float] = []
            actual_disp_list_channel: List[float] = []
            measurements[volume] = []
            for channel in fixture_settings.channels:
                channel_aspriate_dict: Dict[int, List[float]]
                for trial in range(fixture_settings.trials):
                    measurements[volume].append(
                        run_one_test(
                            fixture_settings,
                            tip,
                            volume,
                            trial,
                            channel,
                            last_measurement,
                        )
                    )
                    asp_with_evap = (
                        calculate_change_in_volume(
                            measurements[volume][-1][0],
                            measurements[volume][-1][1],
                            liq,
                        )
                        - avg_asp_evap
                    )
                    disp_with_evap = (
                        calculate_change_in_volume(
                            measurements[volume][-1][1],
                            measurements[volume][-1][2],
                            liq,
                        )
                        + avg_disp_evap
                    )
                    cur_height = fixture_settings.liquid_source.current_liquid_height()
                    report.store_trial(
                        fixture_settings.test_report,
                        trial,
                        volume,
                        channel,
                        asp_with_evap,
                        disp_with_evap,
                        cur_height,  # type: ignore[arg-type]
                    )
                    actual_asp_list_channel.append(asp_with_evap)
                    actual_disp_list_channel.append(disp_with_evap)
                    trial_asp_dict[trial].append(asp_with_evap)
                    trial_disp_dict[trial].append(disp_with_evap)
                    last_measurement = measurements[volume][-1][-1]
            aspirate_average, aspirate_cv, aspirate_d = helpers._calculate_stats(
                actual_asp_list_channel, volume
            )
            dispense_average, dispense_cv, dispense_d = helpers._calculate_stats(
                actual_disp_list_channel, volume
            )
            aspirate_data_list = [elem[1] for elem in measurements[volume]]
            dispense_data_list = [elem[2] for elem in measurements[volume]]
            # Average Celsius
            aspirate_celsius_avg = sum(
                a_data.environment.celsius_pipette for a_data in aspirate_data_list
            ) / len(aspirate_data_list)
            dispense_celsius_avg = sum(
                d_data.environment.celsius_pipette for d_data in dispense_data_list
            ) / len(dispense_data_list)
            # Average humidity
            aspirate_humidity_avg = sum(
                a_data.environment.humidity_pipette for a_data in aspirate_data_list
            ) / len(aspirate_data_list)
            dispense_humidity_avg = sum(
                d_data.environment.humidity_pipette for d_data in dispense_data_list
            ) / len(dispense_data_list)

            report.store_volume_per_channel(
                report=fixture_settings.test_report,
                mode="aspirate",
                volume=volume,
                channel=channel,
                average=aspirate_average,
                cv=aspirate_cv,
                d=aspirate_d,
                celsius=aspirate_celsius_avg,
                humidity=aspirate_humidity_avg,
                flag="isolated" if fixture_settings.isolate_volumes else "",
            )
            report.store_volume_per_channel(
                report=fixture_settings.test_report,
                mode="dispense",
                volume=volume,
                channel=channel,
                average=dispense_average,
                cv=dispense_cv,
                d=dispense_d,
                celsius=dispense_celsius_avg,
                humidity=dispense_humidity_avg,
                flag="isolated" if fixture_settings.isolate_volumes else "",
            )
            for trial in range(fixture_settings.trials):
                aspirate_average, aspirate_cv, aspirate_d = helpers._calculate_stats(
                    trial_asp_dict[trial], volume
                )
                dispense_average, dispense_cv, dispense_d = helpers._calculate_stats(
                    trial_disp_dict[trial], volume
                )
                report.store_volume_per_trial(
                    report=fixture_settings.test_report,
                    mode="aspirate",
                    volume=volume,
                    trial=trial,
                    average=aspirate_average,
                    cv=aspirate_cv,
                    d=aspirate_d,
                    flag="isolated" if fixture_settings.isolate_volumes else "",
                )
                report.store_volume_per_trial(
                    report=fixture_settings.test_report,
                    mode="dispense",
                    volume=volume,
                    trial=trial,
                    average=dispense_average,
                    cv=dispense_cv,
                    d=dispense_d,
                    flag="isolated" if fixture_settings.isolate_volumes else "",
                )
