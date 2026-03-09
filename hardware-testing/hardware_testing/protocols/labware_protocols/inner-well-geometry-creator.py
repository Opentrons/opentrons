"""Inner Labware Geometry Creator Protocol.

This protocol updates a custom labware definition with its inner labware geometry
through a sequence of aspirating, dispensing, and measuring liquid height.
"""

from typing import List, Optional, Union
from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    InstrumentContext,
    Labware,
    LiquidClass,
    SINGLE,
)
from opentrons_shared_data.liquid_classes.liquid_class_definition import (
    PositionReference,
)
from opentrons.types import Point
from opentrons.protocol_engine.types.liquid_level_detection import SimulatedProbeResult
import numpy as np
import json
from dataclasses import dataclass, field
from collections import OrderedDict
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

RESERVOIR = "nest_1_reservoir_290ml"
LIQUID_MOUNT = "right"
LIQUID_PIPETTE_SIZE = 1000
PROBING_MOUNT = "left"
PROBING_TIP_SIZE = 50
PROBING_PIPETTE_SIZE = 50
SLOT_LIQUID_TIPRACKS = ["D3", "B3"]
SLOT_PROBING_TIPRACK = "D2"
SLOT_LABWARE = "D1"
SLOT_RESERVOIR = "C1"
SLOT_DIAL = "B2"
DIAL_PORT_NAME = "/dev/ttyUSB0"
DIAL = None
DIAL_POS_WITHOUT_TIP: List[Optional[float]] = [None, None]
JUPYTER_DATA_DIR = "/var/lib/jupyter/notebooks/"
RUN_ID = ""
DATA_FILE_PATH = ""
CSV_HEADER = [
    "well",
    "step volume",
    "dispense volume",
    "tip-z-error",
    "height",
    "hdelta",
    "status",
]

metadata = {
    "protocolName": "inner-well-geometry-creator",
    "author": "hovan.ngo@opentrons.com",
}
requirements = {"robotType": "Flex", "apiLevel": "2.24"}

#########################
# Configuration and Data
#########################


@dataclass
class SetupState:
    """Configure static data for the protocol."""

    liq_pipette: InstrumentContext
    probe_pipette: InstrumentContext
    labware: Labware
    src: Labware
    dial: Optional[Labware]
    first_dispense: float
    target_height: float
    labware_type: str
    wells: list[str]
    max_volume: float
    lower_bound: float
    upper_bound: float
    min_step: float
    max_step: float
    delta_tolerance: float
    liquid_racks: list[Labware]
    liquid_mount: InstrumentContext
    liquid_tip: str
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

    well: str
    step_volume: float
    dispense_volume: float
    tip_z_error: float
    height: float
    hdelta: float
    status: str


