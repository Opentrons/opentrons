from opentrons import robot


found_instruments = {}
selected_pipette = None


def connect_to_robot():
    print('Connecting to robot...')
    robot.connect()
    print('Connected')


def byte_array_to_string(b):
    return ''.join('%02x'%i for i in b)


def scan_instruments():
    global found_instruments
    print('Scanning pipettes...')
    found_instruments = robot._driver._scan_instruments()
    for side, identifier in found_instruments.items():
        print(side, ':\n  - ', byte_array_to_string(identifier))


def select_pipette():
    global found_instruments, selected_pipette
    mount_msg = 'Select which side pipette to write to (L or R): '
    mount = input(mount_msg).upper()[0]
    if mount not in 'LR':
        print('Unknown mount: {}'.format(mount))
        select_pipette()
        return
    print('Using mount {}'.format(mount))
    if mount in found_instruments:
        confirm_msg = 'Pipette {} already has data. \
            Proceed and overwrite? (Y or N)'.format(mount)
        confirm = input(confirm_msg).upper()
        if 'N' in confirm:
            return
    selected_pipette = mount


def write_identifier():
    print('Time to write an 8-byte ID!!')
    confirm = input('Manually enter an ID number? (Y or N)').upper()
    if 'Y' in confirm:
        manual_id_msg = 'Please enter an 8-byte HEX id (eg: 01020304AABBCCDD'
        manual_id = input(manual_id_msg).upper().strip()
        if len(manual_id) != (8 * 2):
            length_msg = 'long' if len(manual_id) > 16 else 'short'
            bad_id_msg = 'Please enter 8-byte HEX string, \
                {0} is too {1}'.format(manual_id, length_msg)
            print(bad_id_msg)
            write_identifier()
            return


if __name__ == "__main__":
    connect_to_robot()
    scan_instruments()
    select_pipette()
    write_identifier()
