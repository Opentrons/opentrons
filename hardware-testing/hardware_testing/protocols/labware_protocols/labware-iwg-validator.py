"""Inner Well Geometry Validator Protocol.

This protocol should be used to validate inner well geometry definitions of labware.
"""

from opentrons.protocol_api import (
    ProtocolContext,
    Labware,
    LiquidClass,
    InstrumentContext,
    ParameterContext,
    SINGLE,
)
from opentrons_shared_data.liquid_classes.liquid_class_definition import (
    PositionReference,
)
from typing import List, Optional, Union
from opentrons.types import Point
from opentrons.protocol_engine.types.liquid_level_detection import SimulatedProbeResult
from dataclasses import dataclass, field
import os
import time
import serial  # type: ignore[import]

###########################################
#  SET LABWARE HERE
###########################################

LABWARE = "example_labware"

###########################################
#  GLOBAL VARIABLES
###########################################

SLOT_LIQUID_TIPRACKS = ["D3", "B3"]
SLOT_PROBING_TIPRACK = "D2"
SLOT_LABWARE = "D1"
SLOT_RESERVOIR = "C1"
SLOT_DIAL = "B2"
CSV_SEPARATOR = ""
RUN_ID = ""
DATA_FILE_PATH = ""
DIAL_PORT_NAME = "/dev/ttyUSB0"
DIAL_POS_WITHOUT_TIP: List[Optional[float]] = [None, None]
JUPYTER_DATA_DIR = "/var/lib/jupyter/notebooks/"
CSV_HEADER = [
    "Well",
    "Volume (ul)",
    "Height (mm)",
    "Expected Height",
    "Error %",
    "Tip-Z-Error (mm)",
]

metadata = {"protocolName": "volume-validator", "author": "hovan.ngo@opentrons.com"}
requirements = {"robotType": "Flex", "apiLevel": "2.24"}

#########################
# Configuration and Data
#########################


@dataclass
class SetupState:
    """Setup and configure the protocol."""

    labware: Labware
    src: Labware
    dial: Optional[Labware]
    probe_pipette: InstrumentContext
    liq_pipette: InstrumentContext
    liquid_racks: list[Labware]
    right_mount: InstrumentContext
    liq_tip_size: str
    n_trials: int
    labware_type: str
    n_regions: int
    wells_and_heights: List[tuple[str, float]]
    ethanol: LiquidClass

    def pick_up_tips(self) -> None:
        """Pick up tips."""
        if not self.probe_pipette.has_tip:
            self.probe_pipette.pick_up_tip()
        if not self.liq_pipette.has_tip:
            self.liq_pipette.pick_up_tip()

    def drop_tips(self) -> None:
        """Drop tips."""
        if self.probe_pipette.has_tip:
            self.probe_pipette.drop_tip()
        if self.liq_pipette.has_tip:
            self.liq_pipette.drop_tip()


@dataclass(frozen=True)
class TrialResult:
    """Snapshot result of each trial."""

    current_well: str
    expected_volume: float
    measured_height: float
    expected_height: float
    accuracy: float
    tip_z_error: float


@dataclass
class TrialState:
    """Data that changes per-trial / dispense."""

    current_well: str = "None"
    expected_volume: float = 0.0
    expected_height: float = 0.0
    measured_height: float = 0.0
    tip_z_error: float = 0.0
    accuracy: float = 0.0
    results: List[TrialResult] = field(default_factory=list)
    idx: int = 0

    def get_height_of_liquid_in_well(
        self, ctx: ProtocolContext, config: SetupState, source: bool = False
    ) -> float:
        """Get height of liquid in well."""

        def extract_float(result: Union[float | SimulatedProbeResult]) -> float:
            """Extract float."""
            if isinstance(result, SimulatedProbeResult):
                return result.net_liquid_exchanged_after_probe
            return float(result)

        if not ctx.is_simulating():
            if source:
                return extract_float(
                    config.liq_pipette.measure_liquid_height(config.src["A1"])
                )
            return extract_float(
                config.probe_pipette.measure_liquid_height(
                    config.labware[self.current_well]
                )
            )
        else:
            return 0.0

    def add_result(self) -> None:
        """Adds the current step's results to the results list."""
        self.results.append(
            TrialResult(
                current_well=self.current_well,
                expected_volume=round(self.expected_volume, 5),
                measured_height=round(self.measured_height, 5),
                expected_height=round(self.expected_height, 5),
                accuracy=round(self.accuracy, 5),
                tip_z_error=round(self.tip_z_error, 5),
            )
        )


