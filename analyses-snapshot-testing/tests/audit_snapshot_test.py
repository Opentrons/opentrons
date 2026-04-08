from automation.audit_snapshots import audit_snapshots


# TODO(jh, 04-06-2026): Remove the OT-2 testing snapshots so unexpected errors is zero.
def test_audit_snapshots() -> None:
    result = audit_snapshots()
    assert len(result.files_with_unexpected_errors) == 97
    assert len(result.files_missing_expected_errors) == 0
