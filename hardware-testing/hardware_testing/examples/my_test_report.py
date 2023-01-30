from hardware_testing.data import report

REPORT = report.Report(script_path=__file__, sections=[
        report.Section(
            title="TEST-INFO",
            lines=[
                report.Line(tag="software-version", data=[str]),
                report.Line(tag="operator", data=[str])
            ]
        ),
        report.Section(
            title="PIPETTE-LEFT",
            lines=[
                report.Line(tag="pipette-serial", data=[str, str, report.Result]),
                report.Line(tag="pipette-stall", data=[float, float, report.Result]),
                report.Line(tag="pipette-probe", data=[float, report.Result]
                )
            ]
        ),
        report.Section(
            title="PIPETTE-RAW-DATA",
            lines=[
                report.LineRepeating(repeat=30, tag="pipette-pressure",
                                     data=[float, float, float, float, report.Result])
            ]
        )
    ]
)

if __name__ == "__main__":
    REPORT.set_tag("P1KSV3320220721")
    report_section = REPORT["PIPETTE-LEFT"]
    report_section["pipette-serial"].store("serial1", "serial1", report.Result.PASS)
    report_section["pipette-stall"].store(1.0, 2.0, report.Result.FAIL)
    REPORT("PIPETTE-RAW-DATA", "pipette-pressure", 0, [0.1, 0.2, 0.3, 0.4, report.Result.PASS])
    print(REPORT)
    report_path = REPORT.save_to_disk()
    print(f"saved report to -> {report_path}")
