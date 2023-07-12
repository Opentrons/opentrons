"""Example Test Report."""
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVSection,
    CSVLine,
    CSVLineRepeating,
)


NUM_REPEATING_DATA = 30
EXAMPLE_REPORT = CSVReport(
    test_name="example-test-report",
    sections=[
        CSVSection(
            title="PIPETTE-LEFT",
            lines=[
                CSVLine("pipette-serial", [str, str, CSVResult]),
                CSVLine("pipette-stall", [float, float, CSVResult]),
                CSVLine("pipette-probe", [float, CSVResult]),
            ],
        ),
        CSVSection(
            title="PIPETTE-RAW-DATA",
            lines=[
                CSVLineRepeating(
                    NUM_REPEATING_DATA,
                    "pipette-pressure-data",
                    [float, float, float, float, CSVResult],
                )
            ],
        ),
    ],
)

if __name__ == "__main__":
    EXAMPLE_REPORT.set_tag("DVT-Pipette-#1")
    EXAMPLE_REPORT(
        "PIPETTE-LEFT", "pipette-serial", ["serial1", "serial1", CSVResult.PASS]
    )
    EXAMPLE_REPORT("PIPETTE-LEFT", "pipette-stall", [1.0, 2.0, CSVResult.FAIL])
    for i in range(NUM_REPEATING_DATA):
        d = [i / 100, i / 200, i / 300, i / 400, CSVResult.PASS]
        EXAMPLE_REPORT("PIPETTE-RAW-DATA", "pipette-pressure-data", i, d)
    print(EXAMPLE_REPORT)
    report_path = EXAMPLE_REPORT.save_to_disk()
    complete_msg = "complete" if EXAMPLE_REPORT.completed else "incomplete"
    print(f"saved {complete_msg} report to -> {report_path}")
