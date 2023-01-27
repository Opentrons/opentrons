from hardware_testing.data import report


NUM_REPEATING_DATA = 30
EXAMPLE_REPORT = report.Report(script_path=__file__, sections=[
        report.Section(
            title="TEST-INFO",
            lines=[
                report.Line("software-version", [str]),
                report.Line("operator", [str])
            ]
        ),
        report.Section(
            title="PIPETTE-LEFT",
            lines=[
                report.Line("pipette-serial", [str, str, report.Result]),
                report.Line("pipette-stall", [float, float, report.Result]),
                report.Line("pipette-probe", [float, report.Result])
            ]
        ),
        report.Section(
            title="PIPETTE-RAW-DATA",
            lines=[
                report.LineRepeating(NUM_REPEATING_DATA,
                                     "pipette-pressure-data",
                                     [float, float, float, float, report.Result])
            ]
        )
    ]
                               )

if __name__ == "__main__":
    EXAMPLE_REPORT.set_tag("DVT-Pipette-#1")
    EXAMPLE_REPORT("PIPETTE-LEFT", "pipette-serial", ["serial1", "serial1", report.Result.PASS])
    EXAMPLE_REPORT("PIPETTE-LEFT", "pipette-stall", [1.0, 2.0, report.Result.FAIL])
    for i in range(NUM_REPEATING_DATA):
        d = [i / 100, i / 200, i / 300, i / 400, report.Result.PASS]
        EXAMPLE_REPORT("PIPETTE-RAW-DATA", "pipette-pressure-data", i, d)
    print(EXAMPLE_REPORT)
    report_path = EXAMPLE_REPORT.save_to_disk()
    complete_msg = "complete" if EXAMPLE_REPORT.completed else "incomplete"
    print(f"saved {complete_msg} report to -> {report_path}")
