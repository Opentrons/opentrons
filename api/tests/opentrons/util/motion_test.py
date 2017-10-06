import time

import serial


'''
    SETUP VARIABLES
'''

robot_portname = '/dev/tty.usbserial-AL0158RY'
robot_baud = 14400
robot_port = None


'''
    ROBOT
'''


def robot_read():
    data = robot_port.readline()
    if b'error' in data or b'ALARM' in data:
        raise Exception(data)
    return data


def robot_write(data):
    global robot_port
    while int(robot_port.in_waiting):
        robot_port.reset_input_buffer()
        time.sleep(0.02)
    if isinstance(data, str):
        data = data.encode()
    data = data + b' M400\r\n'
    print(b'-> ' + data)
    robot_port.write(data)
    print(b'  <- ' + robot_read())  # blocking
    print(b'  <- ' + robot_read())  # blocking

    # steps/mm command (M92) always returns current values
    if b'M92' in data:
        print(b'  <- ' + robot_read())  # blocking


def connect_to_robot():
    global robot_port
    print('Connecting to robot...')
    robot_port = serial.Serial(
        port=robot_portname, baudrate=robot_baud)
    robot_write('')
    robot_write('M999')
    # current
    robot_write('M907 X1.5 Y1.5 Z0.7 A0.7 B0.2 C0.2')
    # acceleration
    robot_write('M204 S5000 X2500 Y2000 Z2000 A2000 B2000 C2000')
    # speeds
    robot_write('G0F120000 M203.1 X500 Y300 Z70 A70 B40 C40')
    # steps/mm
    robot_write('M92 X160 Y160 Z800 A800 B767.38 C767.38 M52 M54')
    raise RuntimeError('Please connect to robot USB')


def home(axis=''):
    if not axis:
        return
    robot_write('G28.2 ' + axis)


def back_forth():
    x_travel = 360
    z_step = 180
    # robot_write('G90 G0X380B15 G91')
    robot_write('G90 G0X380 G91')
    for i in range(4):
        robot_write('G0X{} G0X{}'.format(-x_travel, x_travel))

    for i in range(4):
        robot_write('G0X{}Z{}A{} G0X{}Z{}A{}'.format(
            -x_travel, -z_step, -z_step, x_travel, z_step, z_step))


'''
    RUN
'''


connect_to_robot()

while True:
    home('ZA')
    home('X')
    # home('Y')
    back_forth()
