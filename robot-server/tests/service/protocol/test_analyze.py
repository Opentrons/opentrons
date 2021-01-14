from json import JSONDecodeError
from pathlib import Path
from unittest.mock import patch

import pytest
from opentrons.protocols.execution.errors import ExceptionInProtocolError

from robot_server.service.legacy.models.control import Mount
from robot_server.service.protocol import contents, models
from robot_server.service.protocol import analyze
from robot_server.util import FileMeta


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


def test_analyze(python_contents):
    """Integration test Extraction equipment requirement analysis."""
    proto = """
metadata = {
    'protocolName': 'Extraction',
    'author': 'Opentrons <protocols@opentrons.com>',
    'apiLevel': '2.4'
}

def run(ctx):
    magdeck = ctx.load_module('magnetic module gen2', '6')
    magplate = magdeck.load_labware('nest_96_wellplate_2ml_deep',
                                    'deepwell plate')
    tempdeck = ctx.load_module('Temperature Module Gen2', '1')
    elutionplate = tempdeck.load_labware(
                'opentrons_96_aluminumblock_nest_wellplate_100ul',
                'elution plate')
    ctx.load_labware('nest_1_reservoir_195ml', '9', 'Liquid Waste')
    ctx.load_labware('nest_12_reservoir_15ml', '3', 'reagent reservoir 2')
    ctx.load_labware('nest_12_reservoir_15ml', '2', 'reagent reservoir 1')
    [ctx.load_labware('opentrons_96_tiprack_300ul',
                      slot, '200µl filtertiprack') for slot in
                      ['4', '7', '8', '10', '11']]
    ctx.load_labware('opentrons_96_tiprack_300ul', '5', 'tiprack for parking')
    ctx.load_instrument('p300_multi_gen2', 'left')
    ctx.load_instrument('p20_single_gen2', 'right')
"""
    with patch.object(contents,
                      "get_protocol_contents", return_value=proto):
        r = analyze._analyze(python_contents)
        assert r.meta == models.Meta(
            name="Extraction",
            author="Opentrons <protocols@opentrons.com>",
            apiLevel="2.4"
        )
        assert sorted(r.required_equipment.labware,
                      key=lambda x: x.location) == [
            models.LoadedLabware(
                label='elution plate',
                uri="opentrons/"
                    "opentrons_96_aluminumblock_nest_wellplate_100ul/1",
                location=1
            ),
            models.LoadedLabware(
                uri="opentrons/nest_12_reservoir_15ml/1",
                location=2,
                label='reagent reservoir 1'
            ),
            models.LoadedLabware(
                uri="opentrons/nest_12_reservoir_15ml/1",
                location=3,
                label='reagent reservoir 2'),
            models.LoadedLabware(
                uri="opentrons/opentrons_96_tiprack_300ul/1",
                location=4,
                label='200µl filtertiprack'),
            models.LoadedLabware(
                uri="opentrons/opentrons_96_tiprack_300ul/1",
                location=5,
                label='tiprack for parking'),
            models.LoadedLabware(
                uri="opentrons/nest_96_wellplate_2ml_deep/1",
                location=6,
                label='deepwell plate'),
            models.LoadedLabware(
                uri="opentrons/opentrons_96_tiprack_300ul/1",
                location=7,
                label='200µl filtertiprack'),
            models.LoadedLabware(
                uri="opentrons/opentrons_96_tiprack_300ul/1",
                location=8,
                label='200µl filtertiprack'),
            models.LoadedLabware(
                uri="opentrons/nest_1_reservoir_195ml/1",
                location=9,
                label='Liquid Waste'),
            models.LoadedLabware(
                uri="opentrons/opentrons_96_tiprack_300ul/1",
                location=10,
                label='200µl filtertiprack'),
            models.LoadedLabware(
                uri="opentrons/opentrons_96_tiprack_300ul/1",
                location=11,
                label='200µl filtertiprack'),
            models.LoadedLabware(
                uri="opentrons/opentrons_1_trash_1100ml_fixed/1",
                location=12,
                label="opentrons_1_trash_1100ml_fixed"
            )
        ]

        assert len(r.required_equipment.pipettes) == 2
        assert models.LoadedPipette(mount=Mount.left,
                                    requestedAs="p300_multi_gen2",
                                    pipetteName="p300_multi_gen2",
                                    channels=8) \
               in r.required_equipment.pipettes
        assert models.LoadedPipette(mount=Mount.right,
                                    requestedAs="p20_single_gen2",
                                    pipetteName="p20_single_gen2",
                                    channels=1) \
               in r.required_equipment.pipettes
        assert len(r.required_equipment.modules) == 2
        assert models.LoadedModule(type='temperatureModuleType',
                                   location=1,
                                   model="temperatureModuleV2") \
               in r.required_equipment.modules
        assert models.LoadedModule(type="magneticModuleType",
                                   location=6,
                                   model="magneticModuleV2") \
               in r.required_equipment.modules
        assert r.errors == []


def test_analyze_thermocycler(python_contents):
    """Test analysis of protocol with loaded thermocycler."""
    proto = """
metadata = {
    'protocolName': ' Extraction',
    'author': 'Opentrons <protocols@opentrons.com>',
    'apiLevel': '2.4'
}

def run(ctx):
    thermocycler = ctx.load_module('thermocycler module', '7')
    thermocycler.load_labware('nest_96_wellplate_2ml_deep', 'deepwell plate')
    """
    with patch.object(contents,
                      "get_protocol_contents", return_value=proto):
        r = analyze._analyze(python_contents)
        assert sorted(r.required_equipment.labware,
                      key=lambda x: x.location) == [
                models.LoadedLabware(
                    uri="opentrons/nest_96_wellplate_2ml_deep/1",
                    location=7,
                    label='deepwell plate'),
                models.LoadedLabware(
                    uri="opentrons/opentrons_1_trash_1100ml_fixed/1",
                    location=12,
                    label="opentrons_1_trash_1100ml_fixed"
                )
            ]

        assert models.LoadedModule(type='thermocyclerModuleType',
                                   location=7,
                                   model="thermocyclerModuleV1") \
               in r.required_equipment.modules
        assert r.errors == []


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


def test_python_run_error(python_contents):
    """Test that python runtime error yields a ProtocolAnalysisException."""
    proto = """
metadata = {
    'protocolName': 'Extraction',
    'author': 'Opentrons <protocols@opentrons.com>',
    'apiLevel': '2.4'
}

def run(ctx):
    magdeck = ctx.load_module('pickle maker', '6')
    """
    with patch.object(contents,
                      "get_protocol_contents", return_value=proto):
        r = analyze._analyze(python_contents)
        assert len(r.errors) == 1
        assert r.errors[0].lineNumber == 9
        assert r.errors[0].description != ""
        assert r.errors[0].type == "ExceptionInProtocolError"
