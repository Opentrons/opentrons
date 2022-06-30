from serial.tools.list_ports import comports

from opentrons import protocol_api, execute, simulate
from opentrons.hardware_control.thread_manager import ThreadManagerException

from hardware_testing.drivers import RadwagScale, SimRadwagScale
from hardware_testing.drivers.radwag.driver import RadwagScaleBase
from hardware_testing.gravimetric import record_samples

metadata = {'apiLevel': '2.12'}


def find_scale_port() -> str:
    vid, pid = RadwagScale.vid_pid()
    for p in comports():
        if p.vid == vid and p.pid == pid:
            return p.device
    raise RuntimeError(
        f'No scale found from available serial ports: {comports()}')


def initialize_scale(scale: RadwagScaleBase) -> None:
    print(f'Scale serial number: {scale.read_serial_number()}')
    scale.continuous_transmission(enable=False)
    scale.automatic_internal_adjustment(enable=False)


def run(protocol: protocol_api.ProtocolContext) -> None:
    if protocol.is_simulating():
        scale = SimRadwagScale()
    else:
        scale = RadwagScale.create(find_scale_port())
    scale.connect()
    initialize_scale(scale)
    print('Recording samples...')
    samples = record_samples(scale, duration=3, length=30)
    print(len(samples), samples.average)
    scale.disconnect()


if __name__ == '__main__':
    import argparse
    import types
    parser = argparse.ArgumentParser('Grav Protocol')
    parser.add_argument("--simulate", action='store_true',
                        help='If set, the protocol will be simulated')
    args = parser.parse_args()
    if args.simulate:
        ctx = simulate.get_protocol_api(metadata['apiLevel'])
    else:
        # NOTE: protocol context cannot be built outside of
        try:
            ctx = execute.get_protocol_api(metadata['apiLevel'])
        except ThreadManagerException:
            print('\nUnable to build non-simulated Protocol Context')
            print('Creating simulated Protocol Context, with .is_simulated() overridden')
            ctx = simulate.get_protocol_api(metadata['apiLevel'])
            ctx.is_simulating = types.MethodType(lambda _: False, ctx)
    ctx.home()
    run(ctx)
