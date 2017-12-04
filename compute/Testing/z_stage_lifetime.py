#Imported Libraries
import os, sys
import time
import datetime
import optparse
import traceback

import serial
import serial_communication as SC
import driver_3_0
import csv

def set_absolute(driver):
    driver._send_command('G90')
    
def set_relative(driver):
    driver._send_command('G91')

def Z_Pattern(velocity,z_max,a_max,b = b_max, c = c_max):
    robot.move(z = 0, a = 0, speed = velocity)
    robot.move(b = 0, c = 0, speed = velocity)
    robot.move( z = z_max, a = a_max, speed = pip_speed)
    robot.move(b = b_max, c = c_max , speed = pip_speed)

if __name__ == '__main__':
    #options to pick from
    parser = optparse.OptionParser(usage='usage: %prog [options] ')
    parser.add_option("-s", "--speed", dest = "speed", default = 150, help = "Speed Value")
    parser.add_option("-c", "--cycles", dest = "cycles", default = 2, help = "Number of Cycles to run")
    parser.add_option("-z", "--z_max", dest = "z_max", default = 350, help = "z max distance")
    parser.add_option("-a", "--a_max", dest = "a_max", default = 350, help = "a max distance")
    parser.add_option("-z", "--b_max", dest = "b_max", default = 14, help = "b max distance")
    parser.add_option("-a", "--c_max", dest = "c_max", default = 14, help = "c max distance")
    (options, args) = parser.parse_args(args = None, values = None)
    #print(options.scale_port)
    #speed conversion from mm/s to mm/min(smoothie settings)
    speed = options.speed*60
    #Print Speed in mm/s
    print("Speed = {0}{1}".format(options.speed,'mm/s'))
    #Create object
    robot = driver_3_0.SmoothieDriver_3_0_0()
    #Create variable for time
    this_time = time.strftime("%H:%M:%S", time.localtime())
    # #File name + directory to record
    file_name = "results/z_lifetime_test_%s.csv" %(datetime.datetime.now().strftime("%m-%d-%y_%H-%M"))
    print(file_name)
    #Open CSV file with corresponding headers
    with open(file_name, 'w', newline='') as f:
        test_data = {'Cycles':None,'time':None, 'Errors':None}
        log_file = csv.DictWriter(f, test_data)
        log_file.writeheader()
        try:
            robot.connect()
            robot.home('z')
            robot.home('a')
            robot.home('b')
            robot.home('c')
            robot._send_command('M999')
            set_absolute(robot)
            #Series of moves executed
            for cycle in (0,options.cycles+1):    
                print('Cycle = ', cycle)
                Z_Pattern(options.speed,options.z_max, options.a_max)
                test_data['cycles'] = cycle
                test_data['time'] = this_time
                log_file.writerow(test_data)
                print(test_data)
                f.flush
                
        except KeyboardInterrupt:
            print("Test Cancelled")
            f.flush
        except Exception as e:
            test_data['Errors'] = e
            f.flush
        finally:
            print("Test done")
            f.flush
            