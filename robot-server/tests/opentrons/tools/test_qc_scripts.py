import pytest
from unittest import mock
import sys

import opentrons

pipette_barcode_to_model = {
    'P10S20180101A01': 'p10_single_v1',
    'P10M20180101A01': 'p10_multi_v1',
    'P50S180101A01': 'p50_single_v1',
    'P50M20180101B01': 'p50_multi_v1',
    'P300S20180101A01': 'p300_single_v1',
    'P300M20180101A01': 'p300_multi_v1',
    'P1000S20180101A01': 'p1000_single_v1',
    'P10SV1318010101': 'p10_single_v1.3',
    'P10MV1318010102': 'p10_multi_v1.3',
    'P50SV1318010103': 'p50_single_v1.3',
    'P50MV1318010104': 'p50_multi_v1.3',
    'P3HSV1318010105': 'p300_single_v1.3',
    'P3HMV1318010106': 'p300_multi_v1.3',
    'P1KSV1318010107': 'p1000_single_v1.3',
    'P10SV1418010101': 'p10_single_v1.4',
    'P10MV1418010102': 'p10_multi_v1.4',
    'P50SV1418010103': 'p50_single_v1.4',
    'P50MV1418010104': 'p50_multi_v1.4',
    'P3HSV1418010105': 'p300_single_v1.4',
    'P3HMV1418010106': 'p300_multi_v1.4',
    'P1KSV1418010107': 'p1000_single_v1.4'
}


@pytest.fixture
def driver_import(monkeypatch, virtual_smoothie_env):
    monkeypatch.setattr(opentrons.robot, 'connect', mock.Mock())
    # tools.__init__ builds an OptParse and parses it on init, and
    # if we don't do this it will see the args passed to pytest
    # and choke
    monkeypatch.setattr(sys.modules['sys'], 'argv', [])
    from opentrons import tools
    monkeypatch.setattr(tools, 'driver', opentrons.robot._driver)
    yield
    opentrons.robot.disconnect()
    opentrons.robot.reset()


def test_parse_model_from_barcode(driver_import):
    from opentrons.tools import write_pipette_memory as wpm
    for barcode, model in pipette_barcode_to_model.items():
        assert wpm._parse_model_from_barcode(barcode) == model

    with pytest.raises(Exception):
        wpm._parse_model_from_barcode('P1HSV1318010101')

    with pytest.raises(Exception):
        wpm._parse_model_from_barcode('P1KSV1218010101')

    with pytest.raises(Exception):
        wpm._parse_model_from_barcode('aP300S20180101A01')


@pytest.mark.api1_only
def test_read_old_pipette_id_and_model(driver_import, monkeypatch):
    import io
    from contextlib import redirect_stdout
    from opentrons.tools import driver, write_pipette_memory as wpm
    from opentrons.drivers.smoothie_drivers.driver_3_0 import GCODES

    def _new_send_message(command):
        if GCODES['READ_INSTRUMENT_ID'] in command:
            return command.split(' ')[1]
        elif GCODES['READ_INSTRUMENT_MODEL'] in command:
            return command.split(' ')[1]
        else:
            return ''

    def read_id(mount):
        return _new_send_message(command='')

    def read_model(mount):
        return _new_send_message(command='')

    monkeypatch.setattr(driver, 'read_pipette_id', read_id)
    monkeypatch.setattr(driver, 'read_pipette_model', read_model)

    f = io.StringIO()
    with redirect_stdout(f):
        wpm.check_previous_data('right')
    out = f.getvalue()
    exp = 'No old data on this pipette'
    assert out.strip() == exp

    for old_id, old_model in pipette_barcode_to_model.items():

        def read_id(mount):
            return _new_send_message(command=f'M369 {old_id}')

        def read_model(mount):
            return _new_send_message(command=f'M371 {old_model}')

        monkeypatch.setattr(driver, 'read_pipette_id', read_id)
        monkeypatch.setattr(driver, 'read_pipette_model', read_model)

        f = io.StringIO()
        with redirect_stdout(f):
            wpm.check_previous_data('right')
        out = f.getvalue()
        exp = 'Overwriting old data: id={0}, model={1}'.format(
            old_id, old_model)
        assert out.strip() == exp


@pytest.mark.api1_only
def test_write_new_pipette_id_and_model(driver_import, monkeypatch):
    from opentrons.tools import driver, write_pipette_memory as wpm
    from opentrons.drivers.smoothie_drivers.driver_3_0 import \
        GCODES

    for new_id, new_model in pipette_barcode_to_model.items():

        def _new_send_message(command, timeout=None):
            nonlocal new_id, new_model
            if GCODES['READ_INSTRUMENT_ID'] in command:
                return new_id
            elif GCODES['READ_INSTRUMENT_MODEL'] in command:
                return new_model
            else:
                return ''

        def read_id(mount):
            return _new_send_message(command='M369')

        def read_model(mount):
            return _new_send_message(command='M371')

        monkeypatch.setattr(driver, 'read_pipette_id', read_id)
        monkeypatch.setattr(driver, 'read_pipette_model', read_model)
        # this will raise an error if the received id/model does not match
        # the id/model that was written
        wpm.write_identifiers('right', new_id, new_model)
