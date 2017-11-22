#Imported Libraries
import os, sys
import time
import datetime
import optparse

import serial
import serial_communication as SC
import driver_3_0
import csv

def set_absolute(driver):
    driver._send_command('G90')
    
def set_relative(driver):
    driver._send_command('G91')

def bowtie_pattern(velocity,X_max,Y_max):
    robot.move(x = 0, y = 0, speed = velocity)
    robot.move(x = 0, y = Y_max, speed = velocity)
    robot.move(x = X_max, y = 0, speed = velocity)
    robot.move(x = X_max, y = Y_max, speed = velocity)

def hourglass_pattern(velocity,X_max,Y_max):
    robot.move(x = 0, y = 0, speed = velocity)
    robot.move(x = X_max, y = 0, speed = velocity)
    robot.move(x = 0, y = Y_max, speed = velocity)
    robot.move(x = X_max, y = Y_max, speed = velocity)

if __name__ == '__main__':
    #options to pick from
    parser = optparse.OptionParser(usage='usage: %prog [options] ')
    parser.add_option("-s", "--speed", dest = "speed", default = 150, help = "Speed Value")
    parser.add_option("-c", "--cycles", dest = "cycles", default = 2, help = "Number of Cycles to run")
    parser.add_option("-x", "--x_max", dest = "x_max", default = 350, help = "X max distance")
    parser.add_option("-y", "--y_max", dest = "y_max", default = 320, help = "Y max distance")
    (options, args) = parser.parse_args(args = None, values = None)
    #print(options.scale_port)
    #speed conversion from mm/s to mm/min(smoothie settings)
    speed = options.speed*60
    #Print Speed in mm/s
    print("Speed = {}{}".format(options.speed,'mm/s'))
    #Create object
    robot = driver_3_0.SmoothieDriver_3_0_0()
    #Create variable for time
    this_time = time.strftime("%H:%M:%S", time.localtime())
    # #File name + directory to record
    file_name = "results/Gantry_Lifetime_Test_%s.csv" %(datetime.datetime.now().strftime("%m-%d-%y_%H-%M"))
    print(filename)
    #Open CSV file with corresponding headers
    with open(file_name, 'w', newline='') as f:
        test_data = {'Cycles':None,'time':None}
        log_file = csv.DictWriter(f, test_data)
        log_file.writeheader()
        try:
            robot.connect()
            robot.home('x')
            robot.home('y')
            robot._send_command('M999')
            set_relative(robot)
            robot.move(y = -1.5)
            set_absolute(robot)
            #Series of moves executed
            for cycle in (0,options.cycles+1):    
                print('Cycle = ', cycle)
                bowtie_pattern(speed, options.x_max, options.y_max)
                hourglass_pattern(speed, options.x_max, options.y_max)
                test_data['cycles'] = cycles
                test_data['time'] = this_time
                log_file.writerow(test_data)
                print(test_data)
                f.flush
                
        except KeyboardInterrupt:
            print("Test Cancelled")
            f.flush
        finally:
            print("Test done"))
            f.flush
            