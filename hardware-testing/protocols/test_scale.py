import time

from hardware_testing.drivers.radwag.driver import RadwagScale


if __name__ == '__main__':
    scale = RadwagScale.create('COM4')
    scale.connect()
    print(f'Scale serial number: {scale.read_serial_number()}')
    scale.continuous_transmission(enable=False)
    scale.automatic_internal_adjustment(enable=False)
    weights = []
    while len(weights) < 10:
        d = scale.read_mass()
        if d[1]:
            weights.append(d[0])
            time.sleep(0.1)
    print(sum(weights) / len(weights))
    scale.disconnect()