@dataclass
class TrialState:
    """Data that changes per-trial / dispense."""

    current_well: str = "none"
    status: str = "none"
    step_volume: float = 0.0
    dispense_volume: float = 0.0
    hdelta: float = 0.0
    corrected_height: float = 0.0
    tip_z_error: float = 0.0
    corrected_heights: List[float] = field(default_factory=lambda: [0.0])
    results: List[TrialResult] = field(default_factory=list)
    step: int = 0

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

    def get_liquid_height(self, ctx: ProtocolContext, config: SetupState) -> None:
        """Probes the liquid height, corrects it for tip error, and stores it."""
        height = self.get_height_of_liquid_in_well(ctx, config)
        if height > config.labware[self.current_well].depth:
            raise ValueError("Measured height exceeded well depth.")
        self.corrected_height = height + self.tip_z_error
        self.corrected_heights.append(self.corrected_height)

    def get_alpha_for_height(self, config: SetupState) -> float:
        """Return sensitivity factor depending on well size."""
        if config.max_volume >= 100000:
            alpha = 0.3
        elif config.max_volume >= 5000:
            alpha = 0.5
        elif config.max_volume >= 3000:
            alpha = 0.7
        elif config.max_volume >= 350:
            alpha = 0.8
        elif config.max_volume >= 90:
            alpha = 1.0
        else:
            alpha = 1.0
        return alpha

    # Proportional Controller
    def calculate_step_volume(self, config: SetupState) -> None:
        """Return a new step volume based on the hdelta error from target."""
        max_increase_multiplier = 2.0  # means at most double of previous step volume
        max_decrease_multiplier = 0.5  # means at least half of previous step volume
        alpha = self.get_alpha_for_height(config)

        if self.hdelta < config.lower_bound and self.hdelta > 0:
            error = config.target_height - self.hdelta
            new_volume = self.step_volume * min(
                max_increase_multiplier, 1 + alpha * error
            )
        elif self.hdelta > config.upper_bound:
            error = self.hdelta - config.target_height
            new_volume = self.step_volume * max(
                max_decrease_multiplier, 1 - alpha * error
            )
        else:
            new_volume = self.step_volume

        self.step_volume = max(config.min_step, min(config.max_step, new_volume))
        # clamp step volume such that the total dispense does not exceed max volume
        self.step_volume = min(
            self.step_volume, config.max_volume - self.dispense_volume
        )

    def compute_height_delta(self) -> None:
        """Calculates the change in liquid level."""
        self.hdelta = (
            self.corrected_heights[-1] - self.corrected_heights[-2]
            if len(self.corrected_heights) > 1
            else 0.0
        )

    def get_step_status(self, ctx: ProtocolContext, config: SetupState) -> str:
        """Evaluate the step and assign status: pass, fail, final, or sim."""
        if ctx.is_simulating():
            self.status = "sim"
            return self.status
        if self.step == 0:
            if 2.0 < self.hdelta < 3.0:
                self.status = "pass"
            else:
                ctx.pause(
                    f"First dispense volume {config.first_dispense}uL too "
                    f"{'low' if self.hdelta < 2.0 else 'high'}. "
                    f"Height was {self.corrected_height}mm. Adjust and restart."
                )
                self.status = "fail"
            return self.status
        # if 10uL away from max volume, then set final
        if self.dispense_volume >= config.max_volume - 10.0:
            self.status = "final"
            return self.status
        if config.lower_bound < self.hdelta < config.upper_bound:
            self.status = "pass"
        else:
            self.status = "fail"
        return self.status

    def add_result(self) -> None:
        """Adds the current step's results to the results list."""
        self.results.append(
            TrialResult(
                well=self.current_well,
                step_volume=round(self.step_volume, 5),
                dispense_volume=round(self.dispense_volume, 5),
                tip_z_error=round(self.tip_z_error, 5),
                height=round(self.corrected_height, 5),
                hdelta=round(self.hdelta, 5),
                status=self.status,
            )
        )

    def rollback_last_data_point(self) -> None:
        """Cancels the step that failed to prepare for a retry."""
        self.dispense_volume -= self.step_volume  # rollback dispense volume
        self.corrected_heights.pop()  # rollback corrected heights


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
        """Connect communication portrial."""
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
        """Disconnect communication portrial."""
        if self.gauge is not None:
            self.gauge.close()

    def send_packet(self, packet: str) -> None:
        """Sends GCODE packet to dial indicator."""
        if self.gauge is not None:
            self.gauge.flush()
            self.gauge.reset_input_buffer()
            self.gauge.write(packet.encode())

    def get_packet(self) -> str:
        """Gets GCODE packet from dial indicator."""
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
        """Reads the dial indicator value."""
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
        dial_value = self.read()
        pipette.move_to(target.move(Point(z=5)))
        return dial_value

    def store_dial_baseline(
        self,
        ctx: ProtocolContext,
        pipette: InstrumentContext,
        dial: Labware,
        front_channel: bool = False,
    ) -> None:
        """Stores the dial indicator baseline value without a tip."""
        idx = 0 if not front_channel else 1
        if DIAL_POS_WITHOUT_TIP[idx] is not None:
            return
        DIAL_POS_WITHOUT_TIP[idx] = self.read_dial_indicator(
            ctx, pipette, dial, front_channel
        )
        Data.write_line_to_csv(
            ctx, DATA_FILE_PATH, [f"DIALBASELINE{idx}", str(DIAL_POS_WITHOUT_TIP[idx])]
        )

    def get_tip_z_error(
        self,
        ctx: ProtocolContext,
        pipette: InstrumentContext,
        dial: Labware,
        front_channel: bool = False,
    ) -> float:
        """Calculates the tip overlap error from dial indicator reading."""
        idx = 0 if not front_channel else 1
        baseline = DIAL_POS_WITHOUT_TIP[idx]
        assert baseline is not None
        new_val = self.read_dial_indicator(ctx, pipette, dial, front_channel)
        return (new_val - baseline) * -1.0


