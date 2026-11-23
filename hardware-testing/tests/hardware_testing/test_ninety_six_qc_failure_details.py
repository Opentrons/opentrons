"""Failure confirmations display existing evidence without changing QC reports."""

from typing import Literal

import pytest

from hardware_testing.data.csv_report import (
    CSVLine,
    CSVLineRepeating,
    CSVReport,
    CSVResult,
    CSVSection,
)
from hardware_testing.production_qc_protocols import ninety_six_assembly_qc_ot3 as qc


@pytest.fixture
def report() -> CSVReport:
    """Include unrecorded, ungraded, repeated and measured pressure rows."""
    result = CSVReport(
        "ninety-six-failure-details",
        [
            CSVSection(
                "PRESSURE",
                [
                    CSVLine("primary-open-pa", [float, CSVResult]),
                    CSVLine("unrecorded", [float, CSVResult]),
                    CSVLine("raw-sample", [float]),
                    CSVLineRepeating(3, "repeated-reading", [float, CSVResult]),
                ],
            ),
            CSVSection("TIP-SENSOR", [CSVLine("tip-sensor-empty", [CSVResult])]),
        ],
        dont_write_to_disk=True,
    )
    result.set_device_id("instrument-id", "instrument-id")
    return result


def test_unmeasured_or_ungraded_rows_do_not_prompt(report: CSVReport) -> None:
    """Absent results remain unknown even when neighboring data look unusual."""
    report("PRESSURE", "primary-open-pa", [1.0, CSVResult.PASS])
    report("PRESSURE", "raw-sample", [-9999.0])
    report("TIP-SENSOR", "tip-sensor-empty", [CSVResult.FAIL])

    assert qc._section_failure_details(report, "PRESSURE", 1000) == ([], "")


@pytest.mark.parametrize("localized", [True, False])
def test_missing_measurement_failure_still_shows_evidence(
    report: CSVReport, monkeypatch: pytest.MonkeyPatch, localized: bool
) -> None:
    """A missing reading with an explicit FAIL is not mistaken for an untested row."""
    monkeypatch.setattr(qc, "LOCALIZE", localized)
    report("PRESSURE", "primary-open-pa", [None, CSVResult.FAIL])
    line = report["PRESSURE"]["primary-open-pa"]
    assert isinstance(line, CSVLine)
    assert line.stored is False
    line.add_failure_reason("Pressure sensor did not return a reading.")
    before = str(report)

    rows, detail = qc._section_failure_details(report, "PRESSURE", 1000)

    assert len(rows) == 1
    assert rows[0]["data"] == [None, "FAIL"]
    assert "PRESSURE/primary-open-pa[0]" in detail
    assert '[null, "FAIL"]' in detail
    assert "Pressure sensor did not return a reading." in detail
    assert ("缺失" if localized else "missing") in detail
    assert str(report) == before


def test_repeated_failure_rows_keep_distinct_indices(report: CSVReport) -> None:
    """Two failures sharing a tag must retain both original measurements."""
    report("PRESSURE", "repeated-reading", [101.0, CSVResult.FAIL], 0)
    report("PRESSURE", "repeated-reading", [0.0, CSVResult.PASS], 1)
    report("PRESSURE", "repeated-reading", [-202.0, CSVResult.FAIL], 2)
    before = str(report)

    rows, detail = qc._section_failure_details(report, "PRESSURE", 1000)

    assert [row["evidence_id"] for row in rows] == [
        "PRESSURE/repeated-reading[0]",
        "PRESSURE/repeated-reading[2]",
    ]
    assert [row["data"] for row in rows] == [
        [101.0, "FAIL"],
        [-202.0, "FAIL"],
    ]
    assert "PRESSURE/repeated-reading[1]" not in detail
    assert str(report) == before


@pytest.mark.parametrize("pipette", [200, 1000])
def test_pressure_criteria_match_selected_pipette(
    report: CSVReport, pipette: Literal[200, 1000]
) -> None:
    """Do not show the other size's limits or recompute the saved result."""
    report("PRESSURE", "primary-open-pa", [0.0, CSVResult.FAIL])

    rows, detail = qc._section_failure_details(report, "PRESSURE", pipette)

    thresholds = qc.THRESHOLDS_200 if pipette == 200 else qc.THRESHOLDS_1000
    other_size = 1000 if pipette == 200 else 200
    assert f"PRESSURE P{pipette}: strict Pa limits {thresholds!r}." in detail
    assert f"PRESSURE P{other_size}:" not in detail
    assert rows[0]["result"] == "FAIL"


def test_metadata_displays_both_ids_and_matching_rule(
    report: CSVReport, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Barcode failure evidence identifies the expected and scanned serials."""
    monkeypatch.setattr(qc, "LOCALIZE", False)
    report.set_device_id("instrument-id", "different-scanned-id")

    rows, detail = qc._section_failure_details(report, "META_DATA", 200)

    assert rows[0]["evidence_id"] == "META_DATA/test_device_id[0]"
    assert '["instrument-id", "different-scanned-id", "FAIL"]' in detail
    assert "scanned serial number must match the instrument serial number" in detail


def test_tip_result_does_not_invent_signal_measurement(
    report: CSVReport, monkeypatch: pytest.MonkeyPatch
) -> None:
    """The tip CSV contains only the grade, so display only that recorded data."""
    monkeypatch.setattr(qc, "LOCALIZE", False)
    report("TIP-SENSOR", "tip-sensor-empty", [CSVResult.FAIL])

    rows, detail = qc._section_failure_details(report, "TIP-SENSOR", 1000)

    assert rows[0]["data"] == ["FAIL"]
    assert 'recorded data=["FAIL"]' in detail
    assert (
        "TIP-SENSOR: detection position is True with tips and False without tips"
        in detail
    )
    assert "received" not in detail


def test_caught_errors_are_limited_to_requested_section(report: CSVReport) -> None:
    """Do not display an unrelated section's traceback as this failure's cause."""
    report("PRESSURE", "primary-open-pa", [None, CSVResult.FAIL])
    pressure_error = (
        "[2026-11-11T00:00:00Z] PRESSURE/primary-open-pa\npressure read error"
    )
    unrelated_error = "[2026-11-11T00:00:01Z] CAPACITANCE/air-pf\nunrelated error"
    report._qc_exception_details = [pressure_error, unrelated_error]  # type: ignore[attr-defined]

    _, detail = qc._section_failure_details(report, "PRESSURE", 1000)

    assert pressure_error in detail
    assert unrelated_error not in detail
