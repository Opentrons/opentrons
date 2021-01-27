from json import JSONDecodeError
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.execution.errors import ExceptionInProtocolError
from opentrons.protocols.types import PythonProtocol, JsonProtocol

from robot_server.service.protocol import contents, models
from robot_server.service.protocol import analyze
from robot_server.util import FileMeta


@pytest.fixture
def mock_parse_protocol():
    with patch.object(analyze, "_parse_protocol") as m:
        yield m


@pytest.fixture
def mock_simulate_protocol():
    with patch.object(analyze, "_simulate_protocol") as m:
        yield m


@pytest.fixture
def mock_extract_metadata():
    with patch.object(analyze, "_extract_metadata") as m:
        yield m


@pytest.fixture
def mock_extract_equipment():
    with patch.object(analyze, "_extract_equipment") as m:
        yield m


def test__analyze(
        mock_extract_equipment,
        mock_extract_metadata,
        mock_simulate_protocol,
        mock_parse_protocol):
    """It calls the methods correctly."""
    # Set up input/output
    mock_contents = MagicMock()
    mock_protocol = MagicMock()
    mock_ctx = MagicMock()
    meta = models.Meta(name="a", author="b", apiLevel="c")
    equipment = models.RequiredEquipment(pipettes=[], labware=[], modules=[])

    mock_parse_protocol.return_value = mock_protocol
    mock_simulate_protocol.return_value = mock_ctx
    mock_extract_metadata.return_value = meta
    mock_extract_equipment.return_value = equipment

    # Call analyze
    analysis_result = analyze._analyze(mock_contents)

    # Everyone got called with the right stuff
    mock_parse_protocol.assert_called_once_with(
        protocol_contents=mock_contents
    )
    mock_simulate_protocol.assert_called_once_with(mock_protocol)
    mock_extract_metadata.assert_called_once_with(mock_protocol)
    mock_extract_equipment.assert_called_once_with(mock_ctx)

    assert analysis_result.meta is meta
    assert analysis_result.required_equipment is equipment
    assert analysis_result.errors == []


def test__analyze_parse_error(
        mock_extract_equipment,
        mock_extract_metadata,
        mock_simulate_protocol,
        mock_parse_protocol):
    """It calls the methods correctly."""
    # Set up input/output
    mock_contents = MagicMock()
    error = models.ProtocolError(type="error", description="desc")
    meta = models.Meta(name=None, author=None, apiLevel=None)
    equipment = models.RequiredEquipment(pipettes=[], labware=[], modules=[])

    def raiser(*args, **kwargs):
        raise analyze.AnalyzeParseError(
            error=error)

    mock_parse_protocol.side_effect = raiser
    mock_extract_metadata.return_value = meta
    mock_extract_equipment.return_value = equipment

    # Call analyze
    analysis_result = analyze._analyze(mock_contents)

    # Everyone got called with the right stuff
    mock_parse_protocol.assert_called_once_with(
        protocol_contents=mock_contents)
    mock_simulate_protocol.assert_not_called()
    mock_extract_metadata.assert_called_once_with(None)
    mock_extract_equipment.assert_called_once_with(None)

    assert analysis_result.meta is meta
    assert analysis_result.required_equipment is equipment
    assert analysis_result.errors == [error]


def test__analyze_simulate_error(
        mock_extract_equipment,
        mock_extract_metadata,
        mock_simulate_protocol,
        mock_parse_protocol):
    """It calls the methods correctly."""
    # Set up input/output
    mock_contents = MagicMock()
    mock_protocol = MagicMock()
    error = models.ProtocolError(type="error", description="desc")
    meta = models.Meta(name="a", author="b", apiLevel="c")
    equipment = models.RequiredEquipment(pipettes=[], labware=[], modules=[])

    def raiser(*args, **kwargs):
        raise analyze.AnalyzeSimulationError(
            error=error)

    mock_parse_protocol.return_value = mock_protocol
    mock_simulate_protocol.side_effect = raiser
    mock_extract_metadata.return_value = meta
    mock_extract_equipment.return_value = equipment

    # Call analyze
    analysis_result = analyze._analyze(mock_contents)

    # Everyone got called with the right stuff
    mock_parse_protocol.assert_called_once_with(
        protocol_contents=mock_contents)
    mock_simulate_protocol.assert_called_once_with(mock_protocol)
    mock_extract_metadata.assert_called_once_with(mock_protocol)
    mock_extract_equipment.assert_called_once_with(None)

    assert analysis_result.meta is meta
    assert analysis_result.required_equipment is equipment
    assert analysis_result.errors == [error]


def test__extract_metadata_none():
    """It returns empty metadata when passed None"""
    assert analyze._extract_metadata(None) == models.Meta(
        name=None,
        author=None,
        apiLevel=None)


def test__extract_metadata_python():
    """It returns complete metadata when passed PythonProtocol"""
    protocol = PythonProtocol(
        text="abc",
        api_level=APIVersion(major=2, minor=2),
        metadata={
            "author": "some author",
            "protocolName": "my protocol"
        },
        filename="",
        extra_labware={},
        contents="",
        bundled_labware={},
        bundled_data={},
        bundled_python={}
    )

    assert analyze._extract_metadata(protocol) == models.Meta(
        name="my protocol",
        author="some author",
        apiLevel="2.2"
    )