######################
# End of classes
######################


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters to the protocol."""
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

    parameters.add_float(
        display_name="First Dispense",
        variable_name="first_dispense",
        description="Set a starting dispense amount that would reach 2-3mm in the well.",
        default=50.0,
        maximum=99999.0,
        minimum=1.0,
    )

    parameters.add_float(
        variable_name="target_height",
        display_name="Step Height Target",
        description="Specify the desired target step height, i.e 1mm",
        default=1.0,
        maximum=3.0,
        minimum=0.5,
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
    """Sets up the static data for the protocol."""
    global RUN_ID, LABWARE, DATA_FILE_PATH

    labware_type = LABWARE
    first_dispense = ctx.params.first_dispense  # type: ignore[attr-defined]
    target_height = ctx.params.target_height  # type: ignore[attr-defined]
    liq_tip_size = ctx.params.liq_tip_size  # type: ignore[attr-defined]
    left_mount = ctx.params.left_mount  # type: ignore[attr-defined]
    right_mount = ctx.params.right_mount  # type: ignore[attr-defined]
    dial_indicator_used = ctx.params.dial_indicator_used  # type: ignore[attr-defined]

    # tipracks
    liquid_racks = [
        ctx.load_labware(f"opentrons_flex_96_tiprack_{liq_tip_size}ul", slot)
        for slot in SLOT_LIQUID_TIPRACKS
    ]
    probing_rack = ctx.load_labware(
        f"opentrons_flex_96_tiprack_{PROBING_TIP_SIZE}uL", SLOT_PROBING_TIPRACK
    )

    # load pipettes
    probe_pipette = ctx.load_instrument(
        left_mount, PROBING_MOUNT, tip_racks=[probing_rack]
    )
    if probe_pipette.channels == 8:
        probe_pipette.configure_nozzle_layout(
            style=SINGLE, start="H1", tip_racks=[probing_rack]
        )
    liq_pipette = ctx.load_instrument(right_mount, LIQUID_MOUNT, tip_racks=liquid_racks)
    if liq_pipette.channels == 8:
        liq_pipette.configure_nozzle_layout(
            style=SINGLE, start="H1", tip_racks=liquid_racks
        )

    # load labware + dial
    labware = ctx.load_labware(labware_type, SLOT_LABWARE)
    labware.load_empty(labware.wells())
    wells = list(labware.wells_by_name().keys())
    src = ctx.load_labware(RESERVOIR, SLOT_RESERVOIR)
    ctx.load_trash_bin("A3")
    max_volume = labware["A1"].max_volume

    dial: Optional[Labware] = None
    if dial_indicator_used and not ctx.is_simulating():
        dial = ctx.load_labware("dial_indicator", SLOT_DIAL)

    # if within these bounds, then feedback loop doesnt make any changes
    delta_tolerance = 0.2
    lower_bound = target_height - delta_tolerance
    upper_bound = target_height + delta_tolerance

    # volume clamps for the feedback loop
    min_step = max(max_volume * 0.01, 1)  # the lowest possible step
    max_step = max_volume * 0.25  # the highest possible step

    # liquid
    ethanol_liq = ctx.define_liquid("Ethanol", display_color="#FFFFC5")
    src["A1"].load_liquid(ethanol_liq, src["A1"].max_volume - 1000)
    ethanol = ctx.get_liquid_class(name="ethanol_80")

    if not ctx.is_simulating():
        RUN_ID = Data.create_run_id()
        data_folder = os.path.join(JUPYTER_DATA_DIR, "IWG-data")  # makes Data folder
        data_file_name = Data.create_file_name(
            metadata["protocolName"], RUN_ID, labware_type
        )
        os.makedirs(data_folder, exist_ok=True)
        DATA_FILE_PATH = os.path.join(data_folder, data_file_name)

        Data.write_line_to_csv(ctx, DATA_FILE_PATH, [RUN_ID])
        Data.write_line_to_csv(ctx, DATA_FILE_PATH, [right_mount])
        Data.write_line_to_csv(ctx, DATA_FILE_PATH, [left_mount])
        Data.write_line_to_csv(ctx, DATA_FILE_PATH, [labware_type])
        Data.write_line_to_csv(
            ctx, DATA_FILE_PATH, ["target height", str(target_height)]
        )
        Data.write_line_to_csv(ctx, DATA_FILE_PATH, ["depth", str(labware["A1"].depth)])
        lpc = str(labware._core.get_calibrated_offset())
        Data.write_line_to_csv(
            ctx, DATA_FILE_PATH, ["LPC Offset", labware.load_name, lpc]
        )

    return SetupState(
        liq_pipette=liq_pipette,
        probe_pipette=probe_pipette,
        labware=labware,
        src=src,
        dial=dial,
        first_dispense=first_dispense,
        target_height=target_height,
        labware_type=labware_type,
        wells=wells,
        max_volume=max_volume,
        lower_bound=lower_bound,
        upper_bound=upper_bound,
        min_step=min_step,
        max_step=max_step,
        delta_tolerance=delta_tolerance,
        liquid_racks=liquid_racks,
        liquid_mount=right_mount,
        liquid_tip=liq_tip_size,
        ethanol=ethanol,
    )


def build_frusta(data: List, labware: Labware) -> dict:
    """Read geometry creator results and generate frustum dimensions for the IWG."""
    inner_well_json = labware._core.get_definition()
    well_A1 = inner_well_json["wells"]["A1"]
    nominal_depth = well_A1["depth"]
    well_shape = well_A1.get("shape")

    if well_shape == "circular":
        geoID = "conicalWell"
    elif well_shape == "rectangular":
        geoID = "cuboidalWell"

    for well in inner_well_json["wells"].values():
        well["geometryDefinitionId"] = geoID

    frusta_data: List = []

    for i in range(1, len(data)):
        vol1, h1 = data[i - 1]
        vol2, h2 = data[i]
        delta_volume, delta_height = vol2 - vol1, h2 - h1
        if delta_volume <= 0 or delta_height <= 0:
            raise ValueError(
                f"Invalid segment {i}: dV={delta_volume:.4f}, dH={delta_height:.4f} must be > 0"
            )

        if geoID == "cuboidalWell":
            side_len = round(np.sqrt(delta_volume / delta_height), 2)
            section = {
                "shape": "cuboidal",
                "bottomXDimension": side_len,
                "bottomYDimension": side_len,
                "topXDimension": side_len,
                "topYDimension": side_len,
            }
        elif geoID == "conicalWell":
            diameter = 2 * round(np.sqrt(delta_volume / (np.pi * delta_height)), 2)
            section = {
                "shape": "conical",
                "topDiameter": diameter,
                "bottomDiameter": diameter,
            }
        section.update({"bottomHeight": round(h1, 2), "topHeight": round(h2, 2)})
        frusta_data.append(section)

    # Add one more frustum to reach full depth
    if frusta_data:
        last = frusta_data[-1]
        if well_shape == "rectangular":
            nominal_side_length = well_A1.get("xDimension")
            final_section = {
                "shape": "cuboidal",
                "topXDimension": nominal_side_length,
                "topYDimension": nominal_side_length,
                "bottomXDimension": last["bottomXDimension"],
                "bottomYDimension": last["bottomYDimension"],
            }
        elif well_shape == "circular":
            nominal_diameter = well_A1.get("diameter")
            final_section = {
                "shape": "conical",
                "topDiameter": nominal_diameter,
                "bottomDiameter": last["bottomDiameter"],
            }
        final_section.update(
            {"bottomHeight": last["topHeight"], "topHeight": nominal_depth}
        )
        frusta_data.append(final_section)
        frusta_data.reverse()
        inner_well_json["innerLabwareGeometry"] = {geoID: {"sections": frusta_data}}

    key_order = [
        "ordering",
        "brand",
        "metadata",
        "dimensions",
        "wells",
        "groups",
        "parameters",
        "namespace",
        "version",
        "schemaVersion",
        "cornerOffsetFromSlot",
        "stackingOffsetWithLabware",
        "stackingOffsetWithModule",
        "allowedRoles",
        "gripperOffsets",
        "innerLabwareGeometry",
    ]
    new_iwg = OrderedDict(
        (k, dict(inner_well_json)[k]) for k in key_order if k in inner_well_json
    )

    return new_iwg


def build_IWG_definition(
    ctx: ProtocolContext, config: SetupState, trial_results: List[TrialResult]
) -> None:
    """Build inner well geometry definition for the labware."""
    if not ctx.is_simulating():
        passed_trials = [
            trial
            for trial in trial_results
            if trial.status in ("pass", "final", "none")
        ]
        frusta_data = np.array(
            [(trial.dispense_volume, trial.height) for trial in passed_trials]
        )
        if len(frusta_data) > 2:
            new_inner_well_json = build_frusta(frusta_data.tolist(), config.labware)
            if new_inner_well_json:
                IWG_folder = os.path.join(JUPYTER_DATA_DIR, "IWG-definitions")
                IWG_name = f"{RUN_ID}_{config.labware_type}.json"
                os.makedirs(IWG_folder, exist_ok=True)
                IWG_file_path = os.path.join(IWG_folder, IWG_name)
                with open(IWG_file_path, "w") as f:
                    json.dump(new_inner_well_json, f, indent=2)
                ctx.pause(f"Labware Definition file: {IWG_file_path}")


def get_transfer_props(
    expected_liquid_level: float, volume: float, config: SetupState
) -> None:
    """Assigns the liquid class properties for ethanol and get the height to dispense at."""
    # changes dispense offset based on the "expected" liquid level.

    if volume > 15:
        dispense_offset = max(2.0, expected_liquid_level + 5)
    else:
        dispense_offset = max(2.0, expected_liquid_level + 0.1)

    # set pipette behavior based on tip size
    if config.liquid_tip == "50":
        blowout_rate = 100
        pushout_volume = 1.5
        flow_rate = 35
    elif config.liquid_tip == "1000":
        blowout_rate = 716
        pushout_volume = 2.0
        flow_rate = 80
    else:
        raise ValueError("Invalid tip size.")

    wb = "well-bottom"
    lm = "liquid-meniscus"
    wt = PositionReference.WELL_TOP
    meniscus_z = -0.5
    for rack in config.liquid_racks:
        ethanol_props = config.ethanol.get_for(config.liquid_mount, rack)
        ethanol_props.aspirate.aspirate_position.position_reference = lm  # type: ignore[assignment]
        ethanol_props.aspirate.aspirate_position.offset.z = meniscus_z
        ethanol_props.dispense.dispense_position.position_reference = wb  # type: ignore[assignment]
        ethanol_props.dispense.dispense_position.offset.z = dispense_offset
        ethanol_props.dispense.flow_rate_by_volume.set_for_all_volumes(flow_rate)
        ethanol_props.dispense.submerge.speed = 50
        ethanol_props.dispense.retract.speed = 50
        ethanol_props.dispense.push_out_by_volume.set_for_all_volumes(pushout_volume)
        ethanol_props.dispense.retract.blowout.flow_rate = blowout_rate
        ethanol_props.dispense.retract.blowout.enabled = True  # disable if bubbles
        ethanol_props.dispense.retract.end_position.position_reference = wt
        ethanol_props.dispense.retract.end_position.offset.z = 10.0
        ethanol_props.dispense.retract.delay.enabled = True
        ethanol_props.dispense.retract.delay.duration = 3.0


def prepare_transfer(
    ctx: ProtocolContext, trial: TrialState, config: SetupState
) -> float:
    """Compute and update the trial's dispense volume for the next transfer."""
    if trial.step == 0:
        trial.step_volume = config.first_dispense
        trial.get_height_of_liquid_in_well(ctx, config, source=True)
    trial.dispense_volume += trial.step_volume
    volume_per_channel = trial.dispense_volume / config.liq_pipette.active_channels
    expected_liquid_level = trial.corrected_height + config.target_height
    get_transfer_props(expected_liquid_level, volume_per_channel, config)
    return volume_per_channel


