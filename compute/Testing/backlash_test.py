"""
This script is used to determine the backash of our pip motor

"""
#Python 3.5
#Imported Libraries
import os, sys
import time
import datetime
import optparse
import serial
import serial_communication as SC
import driver_3_0
import csv
sys.path.insert(0, os.path.abspath('Equipment'))
import Terma_framework as tf

#Set relative mode for smoothie
def set_relative(driver):
    driver._send_command('G91')
#Set absolute mode for smoothie
def set_absolute(driver):
    driver._send_command('G90')
    
    
if __name__ == '__main__':
    #options to pick from
    parser = optparse.OptionParser(usage='usage: %prog [options] ')
    parser.add_option("-s", "--speed", dest = "speed", default = 10, help = "Speed Value")
    parser.add_option("-d", "--dial_port", dest = "dial_port", default = 'COM26', type = str, help = "Indicator COM Port")
    parser.add_option("-i", "--increment", dest = "increment", default = 0.01, type = int, help = "increment to move the pip motor")
    (options, args) = parser.parse_args(args = None, values = None)
    print(options.dial_port)
    #Assign Driver to guage 
    gauge = tf.TermaGauge(port = options.dial_port)
    read = gauge.gauge_read()
    robot = driver_3_0.SmoothieDriver_3_0_0()
    pipette_speed = options.speed
    PIP_BOTTOM = 0
    this_time = time.strftime("%H:%M:%S", time.localtime())
    # #File name + directory to record
    file_name = "results/backlash_test_%s.csv" %(datetime.datetime.now().strftime("%m-%d-%y_%H-%M"))
    print(file_name)
    #Open CSV file with corresponding headers
    with open(file_name, 'w', newline='') as f:
        test_data = {'Actual_distance':None,'Distance':None,'time':None}
        log_file = csv.DictWriter(f, test_data)
        log_file.writeheader()
        try:
            robot.connect()
            robot.home('b')
            set_absolute(robot)
            robot.move(b = PIP_BOTTOM, speed = pipette_speed)
            cycles = top_distance/options.increment
            increment = options.increment
            for cycle in range(cycles):
                robot.move(b = PIP_BOTTOM + increment, Speed = pipette_speed)
                input("Press Enter")
                increment += increment
                test_data['Actual_distance'] = increment
                test_data['Distance'] = read
                test_data['time'] = this_time
                log_file.writerow(test_data)
                print(test_data)
                f.flush
                
        except KeyboardInterrupt:
            print("Test Cancelled")
            #disable_motors()
        finally:
            print("Test done")
            #disable_motors()
            