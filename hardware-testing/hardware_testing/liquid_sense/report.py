"""Format the csv report for a liquid-sense run."""


from hardware_testing.data.csv_report import CSVReport, CSVSection, CSVLine
from typing import List

"""
CSV Test Report:
 - Serial numbers:
   - Robot
   - Pipette
   - Scale
   - Environment sensor
 - Config:
   - protocol name
   - pipette_volume
   - pipette_mount
   - tip_volume
   - trials
   - plunger direction
   - liquid
   - labware type
   - speed
   - start height offset
 - Trials
    trial-x-{tipsize}ul
 - Results
    {tipsize}ul-average
    {tipsize}ul-cv
    {tipsize}ul-d
"""


def build_serial_number_section() -> CSVSection:
    """Build section."""
    return CSVSection(
        title="SERIAL-NUMBERS",
        lines=[
            CSVLine("robot", [str]),
            CSVLine("git_description", [str]),
            CSVLine("pipette", [str]),
            CSVLine("scale", [str]),
            CSVLine("environment", [str]),
        ],
    )


def build_config_section() -> CSVSection:
    """Build section."""
    return CSVSection(
        title="CONFIG",
        lines=[
            CSVLine("protocol_name", [str]),
            CSVLine("pipette_volume", [str]),
            CSVLine("tip_volume", [bool, bool, bool]),
            CSVLine("trials", [str]),
            CSVLine("plunger_direction", [str]),
            CSVLine("liquid", [str]),
            CSVLine("labware_type", [str]),
            CSVLine("speed", [str]),
            CSVLine("start_height_offset", [str]),
        ],
    )


def build_trials_section(trials: int, tips: List[int]) -> CSVSection:
    """Build section."""
    return CSVSection(
        title="TRIALS",
        lines=[
            CSVLine(
                f"trial-{t + 1}-{tip}ul", [float, float, float, float, float, float]
            )
            for tip in tips
            for t in range(trials)
        ],
    )


def build_results_section(tips: List[int]) -> CSVSection:
    """Build section."""
    lines: List[CSVLine] = []
    for tip in tips:
        lines.append(CSVLine(f"{tip}ul-average", [float]))
        lines.append(CSVLine(f"{tip}ul-cv", [float]))
        lines.append(CSVLine(f"{tip}ul-d", [float]))
    return CSVSection(title="RESULTS", lines=lines)  # type: ignore[arg-type]


def store_serial_numbers(
    report: CSVReport,
    robot: str,
    pipette: str,
    scale: str,
    environment: str,
    git_description: str,
) -> None:
    """Report serial numbers."""
    report("SERIAL-NUMBERS", "robot", [robot])
    report("SERIAL-NUMBERS", "git_description", [git_description])
    report("SERIAL-NUMBERS", "pipette", [pipette])
    report("SERIAL-NUMBERS", "scale", [scale])
    report("SERIAL-NUMBERS", "environment", [environment])


def store_config(
    report: CSVReport,
    protocol_name: str,
    pipette_volume: str,
    tip_volumes: List[int],
    trials: int,
    plunger_direction: str,
    liquid: str,
    labware_type: str,
    speed: str,
    start_height_offset: str,
) -> None:
    """Report config."""
    report("CONFIG", "protocol_name", [protocol_name])
    report("CONFIG", "pipette_volume", [pipette_volume])
    report(
        "CONFIG",
        "tip_volume",
        [50 in tip_volumes, 200 in tip_volumes, 1000 in tip_volumes],
    )
    report("CONFIG", "trials", [trials])
    report("CONFIG", "plunger_direction", [plunger_direction])
    report("CONFIG", "liquid", [liquid])
    report("CONFIG", "labware_type", [labware_type])
    report("CONFIG", "speed", [speed])
    report("CONFIG", "start_height_offset", [start_height_offset])


def store_trial(
    report: CSVReport,
    trial: int,
    tip: float,
    height: float,
    plunger_pos: float,
    humidity: float,
    temp: float,
    z_travel: float,
    plunger_travel: float,
) -> None:
    """Report Trial."""
    report(
        "TRIALS",
        f"trial-{trial + 1}-{tip}ul",
        [height, plunger_pos, humidity, temp, z_travel, plunger_travel],
    )


def store_tip_results(
    report: CSVReport, tip: float, average: float, cv: float, d: float
) -> None:
    """Store final results."""
    report("RESULTS", f"{tip}ul-average", [average])
    report("RESULTS", f"{tip}ul-cv", [cv])
    report("RESULTS", f"{tip}ul-d", [d])


def build_ls_report(
    test_name: str, run_id: str, trials: int, tips: List[int]
) -> CSVReport:
    """Generate a CSV Report."""
    return CSVReport(
        test_name=test_name,
        sections=[
            build_serial_number_section(),
            build_config_section(),
            build_trials_section(trials, tips),
            build_results_section(tips),
        ],
        run_id=run_id,
        start_time=0.0,
    )


"""
def store_sensor_data(test_name: str, run_id: str, trial: int, tip: int,
 pressure_list: List[Tuple[int, float]]): -> None
    sensor_report = CSVReport(
        test_name=f"{test_name}-{trial}-{tip}",
        sections[
            CSVSection(
            title="SensorData",
            lines=[
                CSVLine(f"trial-{trial + 1}-{tip}ul-{point}", [int, float])
                for point in range(pressure_list)
            ],
        )
    for point in range(pressure_list):
        sensor = pressure_list[point][0]
        pressure = pressure_list[point][1]
        sensor_report("SensorData",f"trial-{trial + 1}-{tip}ul-{point}",[sensor, pressure])
    sensor_report.save_to_disk()
"""