def geometry_creator(
    ctx: ProtocolContext,
    config: SetupState,
    trial: TrialState,
    dial: Optional[Mitutoyo_Digimatic_Indicator],
) -> List[TrialResult]:
    """Run liquid dispense + measure loop and return TrialResults."""
    if dial and config.dial:
        dial.store_dial_baseline(ctx, config.probe_pipette, config.dial)
    Data.write_line_to_csv(ctx, DATA_FILE_PATH, CSV_HEADER)
    Data.write_trial_log(ctx, trial)  # log 0th step as baseline

    while trial.dispense_volume < config.max_volume:

        config.pick_up_tips()

        trial.current_well = config.wells[trial.step % len(config.wells)]

        # check if out of available wells
        no_more_wells = trial.step > 0 and trial.step % len(config.wells) == 0
        if no_more_wells:
            ctx.pause("Dump the labware and replace it.")
            trial.get_height_of_liquid_in_well(ctx, config, source=True)

        if dial and config.dial:
            trial.tip_z_error = dial.get_tip_z_error(
                ctx, config.probe_pipette, config.dial
            )

        # prepare for dispense
        volume = prepare_transfer(ctx, trial, config)

        config.liq_pipette.transfer_with_liquid_class(
            liquid_class=config.ethanol,
            volume=volume,
            source=config.src["A1"],
            dest=config.labware[trial.current_well],
            new_tip="never",
            return_tip=False,
        )

        # Precheck if there's clearance for touch tip
        if (
            trial.corrected_height + config.target_height
            <= config.labware["A1"].depth - 1.0
        ):
            config.liq_pipette.touch_tip(v_offset=-0.5, speed=30)

        trial.get_liquid_height(ctx, config)
        trial.compute_height_delta()
        result = trial.get_step_status(ctx, config)
        Data.write_trial_log(ctx, trial)

        match result:
            case "fail":
                if trial.step == 0:
                    break
                trial.rollback_last_data_point()
            case "final":
                break
            case "sim":
                print("simulating")
            case "pass":
                pass
            case _:
                raise ValueError(f"Unknown status: '{result}'")

        trial.step += 1
        trial.calculate_step_volume(config)
        config.drop_tips()

    return trial.results


def run(ctx: ProtocolContext) -> None:
    """Run the protocol."""
    config = _setup(ctx)
    trial = TrialState()
    dial = Mitutoyo_Digimatic_Indicator() if config.dial else None
    if dial:
        dial.connect()
    trial_results = geometry_creator(ctx, config, trial, dial)
    build_IWG_definition(ctx, config, trial_results)

    config.drop_tips()
