import argparse
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import (
    OT3Mount,
    Point,
    Axis,
)
from serial.tools.list_ports import comports  # type: ignore[import]
import particle_instrument 

async def _main(simulating: bool) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=simulating, use_defaults=True
    )
    # home and move to attach position
    await api.home([Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R])
    attach_pos = helpers_ot3.get_slot_calibration_square_position_ot3(5)
    current_pos = await api.gantry_position(OT3Mount.RIGHT)
    await api.move_to(OT3Mount.LEFT, attach_pos._replace(z=current_pos.z),)
    HEPASN = input("Enter HEPA/UV Barcode Number:: ").strip()
    instrument = particle_instrument.GT521S_Driver(port = port)
    SN = instrument.serial_number().strip("SS").replace(' ', '')
    print(SN)


def BuildAsairSensor(simulate: bool, autosearch: bool = True):
    """Try to find and return an Asair sensor, if not found return a simulator."""
    print("Connecting to Environmental sensor")
    if not simulate:
        if not autosearch:
            port = list_ports_and_select(device_name="Asair environmental sensor")
            sensor = particle_instrument.GT521S_Driver(port)
            print(f"Found sensor on port {port}")
            return sensor
        else:
            ports = comports()
            assert ports
            for _port in ports:
                port = _port.device  # type: ignore[attr-defined]
                try:
                    ui.print_info(f"Trying to connect to env sensor on port {port}")
                    sensor = particle_instrument.GT521S_Driver(port)
                    ser_id = sensor.get_serial()
                    if len(ser_id) != 0:
                        ui.print_info(f"Found env sensor {ser_id} on port {port}")
                        return sensor
                except:  # noqa: E722
                    pass
            use_sim = ui.get_user_answer("No env sensor found, use simulator?")
            if not use_sim:
                raise SerialException("No sensor found")
    ui.print_info("no sensor found returning simulator")
    return SimAsairSensor()

def list_ports_and_select(device_name: str = "") -> str:
    """List serial ports and display list for user to select from."""
    ports = comports()
    assert ports, "no serial ports found"
    ports.sort(key=lambda p: p.device)
    print("found ports:")
    for i, p in enumerate(ports):
        print(f"\t{i + 1}) {p.device}")
    if not device_name:
        device_name = "desired"
    idx_str = input(
        f"\nenter number next to {device_name} port (or ENTER to re-scan): "
    )
    if not idx_str:
        return list_ports_and_select(device_name)
    try:
        idx = int(idx_str.strip())
        return ports[idx - 1].device
    except (ValueError, IndexError):
        return list_ports_and_select()

if __name__ == "__main__":
    arg_parser = argparse.ArgumentParser(description="OT-3 HEPA/UV Assembly QC Test")
    arg_parser.add_argument("--operator", type=str, default=None)
    arg_parser.add_argument("--part_number", type=str, default=None)
    args = arg_parser.parse_args()
    arg_parser.add_argument("--simulate", type=bool, default=False)
    if args.operator:
        operator = args.operator
    elif not args.simulate:
        operator = input("OPERATOR name:").strip()
    else:
        operator = "simulation"