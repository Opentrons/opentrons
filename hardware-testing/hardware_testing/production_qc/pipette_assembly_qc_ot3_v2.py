from opentrons.protocol_api import ProtocolContext

metadata = {"protocolName": "Pipette Assembly QC V2"}

requirements = {"robotType": "Flex", "apiLevel": "2.29"}


DEFAULT_SLOT_TIP_RACK_1000 = "B1"
DEFAULT_SLOT_TIP_RACK_200 = "C1"
DEFAULT_SLOT_TIP_RACK_50 = "D1"

DEFAULT_SLOT_FIXTURE = "D3"
DEFAULT_SLOT_RESERVOIR = "B2"
DEFAULT_SLOT_PLATE = "D2"
DEFAULT_SLOT_TRASH = "A3"

PROBING_DECK_PRECISION_MM = 1.0

TRASH_HEIGHT_MM: Final = 45
LEAK_HOVER_ABOVE_LIQUID_MM: Final = 50
ASPIRATE_SUBMERGE_MM: Final = 3
TRAILING_AIR_GAP_DROPLETS_UL: Final = 0.5

# FIXME: reduce this spec after dial indicator is implemented
LIQUID_PROBE_ERROR_THRESHOLD_PRECISION_MM = 0.4
LIQUID_PROBE_ERROR_THRESHOLD_ACCURACY_MM = 1.5

SAFE_HEIGHT_TRAVEL = 10
SAFE_HEIGHT_CALIBRATE = 0

ENCODER_ALIGNMENT_THRESHOLD_HOME_MM = 0.005
ENCODER_ALIGNMENT_THRESHOLD_MM = 0.1

COLUMNS = "ABCDEFGH"
PRESSURE_DATA_HEADER = ["PHASE", "CH1", "CH2", "CH3", "CH4", "CH5", "CH6", "CH7", "CH8"]

MULTI_CHANNEL_1_OFFSET = Point(y=9 * 7 * 0.5)

# THRESHOLDS: environment sensor
TEMP_THRESH = [10, 40]
HUMIDITY_THRESH = [10, 90]

# THRESHOLDS: capacitive sensor
CAP_THRESH_OPEN_AIR = {
    1: [4.0, 8.0],
    8: [10.0, 18.0],
}
CAP_THRESH_PROBE = {
    1: [4.0, 8.0],
    8: [10.0, 18.0],
}
CAP_THRESH_SQUARE = {
    1: [8.0, 15.0],
    8: [18.0, 26.0],
}

# THRESHOLDS: air-pressure sensor
PRESSURE_ASPIRATE_VOL = {1: {50: 10.0, 1000: 20.0}, 8: {50: 10.0, 1000: 20.0}}
PRESSURE_THRESH_OPEN_AIR = {
    1: {50: [-25, 25], 1000: [-25, 25]},
    8: {50: [-25, 25], 1000: [-25, 25]},
}
PRESSURE_THRESH_SEALED = {
    1: {50: [-100, 100], 1000: [-100, 100]},
    8: {50: [-100, 100], 1000: [-100, 100]},
}
PRESSURE_THRESH_COMPRESS = {
    1: {50: [-3250, -1050], 1000: [-1550, -450]},
    8: {50: [-4300, -2100], 1000: [-1900, -500]},
}
PRESSURE_THRESH_current = {
    1: {50: {1: 0.2}, 1000: {1: 0.2}},
    8: {50: {2: 0.2, 8: 0.55}, 1000: {2: 0.2, 8: 0.55}},
}

_trash_loc_counter = 0
TRASH_OFFSETS = [
    Point(x=(64 * -0.75)),
    Point(x=(64 * -0.5)),
    Point(x=(64 * -0.25)),
    Point(x=(64 * 0)),
    Point(x=(64 * 0.25)),
    Point(x=(64 * 0.5)),
    Point(x=(64 * 0.75)),
]


def add_parameters(parameters: ParameterContext) -> None:
    """Build the runtime parameters."""
    parameters.add_csv_file("QC test profile", "qc_test_profile")

    parameters.add_str(
        display_name="Operator",
        variable_name="operator",
        default="Unused",
        choices=[
            {"display_name": name, "value": name}
            for name in [
                "Unused",
                "Haiyan",
                "Jiqing",
                "Yanglin",
                "Yangyin",
                "Hejie",
                "Zhihua",
                "Huanjun",
                "Chengkun",
                "Xiongjian",
                "Zhougui",
                "Zhiwei",
                "TE",
            ]
        ],
        description="Operator for this QC run",
    )

    parameters.add_bool(
        display_name="Do Seal Test",
        variable_name="do_test_seal",
        default=True,
        description="Run the seal test on this run.",
    )

    parameters.add_bool(
        display_name="Use Fixture for seal test",
        variable_name="use_seal_fixture",
        default=True,
        description="Use the fixture when testing the seal.",
    )

    parameters.add_bool(
        display_name="Do Sensors Test",
        variable_name="do_sensor_test",
        default=True,
        description="Test the pipette sensors.",
    )

    parameters.add_bool(
        display_name="Do plunger Test",
        variable_name="do_plunger_test",
        default=True,
        description="Run the plunger test on this run.",
    )

    parameters.add_bool(
        display_name="Do tip presence Test",
        variable_name="do_tip_presence_test",
        default=True,
        description="Run the tip presence test on this run.",
    )

    parameters.add_bool(
        display_name="Do liquid probe Test",
        variable_name="do_liquid_probe_test",
        default=True,
        description="Run the liquid probe test on this run.",
    )


def run(ctx: ProtocolContext) -> None:
    """Run."""
