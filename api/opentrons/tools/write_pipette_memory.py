from opentrons.instruments.pipette_config import PIPETTE_MODEL_IDENTIFIERS


BAD_BARCODE_MESSAGE = 'Unexpected Serial -> {}'
WRITE_FAIL_MESSAGE = 'Data not saved, HOLD BUTTON'


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
    _assert_the_same(new_model, read_model['model'])


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
    try:
        for year in range(18, 100):
            try:
                model = barcode[:barcode.index('20{}'.format(year))]
            except ValueError:
                continue
            # example: "P300S", or "P10M"
            assert model[0] == 'P'
            pipette_volume = int(model[1:-1])
            num_channels = {'S': 'single', 'M': 'multi'}[model[-1]]
            possible_sizes = PIPETTE_MODEL_IDENTIFIERS[num_channels]
            model = possible_sizes[str(pipette_volume)]
            break
        assert model
    except Exception:
        raise Exception(BAD_BARCODE_MESSAGE.format(barcode))
    return model


def main(robot):
    try:
        barcode = _user_submitted_barcode(32)
        model = _parse_model_from_barcode(barcode)
        write_identifiers(robot, 'right', barcode, model)
        print('PASS: Saved -> {}'.format(barcode))
    except Exception as e:
        print('FAIL: {}'.format(e))
    main(robot)


if __name__ == "__main__":
    robot = connect_to_robot()
    main(robot)
