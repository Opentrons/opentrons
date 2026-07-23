import serial
import time
from hardware_testing.drivers import vacuum_pump
import serial.tools.list_ports
import asyncio

def find_port_by_id(vendorId: int, productId: int) -> str:
    """Find a serial port by USB vendor and product ID."""
    ports = serial.tools.list_ports.comports()
    for port in ports:
        # ctx.comment(f"port_vid: {port.vid}, port_pid: {port.pid}")
        if port.vid == vendorId and port.pid == productId:
            # ctx.comment(f"port: {port.device}")
            return port.device
    return ""
Ard_idVendor = 9025
Ard_idProduct = 105
target_liquid_height = 30


async def main():
    m_port = find_port_by_id(Ard_idVendor, Ard_idProduct)  # Example for Arduino Uno
    pump_fixture = await vacuum_pump.WaterPump.create(
        port=m_port, baudrate=115200, loop=None
    )
    await pump_fixture.water_fill(target_liquid_height)

if __name__ == "__main__":
    
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(main())
    except KeyboardInterrupt:
        print("Program interrupted by user. Exiting...")
    finally:
        loop.close()
