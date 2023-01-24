from hardware_testing.production_qc import report

r = report.Report(script_path=__file__, sections=[
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
                report.LineTimestamp(tag="pipette-serial", data=[str, str, report.Result]),
                report.LineTimestamp(tag="pipette-stall", data=[float, float, report.Result]),
                report.LineTimestamp(tag="pipette-probe", data=[float, report.Result]
                )
            ]
        )
    ]
)

r.setup(tag="run-tag")
