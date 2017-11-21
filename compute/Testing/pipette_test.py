#!/usr/bin/env python

"""
The goal of this test is to determine if motor backlash compensation
is working for our dynamic fluid measurements. If backlash improves
with the new algorithm, we can determine a more accurate solution measurement.

Created by: Carlos Fernandez, Jared
Branch: systems_testing
date: 11/7/2017

"""


import os, sys
import time
import datetime
import optparse

import serial
import serial_communication as SC
import driver_3_0
import csv
from statistics import mode

sys.path.insert(0, os.path.abspath('Equipment'))
import GB_Scale_Framework as SC

initial_position = 2
pipette_speed = 5
dispense_speed = 50
descend_position = 50#80
A_axis_speed = 30
raise_position = 60
PIP_VOLUME = 300
PIP_TOP = 17
PIP_BOTTOM = 4
BLOWOUT = 3 #3.0 for P300
GB_Scale = SC.Scale('COM6')
robot = driver_3_0.SmoothieDriver_3_0_0()
MASS_OF_MICRO_LIT_OF_WATER = .001
DESP_DIST = 10
    
def set_relative(driver):
    driver._send_command('G91')

def set_absolute(driver):
    driver._send_command('G90')
    
def aspirate_action(aspirate_dist, backlash, relative=False):        
    if relative == True:
        #robot.home('b')
        set_absolute(robot)
        robot.move(b=PIP_BOTTOM)
        set_relative(robot)
        robot.move(b=backlash)
        set_absolute(robot)

        robot.move( a = descend_position, speed = A_axis_speed) #enter liquid
        set_relative(robot)
        robot.move( b = aspirate_dist, speed = 3)
        time.sleep(0.5)
        print("speed changed")

        set_absolute(robot)

        robot.move( a = raise_position, speed = A_axis_speed) #exit liquid
        
    else:
        robot.move( b = PIP_BOTTOM)
        robot.move( b = backlash)
        robot.move( a = descend_position, speed = A_axis_speed) #enter liquid
        robot.move( b = aspirate_dist, speed = 3)
        robot.move( a = raise_position, speed = A_axis_speed) #exit liquid
        
    
def dispense_action(backlash, disp_dist, relative=False):
    if relative == True:
        relative_movement = -1 * (disp_dist)
        set_relative(robot)
        robot.move(b = relative_movement, speed = dispense_speed)
        set_absolute(robot)
    
    else:
        robot.move( a = descend_position, speed = A_axis_speed) #enter liquid
        robot.move( b = PIP_BOTTOM, speed = dispense_speed)
        robot.move( a = raise_position, speed = A_axis_speed) #exit liquid  
        robot.move( b = BLOWOUT, speed = dispense_speed)
        robot.move(a = descend_position, speed = A_axis_speed)
        robot.move(a = raise_position, speed = A_axis_speed)
       
        
def connect():
    robot.connect()

def setup_pipette():
    robot._reset_from_error()
    robot.home('ab')
    #robot.move( b = initial_position, speed = pipette_speed)
    robot.move( b = PIP_BOTTOM, speed = pipette_speed)

def record_data(i_mass, f_mass, log_file, test_data):
    this_time = time.strftime("%H:%M:%S", time.localtime())
    delta = i_mass - f_mass
    volume = delta*1000 #uL
    expected_difference = (MASS_OF_MICRO_LIT_OF_WATER) * volume
    #delta_1 = expected_difference - delta
    
    test_data['Weight(g)'] = i_mass
    test_data['final Weight(g)'] = f_mass
    test_data['delta_weight'] = delta
    test_data['Volume(uL)'] = volume
    test_data['time'] = this_time
    log_file.writerow(test_data)
    print(test_data)
    
def record_data_2(i_mass, m_mass, f_mass, log_file, test_data):
    this_time = time.strftime("%H:%M:%S", time.localtime())
    i_volume = (i_mass-m_mass)*1000 #uL
    f_volume = (i_mass - f_mass)*1000 #uL
    
    test_data['initial Weight(g)'] = i_mass
    test_data['m_Weight(g)'] = m_mass
    test_data['final Weight(g)'] = f_mass
    test_data['initial Volume(uL)'] = i_volume
    test_data['final Volume(uL)'] = f_volume
    test_data['time'] = this_time
    log_file.writerow(test_data)
    print(test_data)
    
