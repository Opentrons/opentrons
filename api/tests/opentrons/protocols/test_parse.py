import ast
import json

import jsonschema
import pytest

from opentrons.protocols.parse import (extract_metadata,
                                       infer_version,
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


def test_infer_version():
    prot_api1_no_meta_a = """
from opentrons import instruments

p = instruments.P10_Single(mount='right')
"""

    prot_api1_no_meta_b = """
import opentrons.instruments

p = instruments.P10_Single(mount='right')
"""

    prot_api1_no_meta_c = """
from opentrons import instruments as instr

p = instr.P10_Single(mount='right')
"""

    prot_api1_meta1 = """
from opentrons import instruments

metadata = {
  'apiLevel': '1'
  }

p = instruments.P10_Single(mount='right')
"""

    prot_api1_meta2 = """
from opentrons import instruments

metadata = {
  'apiLevel': '2'
  }

p = instruments.P10_Single(mount='right')
"""

    prot_api2_no_meta = """
from opentrons import types

def run(ctx):
    right = ctx.load_instrument('p300_single', types.Mount.RIGHT)
"""

    prot_api2_meta1 = """
from opentrons import types

metadata = {
  'apiLevel': '1'
  }

def run(ctx):
    right = ctx.load_instrument('p300_single', types.Mount.RIGHT)
"""

    prot_api2_meta2 = """
from opentrons import types

metadata = {
  'apiLevel': '2'
  }

def run(ctx):
    right = ctx.load_instrument('p300_single', types.Mount.RIGHT)
"""

    expected = {
        prot_api1_no_meta_a: '1',
        prot_api1_no_meta_b: '1',
        prot_api1_no_meta_c: '1',
        prot_api1_meta1: '1',
        prot_api1_meta2: '2',
        prot_api2_no_meta: '2',
        prot_api2_meta1: '1',
        prot_api2_meta2: '2'
    }

    def check(prot):
        parsed = ast.parse(prot, filename='test', mode='exec')
        metadata = extract_metadata(parsed)
        return infer_version(metadata, parsed)

    assert check(prot_api1_no_meta_a) == expected[prot_api1_no_meta_a]
    assert check(prot_api1_no_meta_b) == expected[prot_api1_no_meta_b]
    assert check(prot_api1_no_meta_c) == expected[prot_api1_no_meta_c]
    assert check(prot_api1_meta1) == expected[prot_api1_meta1]
    assert check(prot_api1_meta2) == expected[prot_api1_meta2]
    assert check(prot_api2_no_meta) == expected[prot_api2_no_meta]
    assert check(prot_api2_meta1) == expected[prot_api2_meta1]
    assert check(prot_api2_meta2) == expected[prot_api2_meta2]


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
    with pytest.raises(jsonschema.ValidationError):
        validate_json({'protocol-schema': '1.0.0'})
    with pytest.raises(jsonschema.ValidationError):
        validate_json({'schemaVersion': '3'})
    v1 = get_json_protocol_fixture('1', 'simple')
    assert validate_json(v1) == 1
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
                         [('1', 'simple'), ('3', 'testAllAtomicSingleV3')])
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
