from opentrons import protocol_api

import serial
import serial.tools.list_ports
import time

metadata = {"protocolName": "IMPP Debug"}
requirements = {"robotType": "Flex", "apiLevel": "2.27"}

class PipetteSerial:
    def __init__(self, baudrate=115200, timeout=1):
        self.baudrate = baudrate
        self.timeout = timeout
        self.ser = None
        self.port = None

    # ---------- 自动查找设备 ----------
    def auto_connect(self):
        ports = list(serial.tools.list_ports.comports())

        if not ports:
            raise RuntimeError("No serial ports found")

        print("Scanning serial ports...")

        for p in ports:
            print(f"Trying {p.device}")

            try:
                ser = serial.Serial(
                    port=p.device,
                    baudrate=self.baudrate,
                    timeout=self.timeout
                )

                time.sleep(1)
                ser.reset_input_buffer()

                ser.write(b"M115\r\n")

                time.sleep(1)
                resp = ser.readline().decode(errors="ignore").strip()

                print(f"  Response: {resp}")

                if "VersionImpact 0.0.1" in resp:
                    self.ser = ser
                    self.port = p.device
                    print(f"Connected to device on {p.device}")
                    return True

                ser.close()

            except Exception as e:
                print(f"  Failed: {e}")

        raise RuntimeError("Target device not found")

    # ---------- 基础通信 ----------
    def send_command(self, cmd):
        if not self.ser or not self.ser.is_open:
            raise RuntimeError("Device not connected")

        full_cmd = cmd.strip() + "\r\n"
        self.ser.write(full_cmd.encode())

        resp = self.ser.readline().decode(errors="ignore").strip()
        return resp

    # ---------- 协议封装 ----------
    def get_version(self):
        return self.send_command("M115")

    def close_all_gratings(self):
        return self.send_command("M18")

    def open_all_gratings(self):
        return self.send_command("M19")

    def set_left_t1000(self):
        return self.send_command("SET_LEFT_T1000")

    def set_left_t200(self):
        return self.send_command("SET_LEFT_T200")

    def set_left_t50(self):
        return self.send_command("SET_LEFT_T50")

    def set_left_t20(self):
        return self.send_command("SET_LEFT_T20")

    def set_right_t1000(self):
        return self.send_command("SET_RIGHT_T1000")

    def set_right_t200(self):
        return self.send_command("SET_RIGHT_T200")

    def set_right_t50(self):
        return self.send_command("SET_RIGHT_T50")

    def set_right_t20(self):
        return self.send_command("SET_RIGHT_T20")

    def close(self):
        if self.ser:
            self.ser.close()
            print("Serial closed")

# if __name__ == "__main__":
#     device = PipetteSerial()

#     try:
#         device.auto_connect()

#         print(device.get_version())
#         print(device.set_left_t200())
#         print(device.set_right_t1000())

#     finally:
#         print(device.close_all_gratings())
#         device.close()

def run(protocol: protocol_api.ProtocolContext):
    # 加载移液器
    simulating = protocol.is_simulating()
    serial_dev = None
    if not simulating:
        serial_dev = PipetteSerial()
        serial_dev.auto_connect()
    
    pipette = protocol.load_instrument('flex_1channel_1000', mount='left')
    # 加载针管和水杯
    large_syringe = protocol.load_labware('opentrons_flex_96_tiprack_1000ul', location='2')
    small_syringe_50ul = protocol.load_labware('opentrons_flex_96_tiprack_50ul', location='3')
    small_syringe_20ul = protocol.load_labware('opentrons_flex_96_tiprack_20ul', location='5')
    water_cup = protocol.load_labware('radwag_pipette_calibration_vial', location='4')

    try:
        # 吸液和吐液操作
        pipette.pick_up_tip(large_syringe)
        if not simulating:
            serial_dev.set_left_t1000()
        pipette.aspirate(20, water_cup["A1"].top())
        pipette.dispense(20, water_cup["A1"].top())
    except:
        

    

    # 根据需要添加更多操作


