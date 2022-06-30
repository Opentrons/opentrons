from serial.tools.list_ports import comports

from hardware_testing.drivers import RadwagScale
from hardware_testing.gravimetric import record_samples


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


def main() -> None:
    scale = connect_and_initialize_scale()
    samples = record_samples(scale, duration=10, length=100)
    print(len(samples), samples.average)
    scale.disconnect()


if __name__ == '__main__':
    main()
