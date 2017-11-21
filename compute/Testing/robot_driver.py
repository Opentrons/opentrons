#!/usr/bin/env python
"""
This library is intended to establish a connection
with OT2 units, this library is not completed.
Just a rundown of some basic commands

creator: Carlos Fernandez
Branch: systems_testing
date: 11/7/2017


"""
#Import Libraries
import os
import time
import serial


'''
    SETUP VARIABLES
'''
#setup the COM Port
robot_portname = 'COM7'
robot_baud = 14400
#robot_baud = 115200
robot_port = None


'''
    ROBOT
'''
# DEFAULT_STEPS_PER_MM = 'M92 X80 Y80 Z400 A400 B767.38 C767.38' #Avagdro

DEFAULT_STEPS_PER_MM = 'M92 X160 Y160 Z800 A800 B767.38 C767.38' #Ibn

DEFAULT_MAX_AXIS_SPEEDS = 'M203.1 X300 Y200 Z50 A50 B8 C8'
DEFAULT_ACCELERATION = 'M204 S1000 X4000 Y3000 Z2000 A2000 B3000 C3000'
DEFAULT_CURRENT_CONTROL = 'M907 X1.0 Y1.2 Z0.9 A0.9 B0.6 C0.6'


AXES_SAFE_TO_HOME = 'XZABC' # Y cannot be homed without homing all
AXES = 'XYZABC'

SEC_PER_MIN = 60

GCODES = {'HOME': 'G28.2',
          'MOVE': 'G0',
          'DWELL': 'G4',
          'CURRENT_POSITION': 'M114.2',
          'LIMIT_SWITCH_STATUS': 'M119',
          'PROBE': 'G38.2',
          'ABSOLUTE_COORDS': 'G90',
          'RESET_FROM_ERROR': 'M999',
          'SET_SPEED': 'G0F',
          'SET_POWER': 'M907'}

def __init__(self):
        self._position = {}
        self.log = []
        self._update_position({axis: 0 for axis in AXES})
        self.simulating = True
    
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
    #print(b'-> ' + data)
    robot_port.write(data)
    #print(b'  <- ' + robot_read())  # blocking
    #print(b'  <- ' + robot_read())  # blocking

    # steps/mm command (M92) always returns current values
    #if b'M92' in data:
        #print(b'  <- ' + robot_read())  # blocking


def connect_to_robot():
    global robot_port
    current = 1.5
    acceleration = 5000
    velocity = 203.1
    steps_per_mm = 80
    
    try:
        print('Connecting to robot...')
        robot_port = serial.Serial(
            port=robot_portname, baudrate=robot_baud)
        robot_write('')
        robot_write('M999')
        
        # current
        robot_write('M907 X1.2 Y1.5 Z0.8 A0.8 B0.25 C0.25')
        # acceleration
        robot_write('M204 S5000 X4000 Y3000 Z2000 A2000 B3000 C3000')
        # speeds
        robot_write('G0 F120000 M203.1 X500 Y300 Z70 A70 B30 C30')
        # steps/mm
        robot_write('M92 X80 Y80 Z400 A400 B767.38 C767.38 M52 M54')
        #print("Settings have been set: {},{},{}".format(current,acceleration,velocity, steps_per_mm))
        
    except:
        raise RuntimeError('Please connect to robot USB')

def default_speeds(X = 500, Y = 300, Z = 70, A = 70, B = 30, C = 30):
    robot_write('G0 F120000 M203.1 X500 Y300 Z70 A70 B30 C30')
        
def set_digipot_current(X = 1.5, Y=1.5, Z = 0.7, A = 0.7, B = 0.25, C = 0.25):
    #Set current for xyzabc
    robot_write('M907 X' + X + 'Y' + Y + 'Z' + Z + 'A' + A +'B' + B + 'C' + C)
    print("Current Settings: \n X{},Y{},Z{},A{},B{},C{}".format(X,Y,Z,A,B,C))
    
def steps_per_mm(X = 80, Y= 80, Z = 400, A = 400, B = 767.38, C = 767.38):
    
    robot_write('M92 X80 Y80 Z400 A400 B767.38 C767.38 M52 M54')
    print("Current Settings \n X{},Y{},Z{},A{},B{},C{}".format(X,Y,Z,A,B,C))
    
