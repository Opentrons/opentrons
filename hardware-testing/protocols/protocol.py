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
    scale_sn = initialize_scale(scale)
    recording = record_samples(scale, duration=3, length=30)
    scale.disconnect()
    test_data_name = create_file_name(metadata['protocolName'], scale_sn)
    dump_data_to_file(metadata['protocolName'], test_data_name, recording.as_csv())


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(metadata['protocolName'])
    parser.add_argument("--simulate", action='store_true')
    args = parser.parse_args()
    ctx = get_api_context(api_level=metadata['apiLevel'], is_simulating=args.simulate)
    ctx.home()
    run(ctx)
