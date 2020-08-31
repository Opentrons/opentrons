# coding=utf-8
import io
import os
from pathlib import Path
from unittest import mock

import pytest

from opentrons import execute, types
from opentrons.hardware_control import controller, api
from opentrons.protocols.execution.execute import ExceptionInProtocolError

HERE = Path(__file__).parent


@pytest.fixture
def mock_get_attached_instr(monkeypatch, virtual_smoothie_env):
    gai_mock = mock.Mock()

    async def dummy_delay(self, duration_s):
        pass

    monkeypatch.setattr(controller.Controller,
                        'get_attached_instruments',
                        gai_mock)
    monkeypatch.setattr(api.API, 'delay', dummy_delay)
    gai_mock.return_value = {types.Mount.RIGHT: {'model': None, 'id': None},
                             types.Mount.LEFT: {'model': None, 'id': None}}
    return gai_mock


@pytest.mark.parametrize('protocol_file', ['testosaur_v2.py'])
def test_execute_function_apiv2(protocol,
                                protocol_file,
                                monkeypatch,
                                virtual_smoothie_env,
                                mock_get_attached_instr):

    mock_get_attached_instr.return_value[types.Mount.LEFT]\
        = {'model': 'p10_single_v1.5', 'id': 'testid'}
    mock_get_attached_instr.return_value[types.Mount.RIGHT]\
        = {'model': 'p300_single_v1.5', 'id': 'testid2'}
    entries = []

    def emit_runlog(entry):
        nonlocal entries
        entries.append(entry)

    execute.execute(
        protocol.filelike, 'testosaur_v2.py', emit_runlog=emit_runlog)
    assert [item['payload']['text'] for item in entries
            if item['$'] == 'before'] == [
        'Picking up tip from A1 of Opentrons 96 Tip Rack 300 µL on 1',
        'Aspirating 10.0 uL from A1 of Corning 96 Well Plate 360 µL Flat on 2 at 150.0 uL/sec',  # noqa(E501),
        'Dispensing 10.0 uL into B1 of Corning 96 Well Plate 360 µL Flat on 2 at 300.0 uL/sec',  # noqa(E501),
        'Dropping tip into H12 of Opentrons 96 Tip Rack 300 µL on 1'
        ]


def test_execute_function_json_v3_apiv2(get_json_protocol_fixture,
                                        virtual_smoothie_env,
                                        mock_get_attached_instr):
    jp = get_json_protocol_fixture('3', 'simple', False)
    filelike = io.StringIO(jp)
    entries = []

    def emit_runlog(entry):
        nonlocal entries
        entries.append(entry)

    mock_get_attached_instr.return_value[types.Mount.LEFT] = {
        'model': 'p10_single_v1.5', 'id': 'testid'}
    execute.execute(filelike, 'simple.json', emit_runlog=emit_runlog)
    assert [item['payload']['text'] for item in entries
            if item['$'] == 'before'] == [
        'Picking up tip from B1 of Opentrons 96 Tip Rack 10 µL on 1',
        'Aspirating 5.0 uL from A1 of Source Plate on 2 at 3.0 uL/sec',
        'Delaying for 0 minutes and 42 seconds',
        'Dispensing 4.5 uL into B1 of Dest Plate on 3 at 2.5 uL/sec',
        'Touching tip',
        'Blowing out at B1 of Dest Plate on 3',
        'Dropping tip into A1 of Trash on 12'
    ]


def test_execute_function_json_v4_apiv2(get_json_protocol_fixture,
                                        virtual_smoothie_env,
                                        mock_get_attached_instr):
    jp = get_json_protocol_fixture('4', 'simpleV4', False)
    filelike = io.StringIO(jp)
    entries = []

    def emit_runlog(entry):
        nonlocal entries
        entries.append(entry)

    mock_get_attached_instr.return_value[types.Mount.LEFT] = {
        'model': 'p10_single_v1.5', 'id': 'testid'}
    execute.execute(filelike, 'simple.json', emit_runlog=emit_runlog)
    assert [item['payload']['text'] for item in entries
            if item['$'] == 'before'] == [
        'Picking up tip from B1 of Opentrons 96 Tip Rack 10 µL on 1',
        'Aspirating 5.0 uL from A1 of Source Plate on 2 at 3.0 uL/sec',
        'Delaying for 0 minutes and 42 seconds',
        'Dispensing 4.5 uL into B1 of Dest Plate on 3 at 2.5 uL/sec',
        'Touching tip',
        'Blowing out at B1 of Dest Plate on 3',
        'Dropping tip into A1 of Trash on 12'
    ]


def test_execute_function_json_v5_apiv2(get_json_protocol_fixture,
                                        virtual_smoothie_env,
                                        mock_get_attached_instr):
    jp = get_json_protocol_fixture('5', 'simpleV5', False)
    filelike = io.StringIO(jp)
    entries = []

    def emit_runlog(entry):
        nonlocal entries
        entries.append(entry)

    mock_get_attached_instr.return_value[types.Mount.LEFT] = {
        'model': 'p10_single_v1.5', 'id': 'testid'}
    execute.execute(filelike, 'simple.json', emit_runlog=emit_runlog)
    assert [item['payload']['text'] for item in entries
            if item['$'] == 'before'] == [
        'Picking up tip from B1 of Opentrons 96 Tip Rack 10 µL on 1',
        'Aspirating 5.0 uL from A1 of Source Plate on 2 at 3.0 uL/sec',
        'Delaying for 0 minutes and 42 seconds',
        'Dispensing 4.5 uL into B1 of Dest Plate on 3 at 2.5 uL/sec',
        'Touching tip',
        'Blowing out at B1 of Dest Plate on 3',
        'Dropping tip into A1 of Trash on 12'
    ]


