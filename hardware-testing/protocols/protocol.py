import atexit

from serial.tools.list_ports import comports

from opentrons.protocol_api import ProtocolContext

from hardware_testing import get_api_context
from hardware_testing.data import dump_data_to_file, create_file_name
from hardware_testing.drivers import RadwagScale, SimRadwagScale
from hardware_testing.gravimetric import record_samples

metadata = {
    'protocolName': 'example-test',
    'apiLevel': '2.12'
}


def find_scale_port() -> str:
    vid, pid = RadwagScale.vid_pid()
    for p in comports():
        if p.vid == vid and p.pid == pid:
            return p.device
    # also try looking for the RS232 USB adapter cable
    for p in comports():
        if p.vid == 1659 and p.pid == 8963:
            return p.device
    raise RuntimeError(
        f'No scale found from available serial ports: {comports()}')


def initialize_scale(scale) -> str:
    scale.continuous_transmission(enable=False)
    scale.automatic_internal_adjustment(enable=False)
    return scale.read_serial_number()


def run(protocol: ProtocolContext) -> None:
    if protocol.is_simulating():
        scale = SimRadwagScale()
    else:
        scale = RadwagScale.create(find_scale_port())
    scale.connect()
    initialize_scale(scale)
    atexit.register(scale.disconnect)

    while 'y' not in input('Quit? (y/n): ').lower():
        try:
            recording_name = input('Name of recording: ')
            recording_duration = float(input('\tDuration (sec): '))
            recording_interval = float(input('\tInterval (sec): '))
        except Exception:
            continue
        input('\tPress ENTER when ready...')
        print('\trecording...')
        recording = record_samples(
            scale, duration=recording_duration, interval=recording_interval, stable=False)
        test_data_name = create_file_name(metadata['protocolName'], recording_name)
        print(f'\tDone, saving {len(recording)} samples as \"{test_data_name}\"\n')
        dump_data_to_file(metadata['protocolName'], test_data_name, recording.as_csv())


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(metadata['protocolName'])
    parser.add_argument("--simulate", action='store_true')
    args = parser.parse_args()
    ctx = get_api_context(api_level=metadata['apiLevel'], is_simulating=args.simulate)
    ctx.home()
    run(ctx)
