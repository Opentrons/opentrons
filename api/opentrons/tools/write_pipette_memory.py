from opentrons.instruments.pipette_config import PIPETTE_MODEL_IDENTIFIERS


BAD_BARCODE_MESSAGE = 'Unexpected Serial -> {}'
WRITE_FAIL_MESSAGE = 'Data not saved, HOLD BUTTON'

MODELS = {
    'P10S': PIPETTE_MODEL_IDENTIFIERS['single']['10'],
    'P10M': PIPETTE_MODEL_IDENTIFIERS['multi']['10'],
    'P50S': PIPETTE_MODEL_IDENTIFIERS['single']['50'],
    'P50M': PIPETTE_MODEL_IDENTIFIERS['multi']['50'],
    'P300S': PIPETTE_MODEL_IDENTIFIERS['single']['300'],
    'P300M': PIPETTE_MODEL_IDENTIFIERS['multi']['300'],
    'P1000S': PIPETTE_MODEL_IDENTIFIERS['single']['1000']
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
    return barcode


def _parse_model_from_barcode(barcode):
    model = None
    for key in MODELS.keys():
        if key in barcode:
            model = MODELS[key]
            break
    if not model:
        raise Exception(BAD_BARCODE_MESSAGE.format(barcode))
    return model


def main(robot):
    try:
        barcode = _user_submitted_barcode(32)
        model = _parse_model_from_barcode(barcode)
        check_previous_data(robot, 'right')
        write_identifiers(robot, 'right', barcode, model)
        print('PASS: Saved -> {}'.format(barcode))
    except KeyboardInterrupt:
        exit()
    except Exception as e:
        print('FAIL: {}'.format(e))
    main(robot)


if __name__ == "__main__":
    robot = connect_to_robot()
    main(robot)