class Data:
    """Class for data manipulation methods."""

    @staticmethod
    def write_line_to_csv(
        ctx: ProtocolContext, file_path: str, line: list[str]
    ) -> None:
        """Writes a formatted line to a designated path."""
        if not ctx.is_simulating():
            formatted = [str(item).ljust(18) for item in line]
            with open(file_path, "a") as f:
                f.write(",".join(formatted) + "\n")

    @staticmethod
    def create_file_name(
        test_name: str, run_id: str, tag: str, extension: str = "csv"
    ) -> str:
        """Create a file name, given a test name."""
        return f"{test_name}_{run_id}_{tag}.{extension}"

    @staticmethod
    def create_run_id() -> str:
        """Create a run ID using the datetime string."""
        date_time_string = time.strftime("%y-%m-%d-%H-%M-%S", time.localtime())
        return f"run-{date_time_string}"

    @staticmethod
    def extract_float(result: Union[float | SimulatedProbeResult]) -> float:
        """Extract float."""
        if isinstance(result, SimulatedProbeResult):
            return result.net_liquid_exchanged_after_probe
        return float(result)

    @staticmethod
    def write_trial_log(ctx: ProtocolContext, trial: TrialState) -> None:
        """Writes the current step's results to the CSV."""
        trial.add_result()
        trial_data = trial.results[-1]
        Data.write_line_to_csv(
            ctx, DATA_FILE_PATH, [str(v) for v in vars(trial_data).values()]
        )


class Mitutoyo_Digimatic_Indicator:
    """Driver class to use dial indicator."""

    def __init__(self, port: str = "/dev/ttyUSB0", baudrate: int = 9600) -> None:
        """Initialize class."""
        self.PORT = port
        self.BAUDRATE = baudrate
        self.TIMEOUT = 0.1
        self.error_count = 0
        self.max_errors = 100
        self.unlimited_errors = False
        self.raise_exceptions = True
        self.reading_raw = ""
        self.GCODE = {
            "READ": "r",
        }
        self.gauge: serial.Serial | None = None
        self.packet: str = ""

    def connect(self) -> None:
        """Connect communication ports."""
        try:
            self.gauge = serial.Serial(
                port=self.PORT,
                baudrate=self.BAUDRATE,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE,
                bytesize=serial.EIGHTBITS,
                timeout=self.TIMEOUT,
            )
        except serial.SerialException:
            error = "Unable to access Serial port"
            raise serial.SerialException(error)

    def disconnect(self) -> None:
        """Disconnect communication ports."""
        if self.gauge is not None:
            self.gauge.close()

    def send_packet(self, packet: str) -> None:
        """Sends GCODE packet to dial indicator."""
        if self.gauge is not None:
            self.gauge.flush()
            self.gauge.reset_input_buffer()
            self.gauge.write(packet.encode())

    def get_packet(self) -> str:
        """Gets packet from dial indicator."""
        packet = ""
        if self.gauge is not None:
            self.gauge.reset_output_buffer()
            packet = self.gauge.readline().decode("utf-8")
        return packet

    def read(self) -> float:
        """Reads dial indicator."""
        self.packet = self.GCODE["READ"]
        self.send_packet(self.packet)
        time.sleep(0.001)
        reading = True
        value = 0.0  # Initialize value to avoid unbound error
        while reading:
            data = self.get_packet()
            time.sleep(0.01)
            if data != "":
                try:
                    value = float(data)
                    reading = False
                except ValueError:
                    continue
        return value

    def read_dial_indicator(
        self,
        ctx: ProtocolContext,
        pipette: InstrumentContext,
        dial: Labware,
        front_channel: bool = False,
    ) -> float:
        """Reads dial indicator value."""
        target = dial["A1"].top()
        if front_channel:
            target = target.move(Point(y=9 * 7))
            if pipette.channels == 96:
                target = target.move(Point(x=9 * -11))
        pipette.move_to(target.move(Point(z=5)))
        pipette.move_to(target)
        ctx.delay(seconds=2)
        if ctx.is_simulating():
            return 0.0
        dial_port = self.read()  # type: ignore[union-attr]
        pipette.move_to(target.move(Point(z=5)))
        return dial_port

    def store_dial_baseline(
        self,
        ctx: ProtocolContext,
        pipette: InstrumentContext,
        dial: Labware,
        front_channel: bool = False,
    ) -> None:
        """Stores dial baseline value without tip."""
        global DIAL_POS_WITHOUT_TIP
        idx = 0 if not front_channel else 1
        if DIAL_POS_WITHOUT_TIP[idx] is not None:
            return
        DIAL_POS_WITHOUT_TIP[idx] = self.read_dial_indicator(
            ctx, pipette, dial, front_channel
        )
        tag = f"DIAL-BASELINE-{idx}"
        Data.write_line_to_csv(
            ctx, DATA_FILE_PATH, [tag, str(DIAL_POS_WITHOUT_TIP[idx])]
        )

    def get_tip_z_error(
        self,
        ctx: ProtocolContext,
        pipette: InstrumentContext,
        dial: Labware,
        front_channel: bool = False,
    ) -> float:
        """Gets tip Z error value."""
        idx = 0 if not front_channel else 1
        baseline = DIAL_POS_WITHOUT_TIP[idx]
        assert baseline is not None
        new_val = self.read_dial_indicator(ctx, pipette, dial, front_channel)
        return (new_val - baseline) * -1.0


