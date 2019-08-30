import ast
from opentrons.protocols.parse import extract_metadata, infer_version


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

    # for protocol, expected_version in expected.items():
    #     parsed = ast.parse(protocol, filename='test', mode='exec')
    #     metadata = extract_metadata(parsed)
    #     detected_version = infer_version(metadata, parsed)
    #     assert detected_version == expected_version
