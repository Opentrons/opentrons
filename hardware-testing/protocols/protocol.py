from serial.tools.list_ports import comports

from opentrons import protocol_api, execute, simulate

from hardware_testing.drivers import RadwagScale, SimRadwagScale
from hardware_testing.gravimetric import record_samples

metadata = {'apiLevel': '2.12'}


def connect_and_initialize_scale() -> RadwagScale:
    scale = None
    vid, pid = RadwagScale.vid_pid()
    for p in comports():
        if p.vid == vid and p.pid == pid:
            scale = RadwagScale.create(p.device)
            break
    assert scale, f'No scale found from available serial ports: {comports()}'
    scale.connect()
    print(f'Scale serial number: {scale.read_serial_number()}')
    scale.continuous_transmission(enable=False)
    scale.automatic_internal_adjustment(enable=False)
    return scale


def run(protocol: protocol_api.ProtocolContext) -> None:
    if protocol.is_simulating():
        scale = connect_and_initialize_scale()
    else:
        scale = SimRadwagScale()
    samples = record_samples(scale, duration=10, length=100)
    print(len(samples), samples.average)
    scale.disconnect()


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser('Grav Protocol')
    parser.add_argument("--simulate", action='store_true',
                        help='If set, the protocol will be simulated')
    args = parser.parse_args()
    if args.simulate:
        ctx = simulate.get_protocol_api(metadata['apiLevel'])
    else:
        ctx = execute.get_protocol_api(metadata['apiLevel'])
    ctx.home()
    run(ctx)