def test__extract_metadata_json():
    """It returns complete metadata when passed JSONProtocol"""
    protocol = JsonProtocol(
        text="abc",
        api_level=APIVersion(major=2, minor=2),
        filename="",
        contents={},
        schema_version=2,
        metadata={}
    )

    assert analyze._extract_metadata(protocol) == models.Meta(
        name=None,
        author=None,
        apiLevel="2.2"
    )


def test__extract_equipment_none():
    """It will return empty model if input is None"""
    r = analyze._extract_equipment(None)
    assert r == models.RequiredEquipment(
        modules=[],
        labware=[],
        pipettes=[]
    )


def test__extract_equipment():
    """It will return full model from input"""
    r = analyze._extract_equipment(None)
    assert r == models.RequiredEquipment(
        modules=[],
        labware=[],
        pipettes=[]
    )


@pytest.fixture
def mock_protocol_parse():
    with patch.object(analyze, "parse") as p:
        yield p


@pytest.fixture
def mock_protocol_run():
    with patch.object(analyze, "run_protocol") as p:
        yield p


@pytest.fixture
def python_protocol_filename() -> str:
    return "abc.py"


@pytest.fixture
def json_protocol_filename() -> str:
    return "abc.json"


@pytest.fixture
def python_contents(python_protocol_filename) -> contents.Contents:
    return contents.Contents(
        protocol_file=FileMeta(path=Path(python_protocol_filename),
                               content_hash=""),
        support_files=[],
        directory=None)


@pytest.fixture
def json_contents(json_protocol_filename) -> contents.Contents:
    return contents.Contents(
        protocol_file=FileMeta(path=Path(json_protocol_filename),
                               content_hash=""),
        support_files=[],
        directory=None)


def test_parse_protocol(python_contents,
                        mock_protocol_parse,
                        python_protocol_filename):
    """Test that parse protocol calls parse correctly"""
    with patch.object(contents,
                      "get_protocol_contents", return_value="123"):
        analyze._parse_protocol(python_contents)

        mock_protocol_parse.assert_called_once_with(
            "123",
            filename=python_protocol_filename)


def test_parse_protocol_python_syntax_error(mock_protocol_parse,
                                            python_contents):
    """Test that a python syntax error yields an error."""
    def raiser(*args, **kwargs):
        x = SyntaxError()
        x.lineno = 12
        x.msg = "Can't do that"
        x.filename = "some_file.py"
        raise x
    mock_protocol_parse.side_effect = raiser
    with patch.object(contents,
                      "get_protocol_contents", return_value="123"):
        with pytest.raises(analyze.AnalyzeParseError) as e:
            analyze._parse_protocol(python_contents)
        assert e.value.error == models.ProtocolError(
            type="SyntaxError",
            description="Can't do that",
            lineNumber=12,
            fileName="some_file.py"
        )


def test_parse_protocol_json_syntax_error(mock_protocol_parse,
                                          json_protocol_filename,
                                          json_contents):
    """Test that a json syntax error yields an error."""
    def raiser(*args, **kwargs):
        raise JSONDecodeError(msg="Can't do that", doc="\n\n", pos=1)
    mock_protocol_parse.side_effect = raiser
    with patch.object(contents,
                      "get_protocol_contents", return_value="123"):
        with pytest.raises(analyze.AnalyzeParseError) as e:
            analyze._parse_protocol(json_contents)
        assert e.value.error == models.ProtocolError(
            type="JSONDecodeError",
            description="Can't do that",
            lineNumber=2,
            fileName=json_protocol_filename
        )


def test_parse_protocol_error(mock_protocol_parse, json_contents):
    """Test that a runtime error yields an error."""
    def raiser(*args, **kwargs):
        raise RuntimeError("Failed")
    mock_protocol_parse.side_effect = raiser
    with patch.object(contents,
                      "get_protocol_contents", return_value="123"):
        with pytest.raises(analyze.AnalyzeParseError) as e:
            analyze._parse_protocol(json_contents)
        assert e.value.error == models.ProtocolError(
            type="RuntimeError",
            description="Failed",
        )


def test_simulate_error(mock_protocol_run):
    """Test that protocol error yields an error"""
    def raiser(*args, **kwargs):
        raise ExceptionInProtocolError(None, None, message="err", line=123)
    mock_protocol_run.side_effect = raiser
    with pytest.raises(analyze.AnalyzeSimulationError) as e:
        analyze._simulate_protocol(None)
    assert e.value.error == models.ProtocolError(
        type="ExceptionInProtocolError",
        description="err",
        lineNumber=123
    )


def test_python_parse_error(python_contents):
    """Test that a python parse error yields a ProtocolAnalysisException."""
    proto = """
there's nothing here
    """
    with patch.object(contents,
                      "get_protocol_contents", return_value=proto):
        r = analyze._analyze(python_contents)
        assert len(r.errors) == 1
        assert r.errors[0].lineNumber == 2
        assert r.errors[0].description != ""
        assert r.errors[0].type == "SyntaxError"


def test_json_parse_error(json_contents):
    """Test that a JSON parse error yields a ProtocolAnalysisException."""
    proto = "{"
    with patch.object(contents,
                      "get_protocol_contents", return_value=proto):
        r = analyze._analyze(json_contents)
        assert len(r.errors) == 1
        assert r.errors[0].lineNumber == 1
        assert r.errors[0].description != ""
        assert r.errors[0].type == "JSONDecodeError"