#Home Function
def home(axis=''):
    #Axis list
    axis_list = ['X','Y','Z','A','B','C''x','y','z','a','b','c']
    #Search in axis list for the following
    if axis in axis_list:
        if axis == 'x':
            axis = 'X'
        elif axis == 'y':
            axis = 'Y'
        elif axis == 'z':
            axis = 'Z'
        elif axis == 'a':
            axis = 'A'
        elif axis == 'b':
            axis = 'B'
        elif axis == 'c':
            axis = 'C'
        else:    
            robot_write('G28.2 ' + axis)
    #Another option to home X and Y
    elif axis == 'gantry':
        robot_write('G28.2' + 'X')
        robot_write('G28.2' + 'Y')
    #flag to prompt the user 
    if not axis:
        print("no axis was used")
        return

def back_forth():
    B_travel = 1
    C_step = 1
    #robot_write('G90 G0X380 G91')
    for i in range(4):
        robot_write('G0C{} G0C{}'.format(-B_travel, B_travel))
        
#Move axis Command
def move_axis(axis, distance, velocity, relative = False):
    """
    velocity conversion from mm/sec to mm/min
    The default unit for smoothie is mm/min
    """
    velocity = velocity/0.0166666667
    move = 'G0'
    #relative option
    if relative == True:
        print("relative position")
        movement_type = 'G91'
    else:
        print("absolute position")
        movement_type = 'G90'
    #list of axes
    axes = [0,1,2,3,4,5]
    #series of conditions to determine which axis to move
    if axis in axes:
        if axis == 0:
            axis = 'X'
        elif axis == 1:
            axis = 'Y'
        elif axis == 2:
            axis = 'Z'
        elif axis == 3:
            axis = 'A'
        #Plunger A(Single Channel Pipette)
        elif axis == 4:
            axis = 'B'
        #Plunger B(8Channel Pipette)
        elif axis == 5:
            axis = 'C'
    #Write Commands given
    print("relative = {0},axis = {1}, distance = {2}, velocity = {3}".format(relative, axis, distance, velocity))
    #may have to test to change speed
    #robot_write('{0} F{1}'.format(relative, velocity)
    robot_write(movement_type)
    robot_write('{0}  {1}{2} F{3}'.format(move, axis, distance,velocity))
    print("{} moved {} at {}mm/s".format(axis,distance,velocity))
    if not axes:
        print("No axis was used")
        return

def move(self, x=None, y=None, z=None, a=None, b=None, c=None):
        if self.simulating:
            self._update_position({
                axis: value
                for axis, value in zip('xyzabc', [x, y, z, a, b, c])
            })

        target_position = {'X': x, 'Y': y, 'Z': z, 'A': a, 'B': b, 'C': c}
        coords = [axis + str(coords)
                  for axis, coords in target_position.items()
                  if coords is not None]
        command = GCODES['MOVE'] + ''.join(coords)
        self._send_command(command)        

def delay(self, seconds):
    seconds = int(seconds)
    milliseconds = (seconds % 1.0) * 1000
    command = GCODES['DWELL'] + 'S' + str(seconds) + 'P' + str(milliseconds)
    self._send_command(command)    
    
#Function to move axis to absolute zero
def orgin(axis = ''):
    #Axis list
    axis_list = ['X','Y','Z','A','B','C''x','y','z','a','b','c']
    #Search in axis list for the following
    if axis in axis_list:
        if axis == 'x':
            axis = 'X'
        elif axis == 'y':
            axis = 'Y'
        elif axis == 'z':
            axis = 'Z'
        elif axis == 'a':
            axis = 'A'
        elif axis == 'b':
            axis = 'B'
        elif axis == 'c':
            axis = 'C'
        else:    
            robot_write('G90 ' + axis + '0')
    #Another option to home X and Y
    elif axis == 'gantry':
        robot_write('G90' + 'X0' + 'Y0')
    #flag to prompt the user 
    if not axis:
        print("no axis was used")
        return
    #This should move Gantry to absolute zero
    robot_write(('G90 {}0').format(axis))

#Function to check status of Endstops
def switch_status():
    robot_write('M119')
#Function to Disable motors
def disable_motors():
    robot_write('M84')
    
#Function to Enable Motors
def enable_motors():
    robot_write('M17')
    
'''
    RUN
'''

if __name__ == '__main__':
    connect_to_robot()
    print("Establish Connection with the robot")
    