def prewet():
    setup_pipette()
    descend_position = 50
    for prewet in range(3):
        set_absolute(robot)
        #Move Pip Motor Bottom Position
        robot.move(b = PIP_BOTTOM)
        #Descend Z Position
        robot.move(a = descend_position, speed = A_axis_speed)
        #Aspirate Volume
        robot.move(b = 13)
        #Raise Z Position
        robot.move(a = raise_position, speed = A_axis_speed)
        #Descend Z Position
        robot.move(a = descend_position, speed = A_axis_speed)
        #Despense
        robot.move(b = PIP_BOTTOM)
        robot.move(b = BLOWOUT)
        
def routine_1():
    print('In routine 1')
    #set to abs mode
    set_absolute(robot)
    #pip motor(bottom position)
    robot.move(b=PIP_BOTTOM)
    #set relative
    set_relative(robot)
    #backlash compensation
    robot.move(b= 0.5)
    #set to abs mode
    set_absolute(robot)
    #descend position on Z axis
    robot.move( a = descend_position, speed = A_axis_speed) #enter liquid
    #set relatve(may have to change this line)
    set_relative(robot)
    #aspirate
    robot.move( b = 5.4)
    time.sleep(0.5)
    #set abs mode
    set_absolute(robot)
    #raise position on Z axis
    robot.move( a = raise_position, speed = A_axis_speed) #exit liquid

def routine_2():
    #5.65 - 4.37 = 1.29
    print('In routine 2')
    disp = -4.32
    backlash = 0.22
    #descend position on Z axis
    robot.move( a = descend_position, speed = A_axis_speed)
    #set to abs mode(might have to change this line)
    set_relative(robot)
    #pip motor(second bottom pos)
    robot.move(b=disp - backlash)
    #set to abs mode
    set_absolute(robot)
    #raise position on Z axis
    robot.move( a = raise_position, speed = A_axis_speed) #exit liquid
    #should have 20uL
    time.sleep(0.5)
    
def routine_3():
    #relative mode
    robot.move( a = descend_position, speed = A_axis_speed)
    #set to abs mode
    set_absolute(robot)
    #pip motor(bottom position)
    robot.move(b=PIP_BOTTOM - 1)
    #set to abs mode
    set_absolute(robot)
    #raise position on Z axis
    robot.move( a = raise_position, speed = A_axis_speed) #exit liquid
    #should have 20uL
    #set relative mode
    set_relative(robot)
    time.sleep(0.5)

#Aspirate by increments
def Gravimetric(cycles, backlash=0, blowout_backlash=0, aspirate_dist=10):
    aspirate_dist = 0.1
    setup_pipette()
    file_name = "results/Pipette_Data_%s.csv" % (datetime.datetime.now().strftime("%m-%d-%y_%H-%M"))
    with open(file_name, 'w', newline='') as f:
        test_data = {'Weight(g)':None,'final Weight(g)':None, 'delta_weight':None, 'Volume(uL)':None, 'time':None}
        log_file = csv.DictWriter(f, test_data)
        log_file.writeheader()
        #aspirate_increment = aspirate_dist / cycles #0.1
        #current_aspirate_dist = aspirate_increment #+ 0.63
        current_aspirate_dist = aspirate_dist
        while True:
            print('current distance = ', current_aspirate_dist)
            time.sleep(0.25)
            initial = GB_Scale.read_mass()
            aspirate_action(current_aspirate_dist, backlash=backlash, relative=True)
            time.sleep(1)
            final = GB_Scale.read_mass()
            dispense_action(disp_dist=current_aspirate_dist + 1, backlash=backlash, relative=False)
            record_data(initial, final, log_file, test_data)    
            #current_aspirate_dist += aspirate_increment         
            current_aspirate_dist += aspirate_dist
            if aspirate_dist == True:
                break
            else:
                pass
                
