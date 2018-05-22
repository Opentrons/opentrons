BAD_BARCODE_MESSAGE = 'Unexpected Serial -> {}'
WRITE_FAIL_MESSAGE = 'Data not saved, HOLD BUTTON'

MODELS = {
    'v1': {
        'P10S': 'p10_single_v1',
        'P10M': 'p10_multi_v1',
        'P50S': 'p50_single_v1',
        'P50M': 'p50_multi_v1',
        'P300S': 'p300_single_v1',
        'P300M': 'p300_multi_v1',
        'P1000S': 'p1000_single_v1'
    },
    'v13': {
        'P10SV13': 'p10_single_v13',
        'P10MV13': 'p10_multi_v13',
        'P50SV13': 'p50_single_v13',
        'P50MV13': 'p50_multi_v13',
        'P3HSV13': 'p300_single_v13',
        'P3HMV13': 'p300_multi_v13',
        'P1KSV13': 'p1000_single_v13'
    }
}


def connect_to_robot():
    '''
    Connect over Serial to the Smoothieware motor driver
    '''
    print()
    from opentrons import robot
    print('Connecting to robot...')
    robot.connect()
    return robot


def write_identifiers(robot, mount, new_id, new_model):
    '''
    Send a bytearray to the specified mount, so that Smoothieware can
    save the bytes to the pipette's memory
    '''
    robot._driver.write_pipette_id(mount, new_id)
    read_id = robot._driver.read_pipette_id(mount)
    _assert_the_same(new_id, read_id['pipette_id'])

    robot._driver.write_pipette_model(mount, new_model)
    read_model = robot._driver.read_pipette_model(mount)
    _assert_the_same(new_model, read_model)


def check_previous_data(robot, mount):
    old_id = robot._driver.read_pipette_id(mount)
    if old_id.get('pipette_id'):
        old_id = old_id.get('pipette_id')
    else:
        old_id = None
    old_model = robot._driver.read_pipette_model(mount)
    if old_id and old_model:
        print(
            'Overwriting old data: id={0}, model={1}'.format(
                old_id, old_model))
    else:
        print('No old data on this pipette')


def _assert_the_same(a, b):
    if a != b:
        raise Exception(WRITE_FAIL_MESSAGE)


def _user_submitted_barcode(max_length):
    '''
    User can enter a serial number as a string of HEX values
    Length of byte array must equal `num`
    '''
    barcode = input('BUTTON + SCAN: ').strip()
    if len(barcode) > max_length:
        raise Exception(BAD_BARCODE_MESSAGE.format(barcode))
    # remove all characters before the letter P
    # for example, remove ASCII selector code "\x1b(B" on chinese keyboards
    barcode = barcode[barcode.index('P'):]
    return barcode


def _parse_model_from_barcode(barcode):
    # MUST iterate through v13 first, because v1 barcodes did not have
    # characters to specify the version number
    for version in ['v13', 'v1']:
        for barcode_substring in MODELS[version].keys():
            if barcode.startswith(barcode_substring):
                return MODELS[version][barcode_substring]
    raise Exception(BAD_BARCODE_MESSAGE.format(barcode))


def main(robot):
    try:
        barcode = _user_submitted_barcode(32)
        model = _parse_model_from_barcode(barcode)
        check_previous_data(robot, 'right')
        write_identifiers(robot, 'right', barcode, model)
        print('PASS: Saved -> {0} (model {1})'.format(barcode, model))
    except KeyboardInterrupt:
        exit()
    except Exception as e:
        print('FAIL: {}'.format(e))
    main(robot)


if __name__ == "__main__":
    robot = connect_to_robot()
    main(robot)
