from pathlib import Path

import pytest
from automation.analysis_matrix import ROBOT_STACK_VERSION_MAP, ProtocolInfo


@pytest.mark.unit
@pytest.mark.parametrize(
    "filepath,api_level,pd_version,expected_pd,is_pd",
    [
        (Path("protocol.py"), "2.21", None, None, False),
        (Path("protocol.json"), None, "5.2", "5.2", True),
        (Path("design.json"), None, None, None, True),
    ],
)
def test_pd_protocol_property(filepath, api_level, pd_version, expected_pd, is_pd):
    proto = ProtocolInfo(filepath=filepath, filename=filepath.name, expect_no_errors=True, api_level=api_level, pd_version=pd_version)
    assert proto.pd_protocol == is_pd


def test_min_robot_stack_version_api():
    """Should return the minimum stack supporting the api_level."""
    proto = ProtocolInfo(filepath=Path("test.py"), filename="test.py", expect_no_errors=True, api_level="2.22")
    # Stack 8.3.2 and above support 2.22
    assert proto.min_robot_stack_version() == "8.3.2"


def test_min_robot_stack_version_api_none():
    """Should return None if api_level is missing."""
    proto = ProtocolInfo(filepath=Path("test.py"), filename="test.py", expect_no_errors=True, api_level=None)
    assert proto.min_robot_stack_version() is None


def test_min_robot_stack_version_pd(monkeypatch):
    """Should return the minimum stack supporting the pd_version."""
    proto = ProtocolInfo(filepath=Path("design.json"), filename="design.json", expect_no_errors=True, pd_version="5.2")
    # Patch in a real value for pd in stack 8.3.2
    monkeypatch.setitem(ROBOT_STACK_VERSION_MAP["8.3.2"], "pd", "5.3")
    assert proto.min_robot_stack_version() == "8.3.2"


def test_min_robot_stack_version_pd_none(monkeypatch):
    """Should return None if pd_version is missing."""
    proto = ProtocolInfo(filepath=Path("design.json"), filename="design.json", expect_no_errors=True, pd_version=None)
    assert proto.min_robot_stack_version() is None


@pytest.mark.parametrize(
    "api_level,stack,expected",
    [
        ("2.22", "8.4.1", True),
        ("2.23", "8.3.2", False),
        ("2.18", "7.3.0", True),
        ("2.25", "8.4.1", False),  # higher than supported
    ],
)
def test_is_compatible_with_stack_api(api_level, stack, expected):
    proto = ProtocolInfo(filepath=Path("test.py"), filename="test.py", expect_no_errors=True, api_level=api_level)
    assert proto.is_compatible_with_stack(stack) is expected


def test_is_compatible_with_stack_pd(monkeypatch):
    """Should check PD version compatibility."""
    proto = ProtocolInfo(filepath=Path("protocol.json"), filename="protocol.json", expect_no_errors=True, pd_version="6.0")
    monkeypatch.setitem(ROBOT_STACK_VERSION_MAP["8.4.1"], "pd", "6.0")
    assert proto.is_compatible_with_stack("8.4.1") is True
    proto.pd_version = "6.1"
    assert proto.is_compatible_with_stack("8.4.1") is False


def test_is_compatible_with_stack_unknown_stack():
    proto = ProtocolInfo(filepath=Path("test.py"), filename="test.py", expect_no_errors=True, api_level="2.18")
    assert proto.is_compatible_with_stack("0.0.0") is False
