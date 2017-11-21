#Imported Libraries
import os, sys
import time
import datetime
import optparse

import serial
import serial_communication as SC
import driver_3_0
import csv
from statistics import mode

def setup_pipette():
    robot._reset_from_error()
    robot.home('ab')
    #robot.move( b = initial_position, speed = pipette_speed)
    robot.move( b = PIP_BOTTOM, speed = pipette_speed)

if __name__ == '__main__':
    #options to pick from
    parser = optparse.OptionParser(usage='usage: %prog [options] ')
    parser.add_option("-s", "--speed", dest = "speed", default = 10, help = "Speed Value")
    parser.add_option("-c", "--cycles", dest = "cycles", default = 100, help = "Number of Cycles to run")
    parser.add_option("-x", "--x_max", dest = "x_max", default = 100, help = "X max distance")
    parser.add_option("-y", "--y_max", dest = "y_max", default = 100, help = "Y max distance")
    parser.add_option("-p", "--port", dest = "robot", default = 'COM7', help = "Robot Com Port")
    parser.add_option("-S", "--scale_port", dest = "scale_port", default = 'COM6', type = str, help = "Scale COM Port")
    (options, args) = parser.parse_args(args = None, values = None)
    #print(options.scale_port)
    print(options.speed)
    robot = driver_3_0.SmoothieDriver_3_0_0()
    robot.connect()
    robot._reset_from_error()
    #robot.home('ab')
    
    try:
        robot._reset_from_error()
        robot.home('b')
        value = 0
        for cycle in range(20):
            robot.move(b = value)
            input("Press Enter")
            value += 0.01
        
            
    except KeyboardInterrupt:
        print("Test Cancelled")
        #disable_motors()
    finally:
        print("Test done")
        #disable_motors()
            