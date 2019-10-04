import ast
import json

import jsonschema
import pytest

from opentrons.protocols.parse import (extract_metadata,
                                       _get_protocol_schema_version,
                                       validate_json,
                                       parse)
from opentrons.protocols.types import (JsonProtocol, PythonProtocol)


def test_extract_metadata():
    expected = {
        'hello': 'world',
        'what?': 'no'
    }

    prot = """
this = 0
that = 1
metadata = {
'what?': 'no',
'hello': 'world'
}
fakedata = {
'who?': 'me',
'what?': 'green eggs'
}
print('wat?')
metadata['hello'] = 'moon'
fakedata['what?'] = 'ham'
"""

    parsed = ast.parse(prot, filename='testy', mode='exec')
    metadata = extract_metadata(parsed)
    assert metadata == expected


infer_version_cases = [
    ("""
from opentrons import instruments

p = instruments.P10_Single(mount='right')
""", '1'),
    ("""
import opentrons.instruments

p = instruments.P10_Single(mount='right')
""", '1'),
    ("""
from opentrons import instruments as instr

p = instr.P10_Single(mount='right')
""", '1'),
    ("""
from opentrons import instruments

metadata = {
  'apiLevel': '1'
  }

p = instruments.P10_Single(mount='right')
""", '1'),
    ("""
from opentrons import instruments

metadata = {
  'apiLevel': '2'
  }

p = instruments.P10_Single(mount='right')
""", '2'),
    ("""
from opentrons import types

def run(ctx):
    right = ctx.load_instrument('p300_single', types.Mount.RIGHT)
""", '2'),
    ("""
from opentrons import types

metadata = {
  'apiLevel': '1'
  }

def run(ctx):
    right = ctx.load_instrument('p300_single', types.Mount.RIGHT)
""", '1'),
    ("""
from opentrons import types

metadata = {
  'apiLevel': '2'
  }

def run(ctx):
    right = ctx.load_instrument('p300_single', types.Mount.RIGHT)
""", '2'),
    ("""
from opentrons import labware, instruments

p = instruments.P10_Single(mount='right')
    """, '1'),
    ("""
from opentrons import types, containers
    """, '1'),
    ("""
from opentrons import types, instruments

p = instruments.P10_Single(mount='right')
    """, '1'),
    ("""
from opentrons import instruments as instr

p = instr.P300_Single('right')
    """, '1')
]


@pytest.mark.parametrize('proto,version', infer_version_cases)
def test_infer_version(proto, version):
    parsed = parse(proto)
    assert parsed.api_level == version


def test_get_protocol_schema_version():
    assert _get_protocol_schema_version({'protocol-schema': '1.0.0'}) == 1
    assert _get_protocol_schema_version({'protocol-schema': '2.0.0'}) == 2
    assert _get_protocol_schema_version({'schemaVersion': 123}) == 123

    # schemaVersion has precedence over legacy 'protocol-schema'
    assert _get_protocol_schema_version({
        'protocol-schema': '2.0.0',
        'schemaVersion': 123}) == 123

    with pytest.raises(RuntimeError):
        _get_protocol_schema_version({'schemaVersion': None})
    with pytest.raises(RuntimeError):
        _get_protocol_schema_version({})
    with pytest.raises(RuntimeError):
        _get_protocol_schema_version({'protocol-schema': '1.2.3'})


def test_validate_json(get_json_protocol_fixture):
    # valid data that has no schema should fail
    with pytest.raises(RuntimeError, match='deprecated'):
        validate_json({'protocol-schema': '1.0.0'})
    with pytest.raises(jsonschema.ValidationError):
        validate_json({'schemaVersion': '3'})
    v3 = get_json_protocol_fixture('3', 'testAllAtomicSingleV3')
    assert validate_json(v3) == 3


@pytest.mark.parametrize('protocol_file',
                         ['testosaur.py', 'testosaur_v2.py'])
@pytest.mark.parametrize('protocol_text_kind', ['str', 'bytes'])
@pytest.mark.parametrize('filename', ['real', 'none'])
def test_parse_python_details(
        protocol, protocol_text_kind, filename, protocol_file):
    if protocol_text_kind == 'bytes':
        text = protocol.text.encode('utf-8')
    else:
        text = protocol.text
    if filename == 'real':
        fake_fname = protocol.filename
    else:
        fake_fname = None
    parsed = parse(text, fake_fname)
    assert isinstance(parsed, PythonProtocol)
    assert parsed.text == protocol.text
    assert isinstance(parsed.text, str)
    version = '2' if '2' in protocol.filename else '1'
    assert parsed.api_level == version
    fname = fake_fname if fake_fname else '<protocol>'
    assert parsed.filename == fname
    assert parsed.metadata == {
        'protocolName': 'Testosaur',
        'author': 'Opentrons <engineering@opentrons.com>',
        'description': 'A variant on "Dinosaur" for testing',
        'source': 'Opentrons Repository'
    }
    assert parsed.contents == compile(
        protocol.text,
        filename=fname,
        mode='exec')


@pytest.mark.parametrize('protocol_details',
                         [('3', 'simple'), ('3', 'testAllAtomicSingleV3')])
@pytest.mark.parametrize('protocol_text_kind', ['str', 'bytes'])
@pytest.mark.parametrize('filename', ['real', 'none'])
def test_parse_json_details(get_json_protocol_fixture,
                            protocol_details, protocol_text_kind, filename):
    protocol = get_json_protocol_fixture(*protocol_details,
                                         decode=False)
    if protocol_text_kind == 'text':
        protocol_text = protocol
    else:
        protocol_text = protocol.encode('utf-8')
    if filename == 'real':
        fname = 'simple.json'
    else:
        fname = None
    parsed = parse(protocol_text, fname)
    assert isinstance(parsed, JsonProtocol)
    assert parsed.filename == fname
    assert parsed.contents == json.loads(protocol)
    parsed.schema_version == int(protocol_details[0])


@pytest.mark.api2_only
def test_parse_bundle_details(get_bundle_fixture, ensure_api2):
    fixture = get_bundle_fixture('simple_bundle')
    filename = fixture['filename']

    parsed = parse(fixture['binary_zipfile'], filename)

    assert isinstance(parsed, PythonProtocol)
    assert parsed.filename == 'protocol.ot2.py'
    assert parsed.bundled_labware == fixture['bundled_labware']
    assert parsed.bundled_python == fixture['bundled_python']
    assert parsed.bundled_data == fixture['bundled_data']
    assert parsed.metadata == fixture['metadata']
    assert parsed.api_level == '2'


@pytest.mark.parametrize('protocol_file',
                         ['testosaur.py'])
def test_extra_contents(
        get_labware_fixture, ensure_api2, protocol_file, protocol):
    fixture_96_plate = get_labware_fixture('fixture_96_plate')
    bundled_labware = {
        'fixture/fixture_96_plate/1': fixture_96_plate
    }
    extra_data = {'hi': b'there'}
    parsed = parse(protocol.text, 'testosaur.py',
                   extra_labware=bundled_labware,
                   extra_data=extra_data)
    assert parsed.extra_labware == bundled_labware
    assert parsed.bundled_data == extra_data