def test_execute_function_bundle_apiv2(get_bundle_fixture,
                                       virtual_smoothie_env,
                                       mock_get_attached_instr):
    bundle = get_bundle_fixture('simple_bundle')
    entries = []

    def emit_runlog(entry):
        nonlocal entries
        entries.append(entry)

    mock_get_attached_instr.return_value[types.Mount.LEFT] = {
        'model': 'p10_single_v1.5', 'id': 'testid'}
    execute.execute(
        bundle['filelike'], 'simple_bundle.zip', emit_runlog=emit_runlog)
    assert [item['payload']['text']
            for item in entries if item['$'] == 'before'] == [
        'Transferring 1.0 from A1 of FAKE example labware on 1 to A4 of FAKE example labware on 1',  # noqa(E501)
        'Picking up tip from A1 of Opentrons 96 Tip Rack 10 µL on 3',
        "Aspirating 1.0 uL from A1 of FAKE example labware on 1 at" \
        " 5.0 uL/sec",
        "Dispensing 1.0 uL into A4 of FAKE example labware on 1 at" \
        " 10.0 uL/sec",
        'Dropping tip into A1 of Opentrons Fixed Trash on 12',
        'Transferring 2.0 from A1 of FAKE example labware on 1 to A4 of FAKE example labware on 1',  # noqa(E501)
        'Picking up tip from B1 of Opentrons 96 Tip Rack 10 µL on 3',
        'Aspirating 2.0 uL from A1 of FAKE example labware on 1 at 5.0 uL/sec',
        "Dispensing 2.0 uL into A4 of FAKE example labware on 1 at" \
        " 10.0 uL/sec",
        'Dropping tip into A1 of Opentrons Fixed Trash on 12',
        'Transferring 3.0 from A1 of FAKE example labware on 1 to A4 of FAKE example labware on 1',  # noqa(E501)
        'Picking up tip from C1 of Opentrons 96 Tip Rack 10 µL on 3',
        'Aspirating 3.0 uL from A1 of FAKE example labware on 1 at 5.0 uL/sec',
        "Dispensing 3.0 uL into A4 of FAKE example labware on 1 at" \
        " 10.0 uL/sec",
        'Dropping tip into A1 of Opentrons Fixed Trash on 12'
        ]


@pytest.mark.parametrize('protocol_file', ['testosaur.py'])
def test_execute_function_v1(protocol, protocol_file,
                             virtual_smoothie_env,
                             mock_get_attached_instr):
    entries = []

    def emit_runlog(entry):
        nonlocal entries
        entries.append(entry)

    mock_get_attached_instr.return_value[types.Mount.RIGHT] = {
        'model': 'p300_single_v1.5', 'id': 'testid'}
    execute.execute(protocol.filelike, 'testosaur.py', emit_runlog=emit_runlog)
    assert [item['payload']['text'] for item in entries
            if item['$'] == 'before'] == [
        'Picking up tip from well A1 in "5"',
        'Aspirating 10.0 uL from well A1 in "8" at 150.0 uL/sec',
        'Dispensing 10.0 uL into well H12 in "8" at 300.0 uL/sec',
        'Aspirating 10.0 uL from well A1 in "11" at 150.0 uL/sec',
        'Dispensing 10.0 uL into well H12 in "11" at 300.0 uL/sec',
        'Dropping tip into well A1 in "12"'
    ]


@pytest.mark.parametrize('protocol_file', ['python_v2_custom_lw.py'])
def test_execute_extra_labware(protocol, protocol_file, monkeypatch,
                               virtual_smoothie_env, mock_get_attached_instr):
    fixturedir = HERE / '..' / '..' / '..' /\
        'shared-data' / 'labware' / 'fixtures' / '2'
    entries = []

    def emit_runlog(entry):
        nonlocal entries
        entries.append(entry)

    mock_get_attached_instr.return_value[types.Mount.RIGHT] = {
        'model': 'p300_single_v2.0', 'id': 'testid'}
    # make sure we can load labware explicitly
    # make sure we don't have an exception from not finding the labware
    execute.execute(protocol.filelike, 'custom_labware.py',
                    emit_runlog=emit_runlog,
                    custom_labware_paths=[str(fixturedir)])
    # instead of 4 in simulate because we get before and after
    assert len(entries) == 8

    protocol.filelike.seek(0)
    # make sure we don't get autoload behavior when not on a robot
    with pytest.raises(ExceptionInProtocolError,
                       match='.*FileNotFoundError.*'):
        execute.execute(protocol.filelike, 'custom_labware.py')
    no_lw = execute.get_protocol_api('2.0')
    assert not no_lw._extra_labware
    protocol.filelike.seek(0)
    monkeypatch.setattr(execute, 'IS_ROBOT', True)
    monkeypatch.setattr(execute, 'JUPYTER_NOTEBOOK_LABWARE_DIR',
                        fixturedir)
    # make sure we don't have an exception from not finding the labware
    entries = []
    execute.execute(protocol.filelike, 'custom_labware.py',
                    emit_runlog=emit_runlog)
    # instead of 4 in simulate because we get before and after
    assert len(entries) == 8

    # make sure the extra labware loaded by default is right
    ctx = execute.get_protocol_api('2.0')
    assert len(ctx._extra_labware.keys()) == len(os.listdir(fixturedir))

    assert ctx.load_labware('fixture_12_trough', 1, namespace='fixture')

    # if there is no labware dir, make sure everything still works
    monkeypatch.setattr(execute, 'JUPYTER_NOTEBOOK_LABWARE_DIR',
                        HERE / 'nosuchdirectory')
    ctx = execute.get_protocol_api('2.0')
    with pytest.raises(FileNotFoundError):
        ctx.load_labware("fixture_12_trough", 1, namespace='fixture')
