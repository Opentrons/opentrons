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

def set_absolute(driver):
    driver._send_command('G90')

def bowtie_pattern(velocity,X_max,Y_max):
    robot.move(x = 0, y = 0, speed = velocity)
    robot.move(x = 0, y = Y_max, speed = velocity)
    robot.move(x = X_max, y = 0, speed = velocity)
    robot.move(x = X_max, y = Y_max, speed = velocity)

def hourglass_pattern(velocity,X_max,Y_max):
    robot.move(x = 0, y = 0, speed = velocity)
    robot.move(x = X_max, y = 0, speed = velocity)
    robot.move(x = 0, y, Y_max,speed = velocity)
    robot.move(x = X_max, y = Y_max, speed = velocity)

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
    robot.connect(options.port)
    
    # #File name + directory to record
    file_name = "results/Gantry_Lifetime_Test_%s.csv" %(datetime.datetime.now().strftime("%m-%d-%y_%H-%M"))
    print(filename)
    with open(file_name, 'w', newline='') as f:
        test_data = {'Cycles':None,'time':None}
        log_file = csv.DictWriter(f, test_data)
        log_file.writeheader()
        try:
            robot.set_relative()
            robot.move(y = -10)
            robot.set_absolute()
            robot.home('x')
            robot.home('y')
            #Series of moves executed
            for cycle in (0,options.cycle+1):    
                print('Cycle = ', cycle)
                bowtie_pattern(options.velocity, options.x_max, options.y_max)
                hourglass_pattern(options.velocity, options.x_max, options.y_max)
                test_data['cycles'] = cycle
                test_data['time'] = this_time
                log_file.writerow(test_data)
                print(test_data)
                f.flush
        except KeyboardInterrupt:
            print("Test Cancelled")
            disable_motors()
        finally:
            print("Test done")
            disable_motors()
            