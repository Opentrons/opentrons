# coding=utf-8
import io
import os
from pathlib import Path

import pytest

from opentrons import simulate, protocols
from opentrons.protocol_api.execute import ExceptionInProtocolError

HERE = Path(__file__).parent


@pytest.mark.parametrize('protocol_file', ['testosaur_v2.py'])
def test_simulate_function_apiv2(protocol,
                                 protocol_file,
                                 monkeypatch):
    monkeypatch.setenv('OT_API_FF_allowBundleCreation', '1')
    runlog, bundle = simulate.simulate(
        protocol.filelike, 'testosaur_v2.py')
    assert isinstance(bundle, protocols.types.BundleContents)
    assert [item['payload']['text'] for item in runlog] == [
        'Picking up tip from A1 of Opentrons 96 Tip Rack 300 µL on 1',
        'Aspirating 10.0 uL from A1 of Corning 96 Well Plate 360 µL Flat on 2 at 1.0 speed',  # noqa(E501),
        'Dispensing 10.0 uL into B1 of Corning 96 Well Plate 360 µL Flat on 2 at 1.0 speed',  # noqa(E501),
        'Dropping tip into H12 of Opentrons 96 Tip Rack 300 µL on 1'
        ]


def test_simulate_function_json_apiv2(get_json_protocol_fixture):
    jp = get_json_protocol_fixture('3', 'simple', False)
    filelike = io.StringIO(jp)
    runlog, bundle = simulate.simulate(filelike, 'simple.json')
    assert bundle is None
    assert [item['payload']['text'] for item in runlog] == [
        'Picking up tip from B1 of Opentrons 96 Tip Rack 10 µL on 1',
        'Aspirating 5.0 uL from A1 of Source Plate on 2 at 1.0 speed',
        'Delaying for 0 minutes and 42 seconds',
        'Dispensing 4.5 uL into B1 of Dest Plate on 3 at 1.0 speed',
        'Touching tip',
        'Blowing out at B1 of Dest Plate on 3',
        'Dropping tip into A1 of Trash on 12'
    ]


def test_simulate_function_bundle_apiv2(get_bundle_fixture):
    bundle = get_bundle_fixture('simple_bundle')
    runlog, bundle = simulate.simulate(
        bundle['filelike'], 'simple_bundle.zip')
    assert bundle is None
    assert [item['payload']['text'] for item in runlog] == [
        'Transferring 1.0 from A1 of FAKE example labware on 1 to A4 of FAKE example labware on 1',  # noqa(E501)
        'Picking up tip from A1 of Opentrons 96 Tip Rack 10 µL on 3',
        'Aspirating 1.0 uL from A1 of FAKE example labware on 1 at 1.0 speed',
        'Dispensing 1.0 uL into A4 of FAKE example labware on 1 at 1.0 speed',
        'Dropping tip into A1 of Opentrons Fixed Trash on 12',
        'Transferring 2.0 from A1 of FAKE example labware on 1 to A4 of FAKE example labware on 1',  # noqa(E501)
        'Picking up tip from B1 of Opentrons 96 Tip Rack 10 µL on 3',
        'Aspirating 2.0 uL from A1 of FAKE example labware on 1 at 1.0 speed',
        'Dispensing 2.0 uL into A4 of FAKE example labware on 1 at 1.0 speed',
        'Dropping tip into A1 of Opentrons Fixed Trash on 12',
        'Transferring 3.0 from A1 of FAKE example labware on 1 to A4 of FAKE example labware on 1',  # noqa(E501)
        'Picking up tip from C1 of Opentrons 96 Tip Rack 10 µL on 3',
        'Aspirating 3.0 uL from A1 of FAKE example labware on 1 at 1.0 speed',
        'Dispensing 3.0 uL into A4 of FAKE example labware on 1 at 1.0 speed',
        'Dropping tip into A1 of Opentrons Fixed Trash on 12'
        ]


@pytest.mark.parametrize('protocol_file', ['testosaur.py'])
def test_simulate_function_v1(protocol, protocol_file):
    runlog, bundle = simulate.simulate(protocol.filelike, 'testosaur.py')
    assert bundle is None
    assert [item['payload']['text'] for item in runlog] == [
        'Picking up tip from well A1 in "5"',
        'Aspirating 10.0 uL from well A1 in "8" at 1.0 speed',
        'Dispensing 10.0 uL into well H12 in "8" at 1.0 speed',
        'Aspirating 10.0 uL from well A1 in "11" at 1.0 speed',
        'Dispensing 10.0 uL into well H12 in "11" at 1.0 speed',
        'Dropping tip into well A1 in "12"'
    ]


@pytest.mark.parametrize('protocol_file', ['python_v2_custom_lw.py'])
def test_simulate_extra_labware(protocol, protocol_file, monkeypatch):
    fixturedir = HERE / '..' / '..' / '..' /\
        'shared-data' / 'labware' / 'fixtures' / '2'
    # make sure we can load labware explicitly
    # make sure we don't have an exception from not finding the labware
    runlog, _ = simulate.simulate(protocol.filelike, 'custom_labware.py',
                                  custom_labware_paths=[str(fixturedir)])
    assert len(runlog) == 4

    protocol.filelike.seek(0)
    # make sure we don't get autoload behavior when not on a robot
    with pytest.raises(ExceptionInProtocolError,
                       match='.*FileNotFoundError.*'):
        simulate.simulate(protocol.filelike, 'custom_labware.py')
    no_lw = simulate.get_protocol_api('2.0')
    assert not no_lw._extra_labware
    protocol.filelike.seek(0)
    monkeypatch.setattr(simulate, 'IS_ROBOT', True)
    monkeypatch.setattr(simulate, 'JUPYTER_NOTEBOOK_LABWARE_DIR',
                        fixturedir)
    # make sure we don't have an exception from not finding the labware
    runlog, _ = simulate.simulate(protocol.filelike, 'custom_labware.py')
    assert len(runlog) == 4

    # make sure the extra labware loaded by default is right
    ctx = simulate.get_protocol_api('2.0')
    assert len(ctx._extra_labware.keys()) == len(os.listdir(fixturedir))

    assert ctx.load_labware('fixture_12_trough', 1, namespace='fixture')

    # if there is no labware dir, make sure everything still works
    monkeypatch.setattr(simulate, 'JUPYTER_NOTEBOOK_LABWARE_DIR',
                        HERE / 'nosuchdirectory')
    ctx = simulate.get_protocol_api('2.0')
    with pytest.raises(FileNotFoundError):
        ctx.load_labware("fixture_12_trough", 1, namespace='fixture')
