"""Standalone OT-2 compatibility guard.

This test is intentionally outside the Flex snapshot battery. It verifies that
attempting to analyze an OT-2 protocol in this repository fails with the expected
compatibility error, without participating in chunk generation, protocols.py, or
syrupy snapshot updates.
"""

from pathlib import Path

from automation.analyze import analyze_protocol_files

OT2_FIXTURE_PROTOCOL = Path(__file__).parent / "fixtures" / "OT2_S_v2_20_P50_touch_tip.py"
EXPECTED_ERROR_FRAGMENT = "This protocol is designed for an OT-2 robot."


def test_ot2_protocol_analysis_rejected_with_compatibility_error() -> None:
    results = analyze_protocol_files([OT2_FIXTURE_PROTOCOL])

    assert len(results) == 1
    analysis = results[0].analysis

    assert "error" in analysis
    assert EXPECTED_ERROR_FRAGMENT in analysis["error"]
