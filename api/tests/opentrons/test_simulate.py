# coding=utf-8
import io

import pytest

from opentrons import simulate, protocols


@pytest.mark.parametrize('protocol_file', ['testosaur_v2.py'])
def test_simulate_function_apiv2(protocol,
                                 protocol_file):
    runlog, bundle = simulate.simulate(
        protocol.filelike, 'testosaur_v2.py')
    assert isinstance(bundle, protocols.types.BundleContents)
    assert [item['payload']['text'] for item in runlog] == [
        'Picking up tip A1 of Opentrons 96 Tip Rack 300 µL on 1',
        'Aspirating 10 uL from A1 of Corning 96 Well Plate 360 µL Flat on 2 at 1.0 speed',  # noqa(E501),
        'Dispensing 10 uL into B1 of Corning 96 Well Plate 360 µL Flat on 2',
        'Dropping tip H12 of Opentrons 96 Tip Rack 300 µL on 1'
        ]


def test_simulate_function_json_apiv2(get_json_protocol_fixture):
    jp = get_json_protocol_fixture('3', 'simple', False)
    filelike = io.StringIO(jp)
    runlog, bundle = simulate.simulate(filelike, 'simple.json')
    assert bundle is None
    assert [item['payload']['text'] for item in runlog] == [
        'Picking up tip B1 of Opentrons 96 Tip Rack 10 µL on 1',
        'Aspirating 5 uL from A1 of Source Plate on 2 at 1.0 speed',
        'Delaying for 0m 42s',
        'Dispensing 4.5 uL into B1 of Dest Plate on 3',
        'Touching tip',
        'Blowing out at B1 of Dest Plate on 3',
        'Dropping tip A1 of Trash on 12'
    ]


def test_simulate_function_bundle_apiv2(get_bundle_fixture):
    bundle = get_bundle_fixture('simple_bundle')
    runlog, bundle = simulate.simulate(
        bundle['filelike'], 'simple_bundle.zip')
    assert bundle is None
    assert [item['payload']['text'] for item in runlog] == [
        'Transferring 1.0 from A1 of FAKE example labware on 1 to A4 of FAKE example labware on 1',  # noqa(E501)
        'Picking up tip A1 of Opentrons 96 Tip Rack 10 µL on 3',
        'Aspirating 1.0 uL from A1 of FAKE example labware on 1 at 1.0 speed',
        'Dispensing 1.0 uL into A4 of FAKE example labware on 1',
        'Dropping tip A1 of Opentrons Fixed Trash on 12',
        'Transferring 2.0 from A1 of FAKE example labware on 1 to A4 of FAKE example labware on 1',  # noqa(E501)
        'Picking up tip B1 of Opentrons 96 Tip Rack 10 µL on 3',
        'Aspirating 2.0 uL from A1 of FAKE example labware on 1 at 1.0 speed',
        'Dispensing 2.0 uL into A4 of FAKE example labware on 1',
        'Dropping tip A1 of Opentrons Fixed Trash on 12',
        'Transferring 3.0 from A1 of FAKE example labware on 1 to A4 of FAKE example labware on 1',  # noqa(E501)
        'Picking up tip C1 of Opentrons 96 Tip Rack 10 µL on 3',
        'Aspirating 3.0 uL from A1 of FAKE example labware on 1 at 1.0 speed',
        'Dispensing 3.0 uL into A4 of FAKE example labware on 1',
        'Dropping tip A1 of Opentrons Fixed Trash on 12'
        ]


@pytest.mark.parametrize('protocol_file', ['testosaur.py'])
def test_simulate_function_apiv1(protocol, protocol_file):
    runlog, bundle = simulate.simulate(protocol.filelike, 'testosaur.py')
    assert bundle is None
    assert runlog[0]['payload']['text'].startswith('Picking up tip')
    assert 'A1' in runlog[0]['payload']['text']
    assert runlog[1]['payload']['text'].startswith('Aspirating 10 uL')
    assert 'A1' in runlog[1]['payload']['text']
    assert runlog[2]['payload']['text'].startswith('Dispensing 10 uL')
    assert 'H12' in runlog[2]['payload']['text']
    assert runlog[3]['payload']['text'].startswith('Aspirating 10 uL')
    assert 'A1' in runlog[3]['payload']['text']
    assert runlog[4]['payload']['text'].startswith('Dispensing 10 uL')
    assert 'H12' in runlog[4]['payload']['text']
    assert runlog[5]['payload']['text'].startswith('Dropping tip')
    assert 'A1' in runlog[5]['payload']['text']
    assert len(runlog) == 6


@pytest.mark.parametrize('protocol_file', ['testosaur.py'])
def test_simulate_function_v1(protocol, protocol_file):
    runlog, bundle = simulate.simulate(protocol.filelike, 'testosaur.py')
    assert bundle is None
    assert [item['payload']['text'] for item in runlog] == [
        'Picking up tip well A1 in "5"',
        'Aspirating 10 uL from well A1 in "8" at 1.0 speed',
        'Dispensing 10 uL into well H12 in "8"',
        'Aspirating 10 uL from well A1 in "11" at 1.0 speed',
        'Dispensing 10 uL into well H12 in "11"',
        'Dropping tip well A1 in "12"'
    ]
