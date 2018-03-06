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
    for mount in 'LR':
        res = robot._driver._read_instrument_id(mount)
        if res:
            found_instruments[mount] = res
    if found_instruments:
        print('Previously-Written Pipettes Found:')
        for mount, identifier in found_instruments.items():
            print(' ', mount, ': ', _byte_array_to_string(identifier))
    return found_instruments


def select_mount(found_instruments):
    '''
    User selects which mount to write the data to (L or R)
    '''
    print()
    mount_msg = 'Select which side pipette to write to (L or R):  '
    res = input(mount_msg)
    mount = res.strip().upper()[0]
    if mount not in 'LR':
        raise Exception('Unknown mount: {}'.format(res))
    print('Writing to mount {}'.format(mount))
    if mount in found_instruments:
        confirm_msg = 'Pipette {} already has data. '.format(mount)
        confirm_msg += 'Proceed and overwrite? (Y or N):  '
        confirm = input(confirm_msg).upper()
        if 'N' in confirm:
            return
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
    model_byte_array = _ask_for_pipette_volume(num_channels)
    print('Pipette model: {}'.format(_byte_array_to_string(model_byte_array)))

    print()
    # unique section of serial number is 6-bytes long
    length_of_unique_id = 6
    confirm = input('Auto-generate an unique ID number? (Y or N):  ').upper()
    if 'Y' in confirm:
        unique_byte_array = _random_byte_list(length_of_unique_id)
    else:
        unique_byte_array = _user_submitted_id(length_of_unique_id)
    print('Unique ID: {}'.format(_byte_array_to_string(unique_byte_array)))
    print()
    combined_id = model_byte_array + unique_byte_array
    print('Combined ID: {0}'.format(_byte_array_to_string(combined_id)))
    return combined_id


def write_identifier(robot, mount, byte_array):
    '''
    Send a bytearray to the specified mount, so that Smoothieware can
    save the bytes to the pipette's memory
    '''
    print()
    if 'Y' not in input('Ready to save the ID? (Y or N):  ').upper():
        raise Exception('Not writing ID to pipette, and exiting script')
    robot._driver._write_instrument_id(mount, byte_array)
    read_id = robot._driver._read_instrument_id(mount)
    if read_id != byte_array:
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
    new_id_byte_array = possible_sizes.get(pipette_volume)
    assert new_id_byte_array
    return new_id_byte_array


def _user_submitted_id(num):
    '''
    User can enter a serial number as a string of HEX values
    Length of byte array must equal `num`
    '''
    manual_id_msg = 'Enter an {}-byte hex ID:  '.format(num)
    manual_id = input(manual_id_msg).upper().strip()
    if len(manual_id) / 2 != num:
        length_msg = 'long' if len(manual_id) / 2 > num else 'short'
        bad_id_msg = 'Please enter {0}-byte HEX string, \
            {1} is too {2}'.format(num, manual_id, length_msg)
        raise Exception(bad_id_msg)
    return bytearray.fromhex(manual_id)


def _random_byte_list(num):
    from random import randint
    return bytearray([randint(0, 255) for i in range(num)])


def _byte_array_to_string(b):
    return ''.join('%02x' % i for i in b)


if __name__ == "__main__":
    robot = connect_to_robot()
    found_instruments = scan_instruments(robot)
    mount = select_mount(found_instruments)
    new_id = generate_id()
    write_identifier(robot, mount, new_id)
    print()
    print('SUCCESS! Exiting script now\n\n')
