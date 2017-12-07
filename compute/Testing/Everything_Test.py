"""
Everything Test script(Description):

Determine ability of system to pick up, aspirate, dispense and drop tips 
throughout all locations of the deck for 1000 hours of use.  Measure wear 
of pipette cones as well as changes in pipette flow accuracy and CV over time.

Author: Carlos Fernandez
"""
#Python 3.5
#Imported Libraries
import os, sys
import time
import datetime
import optparse
import serial
import csv
from opentrons import containers, instruments, robot

# UNCOMMENT BELOW LINE TO RUN ON PHYSICAL ROBOT
# robot.connect()
def everything_action(Pip_type):
    #Creates a list of wells A1-A12
    trough = containers.load('trough-12row',slot)
    wells = []
    for well in range(1,13):
        wells.append('A' + str(well))
    racks = []
    for slot in range(1,13):
        if slot == 8:
            pass
        else:
            racks.append(containers.load('tiprack-200ul', slot))
    print(racks)
    #Pip Instrument, Name is P301(Any Name) and its mounted on the right side of the Z
    if Pip_type == 'single':
        pipette = instruments.Pipette(name='p301', mount='right', tip_racks = racks)
    elif Pip_type == 'multi':
        pipette = instruments.Pipette(name='p301', mount='right',channels = 8, tip_racks = racks)
    #error handling
    else:
        try:
            pass
        except(TypeError, NameError):
            print('wrong str format, single or multi(lowercase)')
    #iterate through rack list 
    
    
    for well in wells:
        try:
            pipette.pick_up_tip()#Pick up tip
        except StopIteration:
            pipette.reset_tip_tracking()
            pipette.pick_up_tip()
        pipette.aspirate(200, plate.wells(well))#aspirate 200
        pipette.dispense(200,plate.wells(well))
        pipette.blow_out()
        pipette.return_tip()

if __name__ == '__main__':
    #options to pick from
    parser = optparse.OptionParser(usage='usage: %prog [options] ')
    #parser.add_option("-s", "--speed", dest = "speed", default = 150, help = "Speed Value")
    parser.add_option("-c", "--cycles", dest = "cycles", default = 1, help = "Number of Cycles to run")
    (options, args) = parser.parse_args(args = None, values = None)
    #Create variable for time
    this_time = time.strftime("%H:%M:%S", time.localtime())
    # #File name + directory to record
    file_name = "results/Everything_Test_%s.csv" %(datetime.datetime.now().strftime("%m-%d-%y_%H-%M"))
    print(file_name)
    #Open CSV file with corresponding headers
    with open(file_name, 'w', newline='') as f:
        test_data = {'Cycles':None,'time':None, 'Errors':None}
        log_file = csv.DictWriter(f, test_data)
        log_file.writeheader()
        try:
            robot.connect()
            for cycles in range(options.cycles)
                everything_action('single')
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
            