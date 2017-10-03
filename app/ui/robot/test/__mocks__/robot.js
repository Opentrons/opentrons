// mock rpc robot
// based on api/opentrons/robot/robot.py

export default function MockRobot () {
  return {
    // TODO(mc, 2017-09-07): remove when server handles serial port
    get_serial_ports_list: jest.fn(() => Promise.resolve(['/dev/tty.USB0']))
  }
}