#Aspirate with constant Volumes
def const_vol(cycles, backlash=0, blowout_backlash=0, aspirate_dist=10):
    setup_pipette()
    file_name = "results/Pipette_Data_%s.csv" % (datetime.datetime.now().strftime("%m-%d-%y_%H-%M"))
    with open(file_name, 'w', newline='') as f:
        test_data = {'Weight(g)':None,'final Weight(g)':None, 'delta_weight':None, 'Volume(uL)':None, 'time':None}
        log_file = csv.DictWriter(f, test_data)
        log_file.writeheader()
        aspirate_increment = aspirate_dist / cycles #0.1
        #current_aspirate_dist = aspirate_increment #+ 0.63
        current_aspirate_dist = aspirate_dist
        for cycle in range(cycles):
            print('current distance = ', current_aspirate_dist)
            time.sleep(0.25)
            initial = GB_Scale.read_mass()
            aspirate_action(current_aspirate_dist, backlash=backlash, relative=True)
            time.sleep(1)
            final = GB_Scale.read_mass()
            dispense_action(disp_dist=current_aspirate_dist + 1, backlash=backlash, relative=False)
            record_data(initial, final, log_file, test_data)    
            #current_aspirate_dist += aspirate_increment
            
#Two Stage dispensing
def run_2(cycles):
    print('Home ab')
    setup_pipette()
    print('running prewet')
    #prewet()
    file_name = "results/Pipette_Data_%s.csv" % (datetime.datetime.now().strftime("%m-%d-%y_%H-%M"))
    with open(file_name, 'w', newline='') as f:
        test_data = {'intital Weight(g)':None,'final Weight(g)':None,'m_Weight(g)': None , 'intial Volume(uL)':None, 'final Volume(uL)':None, 'time':None}
        log_file = csv.DictWriter(f, test_data)
        log_file.writeheader()
        for cycle in range(cycles):
            #aspirate 100 uL
            initial = GB_Scale.read_mass()
            print('inital = ', initial)
            routine_1()
            middle = GB_Scale.read_mass()
            print('middle = ', middle)
            #Take Init, 80uL
            #dispense 80 uL
            routine_2()
            final = GB_Scale.read_mass()
            #Final should be 20uL
            routine_3()
            print('final = ', final)
            record_data_2(initial,middle, final, log_file, test_data)    
            
            
            
# if __name__ == '__main__':
    
    # #options to pick from
    # parser = optparse.OptionParser(usage='usage: %prog [options] ')
    # parser.add_option("-s", "--speed", dest = "speed", default = 30, help = "Speed Value")
    # parser.add_option("-c", "--cycles", dest = "cycles", default = 100, help = "Number of Cycles to run")
    # parser.add_option("-p", "--port", dest = "robot", default = 'COM', help = "Robot Com Port")
    # parser.add_option("-S", "--scale_port", dest = "scale_port", default = 'COM6', type = str, help = "Scale COM Port")
    # (options, args) = parser.parse_args(args = None, values = None)
    # #print(options.scale_port)
    # GB_Scale = SC.Scale(port = options.scale_port)
    # #Create a variable to read Scale Readings
    # reading = GB_Scale.read_mass()
    
    # robot = driver_3_0.SmoothieDriver_3_0_0()
    
    # #File name + directory to record
    # print(file_name)
    # #Open file with created Headers

        # try:
            # robot.connect()
            # print("Start test")
        # '''          
            
            # for cycles in range(0,options.cycles+1):
                # # SETUP PIPETTE
                # time.sleep(5)

                # initial_reading = GB_Scale.read_mass()
                # print('initial reading = ', initial_reading)
                # time.sleep(5)
                # #backlash move reverse
                # #move Z axis on single channel pipette
                # time.sleep(5)
                # #aspirate motion
                # robot.move( b = aspirate, speed = pipette_speed)
                # time.sleep(5)
                # #move Z Axis on single channel pippette 
                # after_reading = GB_Scale.read_mass()
                # print('after_reading = ', after_reading)
                # #move plunger
                # #robot.move_axis(3,0,10,relative = False)
                # #time.sleep(10)
                # delta_weight = initial_reading - after_reading
                # #conversion to mircoliters, Volume = mass/density
                # volume = delta_weight*1000 #uL
                # test_data['Weight(g)'] = initial_reading
                # test_data['Weight After(g)'] = after_reading
                # test_data['delta_weight'] = delta_weight
                # test_data['Volume(uL)'] = volume
                # log_file.writerow(test_data)
                # print(test_data)
                # f.flush
        # '''    
        # except KeyboardInterrupt:
            # print("Test Cancelled")
            
            
        # finally:
            # print("Test done")
            
    
    
    
    
    
    
    