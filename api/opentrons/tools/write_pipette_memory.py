def connect_to_robot():
    '''
    Connect over Serial to the Smoothieware motor driver
    '''
    print()
    from opentrons import robot
    print('Connecting to robot...')
    robot.connect()
    return robot


def scan_instruments(robot):
    '''
    Check for a previously-written pipette on both Left and Right mounts
    Return a dictionary, with mount (L/R) as key and ID (bytearray) as value
    '''
    print()
    found_instruments = {}
    for mount in ['left', 'right']:
        try:
            read_id = robot._driver.read_pipette_id(mount)
            read_model = robot._driver.read_pipette_model(mount)
        except Exception:
            continue
        if read_id and read_model:
            found_instruments[mount] = {
                'id': read_id,
                'model': read_model
            }
    if found_instruments:
        print('Previously-Written Pipettes Found:')
        for mount, data in found_instruments.items():
            print(
                '\t', mount, ':\r\n\t\tid:',
                data['id'], '\r\n\t\tmodel:', data['model']
            )
    return found_instruments


def select_mount(found_instruments):
    '''
    User selects which mount to write the data to (L or R)
    '''
    print()
    mount_msg = 'Select which side pipette to write to (enter "l" or "r"):  '
    res = input(mount_msg)
    mount = res.strip().upper()[0].upper()
    if mount not in 'LR':
        raise Exception('Unknown mount: {}'.format(res))
    mount = {'L': 'left', 'R': 'right'}.get(mount)
    print('Writing to mount {}'.format(mount))
    if mount in found_instruments:
        confirm_msg = 'Pipette {} already has data. '.format(mount)
        confirm_msg += 'Proceed and overwrite? (Y or N):  '
        confirm = input(confirm_msg).upper()
        if 'N' in confirm:
            raise Exception('Not writing new data, exiting script')
    return mount


def generate_id():
    '''
    Create the ID bytearray, from combining the pipette's model,
    and a unique serial number.
    User can select from either a randomly generated serial number,
    or manually enter one
    '''
    print()
    num_channels = _ask_for_number_of_channels()
    model_string = _ask_for_pipette_volume(num_channels)
    print('Pipette model: {}'.format(model_string))

    print()
    # unique section of serial number is 6-bytes long
    max_length_of_unique_id = 32
    unique_id_string = _user_submitted_id(max_length_of_unique_id)
    print('Unique ID: {}'.format(unique_id_string))
    return (model_string, unique_id_string)


def write_identifiers(robot, mount, new_id, new_model):
    '''
    Send a bytearray to the specified mount, so that Smoothieware can
    save the bytes to the pipette's memory
    '''
    print()
    print('Ok, now HOLD down the BUTTON on the pipette')
    if 'Y' not in input('Ready to save the ID? (Y or N):  ').upper():
        raise Exception('Not writing ID to pipette, and exiting script')

    robot._driver.write_pipette_id(mount, new_id)
    read_id = robot._driver.read_pipette_id(mount)
    print('Just Read ID: ', read_id['pipette_id'])
    _assert_the_same(new_id, read_id['pipette_id'])

    robot._driver.write_pipette_model(mount, new_model)
    read_model = robot._driver.read_pipette_model(mount)
    print('Just Read MODEL: ', read_model['model'])
    _assert_the_same(new_model, read_model['model'])


def _assert_the_same(a, b):
    if a != b:
        raise Exception('Failed Writing: Are you holding down the button?')


def _ask_for_number_of_channels():
    channels_question = 'Is it multi or single channel? (M or S):  '
    res = input(channels_question)
    num_channels = res.upper()[0]
    if 'M' in num_channels:
        return 'multi'
    elif 'S' in num_channels:
        return 'single'
    else:
        raise Exception('Unknown input: {}'.format(num_channels))


def _ask_for_pipette_volume(num_channels):
    from opentrons.instruments.pipette_config import PIPETTE_MODEL_IDENTIFIERS
    possible_sizes = PIPETTE_MODEL_IDENTIFIERS[num_channels]
    volume_question = 'What size pipette is it? ({}):  '.format(
        ''.join([
            str(n) + (' or ' if (i < len(possible_sizes.keys()) - 1) else '')
            for i, n in enumerate(list(possible_sizes.keys()))
        ])
    )
    pipette_volume = input(volume_question).strip()
    new_model_string = possible_sizes.get(pipette_volume)
    assert new_model_string
    return new_model_string


def _user_submitted_id(max_length):
    '''
    User can enter a serial number as a string of HEX values
    Length of byte array must equal `num`
    '''
    id_msg = 'Enter serial number'
    id_msg += ' (case-sensitive, max {} characters): '.format(max_length)
    manual_id = input(id_msg).strip()
    if len(manual_id) > max_length:
        bad_id_msg = 'Please enter serial-number less than {0}-characters,'
        bad_id_msg += '{1} is too long'.format(max_length, manual_id)
        raise Exception(bad_id_msg)
    return manual_id


def main(robot):
    print('\n')
    found_instruments = scan_instruments(robot)
    mount = select_mount(found_instruments)
    new_model, new_id = generate_id()
    write_identifiers(robot, mount, new_id, new_model)
    input_message = '\nSUCCESS! Write another pipette?? (Y or N): '
    if 'y' in input(input_message).lower():
        main(robot)


if __name__ == "__main__":
    robot = connect_to_robot()
    main(robot)
