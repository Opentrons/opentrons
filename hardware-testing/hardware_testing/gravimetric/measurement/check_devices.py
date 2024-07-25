from hardware_testing.drivers.serial_driver import SerialDriver
from hardware_testing.data import ui
from hardware_testing.drivers.asair_sensor import AsairSensor
from hardware_testing.gravimetric.measurement.scale import Scale
from hardware_testing.drivers import (
    list_ports_and_select,
    RadwagScale,
    SimRadwagScale,
)
from hardware_testing.drivers.wtvb01_bt50 import WVTB01_BT50


def find_devices():
    port_list = SerialDriver.get_com_list()
    print("=" * 5 + "FIND PORT LIST" + "=" * 5)
    for index, p in enumerate(port_list):
        print(f"{index + 1} >>{p.device}")
    # find airsensor 
    check_airsensor(port_list)

def check_airsensor(port_list:list):
    ui.print_header("Find Air Sensor")
    for p in port_list:
        try:
            _port = p.device
            print(f"Try to use post {_port}")
            sensor = AsairSensor.connect(_port)
            device_id = sensor.get_serial()
            print(f"Find Ais Sensor {device_id} on port {_port}")
            return _port, sensor
        except:
            ...
    ui.print_info("Unable to find the air sensor: please connect")

def check_scale(port_list:list):
    for port in port_list:
        try:
            ui.print_info(f"Checking port {port.device} for scale")
            radwag = Scale(scale=RadwagScale.create(port.device))
            radwag.connect()
            radwag.initialize()
            scale_serial = radwag.read_serial_number()
            ui.print_info(f"found scale {scale_serial} on port {port.device}")
            return port.device, scale_serial
        except:  # noqa: E722
            pass
    ui.print_info("Unable to find the scale: please connect")

def check_pose_sensor(port_list):
    for port in port_list:
        try:
            ui.print_info(f"Checking port {port.device} for scale")
            radwag = Scale(scale=RadwagScale.create(port.device))
            radwag.connect()
            radwag.initialize()
            scale_serial = radwag.read_serial_number()
            ui.print_info(f"found scale {scale_serial} on port {port.device}")
            return port.device, scale_serial
        except:  # noqa: E722
            pass
    ui.print_info("Unable to find the scale: please connect")
    

if __name__ == "__main__":
    find_devices()




