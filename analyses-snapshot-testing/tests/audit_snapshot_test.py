from automation.audit_snapshots import audit_snapshots


# TODO(jh, 07-04-2026): Remove Flex analysis snapshots from this test suite.
def test_audit_snapshots() -> None:
    result = audit_snapshots()
    assert len(result.files_with_unexpected_errors) == 244
    assert len(result.files_missing_expected_errors) == 0