######################
# End of classes
######################


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters."""
    parameters.add_str(
        variable_name="left_mount",
        display_name="Left Mount",
        description="Probing Pipette Type on Left Mount.",
        choices=[
            {"display_name": "1ch 50ul", "value": "flex_1channel_50"},
            {"display_name": "1ch 1000ul", "value": "flex_1channel_1000"},
            {"display_name": "8ch 50ul", "value": "flex_8channel_50"},
            {"display_name": "8ch 1000ul", "value": "flex_8channel_1000"},
        ],
        default="flex_1channel_50",
    )

    parameters.add_str(
        variable_name="right_mount",
        display_name="Right Mount",
        description="Liquid Pipette Type on Right Mount.",
        choices=[
            {"display_name": "1ch 50ul", "value": "flex_1channel_50"},
            {"display_name": "1ch 1000ul", "value": "flex_1channel_1000"},
            {"display_name": "8ch 50ul", "value": "flex_8channel_50"},
            {"display_name": "8ch 1000ul", "value": "flex_8channel_1000"},
        ],
        default="flex_1channel_1000",
    )

    parameters.add_int(
        variable_name="n_regions",
        display_name="Number of Regions",
        description="How many discrete depth levels to test within each well.",
        default=3,
        minimum=2,
        maximum=20,
    )

    parameters.add_int(
        variable_name="n_trials",
        display_name="Trials Per Region",
        description="Number of repeated measurements to perform at each depth region.",
        default=3,
        minimum=1,
        maximum=20,
    )

    parameters.add_str(
        variable_name="liq_tip_size",
        display_name="Liquid Tip Size",
        choices=[
            {"display_name": "1000", "value": "1000"},
            {"display_name": "50", "value": "50"},
        ],
        default="1000",
    )

    parameters.add_bool(
        variable_name="dial_indicator_used",
        display_name="Dial Indicator Use",
        description="Used to calibrate tip overlap.",
        default=True,
    )


def _setup(ctx: ProtocolContext) -> SetupState:
    """Setup."""
    global RUN_ID, DATA_FILE_PATH, LABWARE

    left_mount = ctx.params.left_mount  # type: ignore[attr-defined]
    right_mount = ctx.params.right_mount  # type: ignore[attr-defined]
    liq_tip_size = ctx.params.liq_tip_size  # type: ignore[attr-defined]
    n_regions = ctx.params.n_regions  # type: ignore[attr-defined]
    n_trials = ctx.params.n_trials  # type: ignore[attr-defined]
    dial_indicator_used = ctx.params.dial_indicator_used  # type: ignore[attr-defined]

    labware_type = LABWARE
    labware = ctx.load_labware(labware_type, SLOT_LABWARE)
    labware.load_empty(labware.wells())

    src = ctx.load_labware("nest_1_reservoir_290ml", SLOT_RESERVOIR)
    ethanol_liq = ctx.define_liquid("Ethanol", display_color="#FFFFC5")
    ethanol = ctx.get_liquid_class(name="ethanol_80")
    src["A1"].load_liquid(ethanol_liq, src["A1"].max_volume - 1000)
    ctx.load_trash_bin("A3")

    dial: Optional[Labware] = None
    if dial_indicator_used and not ctx.is_simulating():
        dial = ctx.load_labware("dial_indicator", SLOT_DIAL)

    liquid_racks = [
        ctx.load_labware(f"opentrons_flex_96_tiprack_{liq_tip_size}ul", slot)
        for slot in SLOT_LIQUID_TIPRACKS
    ]
    probe_tip_rack = ctx.load_labware(
        "opentrons_flex_96_tiprack_50ul", SLOT_PROBING_TIPRACK
    )
    probe_pipette = ctx.load_instrument(left_mount, "left", tip_racks=[probe_tip_rack])
    liq_pipette = ctx.load_instrument(right_mount, "right", tip_racks=liquid_racks)
    if liq_pipette.channels == 8:
        liq_pipette.configure_nozzle_layout(
            style=SINGLE, start="H1", tip_racks=liquid_racks
        )

    wells = list(labware.wells_by_name().keys())

    # Calculate region heights
    max_vol = labware["A1"].max_volume
    max_height = Data.extract_float(labware["A1"].height_from_volume(max_vol))
    if n_regions == 3:
        # special case: 3.0mm, 50%, 100%
        region_heights = [3.0, max_height * 0.5, max_height]
    else:
        segment_vol = max_vol / float(n_regions)
        region_heights = [
            Data.extract_float(labware["A1"].height_from_volume(segment_vol * (i + 1)))
            for i in range(n_regions)
        ]
    expected_heights: List = []
    for region_height in region_heights:
        expected_heights.extend([region_height] * n_trials)

    # mapping expected heights to wells
    wells_and_heights: list[tuple[str, float]] = []
    for i, height in enumerate(expected_heights):
        well = wells[i % len(wells)]
        wells_and_heights.append((well, height))

    if not ctx.is_simulating():

        RUN_ID = Data.create_run_id()
        data_folder = os.path.join(JUPYTER_DATA_DIR, "IWG-validation")
        data_file_name = Data.create_file_name(
            metadata["protocolName"], RUN_ID, labware_type
        )
        os.makedirs(data_folder, exist_ok=True)
        DATA_FILE_PATH = os.path.join(data_folder, data_file_name)

        Data.write_line_to_csv(ctx, DATA_FILE_PATH, [RUN_ID])
        Data.write_line_to_csv(ctx, DATA_FILE_PATH, [labware_type])

    return SetupState(
        liq_pipette=liq_pipette,
        probe_pipette=probe_pipette,
        labware=labware,
        labware_type=labware_type,
        src=src,
        dial=dial,
        liquid_racks=liquid_racks,
        liq_tip_size=liq_tip_size,
        right_mount=liq_pipette,
        n_trials=n_trials,
        n_regions=n_regions,
        wells_and_heights=wells_and_heights,
        ethanol=ethanol,
    )


def get_transfer_props(volume: float, config: SetupState) -> None:
    """Get aspirate/dispense properties for ethanol liquid class. You can change these."""
    # this tries to mitigate liquid forming on the tip for small dispenses.
    if volume > 15:
        dispense_offset = 0.1
    else:
        dispense_offset = 0.1

    # set pipette behavior based on tip size
    if config.liq_tip_size == "50":
        blowout_rate = 50
        pushout_volume = 1.5
        flow_rate = 35
    elif config.liq_tip_size == "1000":
        blowout_rate = 716
        pushout_volume = 2.0
        flow_rate = 80
    else:
        raise ValueError("Invalid tip size.")

    meniscus_z = -0.5
    lm = "liquid-meniscus"
    wt = PositionReference.WELL_TOP
    for rack in config.liquid_racks:
        ethanol_props = config.ethanol.get_for(config.right_mount, rack)
        ethanol_props.aspirate.aspirate_position.position_reference = lm  # type: ignore[assignment]
        ethanol_props.aspirate.aspirate_position.offset.z = meniscus_z
        ethanol_props.dispense.dispense_position.position_reference = lm  # type: ignore[assignment]
        ethanol_props.dispense.dispense_position.offset.z = dispense_offset
        ethanol_props.dispense.flow_rate_by_volume.set_for_all_volumes(flow_rate)
        ethanol_props.dispense.submerge.speed = 50
        ethanol_props.dispense.retract.speed = 50
        ethanol_props.dispense.push_out_by_volume.set_for_all_volumes(pushout_volume)
        ethanol_props.dispense.retract.blowout.flow_rate = blowout_rate
        ethanol_props.dispense.retract.blowout.enabled = True
        ethanol_props.dispense.retract.end_position.position_reference = wt
        ethanol_props.dispense.retract.end_position.offset.z = 5


def prepare_transfer(
    ctx: ProtocolContext,
    config: SetupState,
    trial: TrialState,
) -> float:
    """Prepare for transfer and return dispense volume."""
    if trial.idx == 0:
        trial.get_height_of_liquid_in_well(ctx, config, source=True)
    volume_per_channel = trial.expected_volume / config.liq_pipette.active_channels
    get_transfer_props(volume_per_channel, config)
    return volume_per_channel


def aspirate_dispense_measure(
    ctx: ProtocolContext,
    config: SetupState,
    trial: TrialState,
    dial: Optional[Mitutoyo_Digimatic_Indicator],
) -> list[float]:
    """Aspirate from source, dispense into labware, returns list of measured heights obtained."""
    measured_heights: list[float] = []
    num_wells = len(config.labware.wells())

    if dial and config.dial:
        dial.store_dial_baseline(ctx, config.probe_pipette, config.dial)
    Data.write_line_to_csv(ctx, DATA_FILE_PATH, CSV_HEADER)

    for trial_idx, (well, expected_height) in enumerate(config.wells_and_heights):
        config.pick_up_tips()

        trial.idx = trial_idx
        trial.current_well = well
        trial.expected_height = expected_height

        no_more_wells = (trial_idx > 0) and (trial_idx % num_wells == 0)
        if no_more_wells:
            ctx.pause("Dump the labware and replace it.")
            trial.get_height_of_liquid_in_well(ctx, config, source=True)

        if dial and config.dial:
            trial.tip_z_error = dial.get_tip_z_error(
                ctx, config.probe_pipette, config.dial
            )

        trial.expected_volume = Data.extract_float(
            config.labware[trial.current_well].volume_from_height(expected_height)
        )
        dispense_volume = prepare_transfer(ctx, config, trial)

        config.liq_pipette.transfer_with_liquid_class(
            liquid_class=config.ethanol,
            volume=dispense_volume,
            source=config.src["A1"],
            dest=config.labware[trial.current_well],
            new_tip="never",
            return_tip=False,
        )

        # Touch tip if clearance allows
        if trial.expected_height <= config.labware["A1"].depth - 4:
            config.liq_pipette.touch_tip()

        height = trial.get_height_of_liquid_in_well(ctx, config)
        trial.measured_height = height + trial.tip_z_error
        measured_heights.append(trial.measured_height)

        trial.accuracy = (
            (trial.measured_height - expected_height) / expected_height * 100
        )
        Data.write_trial_log(ctx, trial)  # log 0th step as baseline

        config.drop_tips()

    return measured_heights


def build_csv_results(
    ctx: ProtocolContext,
    config: SetupState,
    measured_heights: list[float],
) -> tuple[str, str]:
    """Build CSV results to map measured heights to expected heights in each well region."""
    csv_values: List[str] = []
    csv_headers: List[str] = []
    header_str = ""
    line_str = ""

    # splits up the measured heights by the region to compute error per region
    if not ctx.is_simulating():
        for region_idx in range(config.n_regions):
            start = region_idx * config.n_trials
            end = start + config.n_trials

            region_measured = measured_heights[start:end]
            region_expected = [
                height for (_, height) in config.wells_and_heights[start:end]
            ]

            # compute average error for region
            measured_and_expected = zip(region_measured, region_expected)
            abs_errors = [abs(m - e) for m, e in measured_and_expected]
            avg_error = sum(abs_errors) / len(abs_errors) if abs_errors else 0.0

            # add trial columns
            csv_headers.extend(
                [f"region{region_idx+1}_trial{t+1}" for t in range(config.n_trials)]
            )
            csv_values.extend([f"{m:.3f}" for m in region_measured])

            csv_headers.append(f"region{region_idx+1}_expected")
            csv_values.append(f"{region_expected[0]:.3f}")
            csv_headers.append(f"region{region_idx+1}_avg_error")
            csv_values.append(f"{avg_error:.3f}")

        header = ["labware_type"] + csv_headers
        row = [config.labware_type] + csv_values

        header_str = ",".join(header)
        line_str = ",".join(row)
    return header_str, line_str


def run(ctx: ProtocolContext) -> None:
    """Protocol."""
    config = _setup(ctx)
    trial = TrialState()
    dial = Mitutoyo_Digimatic_Indicator() if config.dial else None
    if dial:
        dial.connect()
    measured_heights = aspirate_dispense_measure(ctx, config, trial, dial)

    header_str, line_str = build_csv_results(ctx, config, measured_heights)
    Data.write_line_to_csv(ctx, DATA_FILE_PATH, [header_str])
    Data.write_line_to_csv(ctx, DATA_FILE_PATH, [line_str])
    ctx.pause(f"{header_str}\n{line_str}")

    config.drop_tips()
