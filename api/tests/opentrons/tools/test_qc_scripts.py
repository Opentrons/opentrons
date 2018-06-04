import pytest

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
    'P1KSV1318010107': 'p1000_single_v1.3'
}


def test_parse_model_from_barcode():
    from opentrons.tools import write_pipette_memory as wpm
    for barcode, model in pipette_barcode_to_model.items():
        assert wpm._parse_model_from_barcode(barcode) == model

    with pytest.raises(Exception):
        wpm._parse_model_from_barcode('P1HSV1318010101')

    with pytest.raises(Exception):
        wpm._parse_model_from_barcode('P1KSV1218010101')

    with pytest.raises(Exception):
        wpm._parse_model_from_barcode('aP300S20180101A01')


def test_read_old_pipette_id_and_model():
    import io
    import types
    from contextlib import redirect_stdout
    from opentrons import robot
    from opentrons.tools import write_pipette_memory as wpm
    from opentrons.drivers.smoothie_drivers.driver_3_0 import \
        GCODES, _byte_array_to_hex_string

    driver = robot._driver
    driver.simulating = False
    _old_send_command = driver._send_command

    def _new_send_message(self, command, timeout=None):
        if GCODES['READ_INSTRUMENT_ID'] in command:
            return ''
        elif GCODES['READ_INSTRUMENT_MODEL'] in command:
            return ''
        else:
            return ''

    driver._send_command = types.MethodType(_new_send_message, driver)

    f = io.StringIO()
    with redirect_stdout(f):
        wpm.check_previous_data(robot, 'right')
    out = f.getvalue()
    exp = 'No old data on this pipette'
    assert out.strip() == exp

    for old_id, old_model in pipette_barcode_to_model.items():

        def _new_send_message(self, command, timeout=None):
            if GCODES['READ_INSTRUMENT_ID'] in command:
                return 'R:' + _byte_array_to_hex_string(old_id.encode())
            elif GCODES['READ_INSTRUMENT_MODEL'] in command:
                return 'R:' + _byte_array_to_hex_string(old_model.encode())
            else:
                return ''

        driver._send_command = types.MethodType(_new_send_message, driver)

        f = io.StringIO()
        with redirect_stdout(f):
            wpm.check_previous_data(robot, 'right')
        out = f.getvalue()
        exp = 'Overwriting old data: id={0}, model={1}'.format(
            old_id, old_model)
        assert out.strip() == exp

    driver._send_command = _old_send_command


def test_write_new_pipette_id_and_model():
    import types
    from opentrons import robot
    from opentrons.tools import write_pipette_memory as wpm
    from opentrons.drivers.smoothie_drivers.driver_3_0 import \
        GCODES, _byte_array_to_hex_string

    driver = robot._driver
    driver.simulating = False
    _old_send_command = driver._send_command

    for new_id, new_model in pipette_barcode_to_model.items():

        def _new_send_message(self, command, timeout=None):
            nonlocal new_id, new_model
            if GCODES['READ_INSTRUMENT_ID'] in command:
                return 'R:' + _byte_array_to_hex_string(new_id.encode())
            elif GCODES['READ_INSTRUMENT_MODEL'] in command:
                return 'R:' + _byte_array_to_hex_string(new_model.encode())
            else:
                return ''

        driver._send_command = types.MethodType(_new_send_message, driver)

        # this will raise an error if the received id/model does not match
        # the id/model that was written
        wpm.write_identifiers(robot, 'right', new_id, new_model)

    driver._send_command = _old_send_command
