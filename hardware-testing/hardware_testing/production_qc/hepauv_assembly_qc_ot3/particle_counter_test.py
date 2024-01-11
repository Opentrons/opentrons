"""This test script runs a series of particle count tests that determines
if the HEPA filter is working as intended. The particle count for 0.3um
cannot exceed more than 10200 particles/m^3. The particle count for
0.5um the particle count cannot exceed more than 3520 particles/m^3."""

import csv
from datetime import datetime
from datetime import date
import optparse
import time, os, sys
import colorama
from itertools import product
# sys.path.insert(0, os.path.abspath('../../../automation_tools'))
# import google_sheets_tool
sys.path.insert(0, os.path.abspath('../Equipment'))
import particle_instrument as p_counter

def pause():
    """This acts as a counter to notify the user"""
    time_suspend = 0
    while time_suspend < warm_up_time:
        time.sleep(1)
        time_suspend +=1
        print('Time: ', time_suspend, ' (s)' , end='')
        print('\r', end='')
    print('')

def determine_criterion(p_1, p_2):
    """
    p_1 is the particle/m^3 measurement unit for particle size of 0.3um
    p_2 is the particle/m^3 measurement unit for particle size of 0.5um
    These p_1 & p_2 have to be in a certain particle count value
    to determine if the HEPA is in clean and working condition.
    If p_1 & p_2 are higher than the threshold the filter is probably
    puctured with holes defining the HEPA system is not clean enough
    to send to a customer.
    """
    p1_threshold = 10200
    p2_threshold = 3520
    if p_1 < p1_threshold and p_2 < p2_threshold:
        test_result = 'PASS'
    else:
        test_result = 'FAIL'
    return test_result

def pass_criterion(overall):
    pass_unit = ["PASS", "PASS", "PASS"]
    if overall == pass_unit:
        print(colorama.Fore.GREEN  + "PASS")
    else:
        print(colorama.Fore.RED + "FAIL")

def file_name():
    barcode = 101023
    name="results/HEPA_{0}_{1}_{2}.csv".format("particle_count",
                        barcode, datetime.now().strftime("%m-%d-%y_%H-%M"))
    return name

def _get_options():
    #options to pick from
    parser = optparse.OptionParser(usage='usage: %prog [options] ')
    parser.add_option("--s", "--samples",
                            dest="samples", type='int',
                            default=3, help="Number of Samples")
    parser.add_option("--p", "--port",
                            dest="port", type = str,
                            default="COM8", help="Serial PORT")
    (options, args)=parser.parse_args(args=None, values=None)
    return (options, args)

if __name__=="__main__":
    colorama.init(autoreset = True)
    options, args = _get_options()
    port = options.port
    warm_up_time = 300 #300 seconds == 5mins
    HEPA_SN = int(input("Enter the Barcode Number: "))
    final_result = []
    f_name_1=file_name()
    instrument = p_counter.GT521S_Driver(port = port)
    SN = instrument.serial_number().strip("SS").replace(' ', '')
    print(SN)
    with open(f_name_1, 'w', newline='') as f:
        writer = csv.writer(f, delimiter=',', quoting=csv.QUOTE_NONE, escapechar=',')
        writer.writerow(["INSTRUMENT SN:", SN])
        writer.writerow(["HEPA SN:" , HEPA_SN])
        writer.writerow('')
        writer.writerow(
                {'{}'.format(datetime.now().strftime("%a-%b-%d-%y %I:%M %p"))})
        test_data={
                    'Time(Date Time)': None,
                    'Size1(um)': None,
                    'Count1(M3)': None,
                    'Size2(um)': None,
                    'Count2(M3)': None,
                    'Location': None,
                    'Sample Time(sec)': None,
                    'PASS/FAIL': None,
                        }
        log_file = csv.DictWriter(f, test_data)
        log_file.writeheader()
        try:
            print("TURN ON FAN")
            input("PRESS ENTER TO CONTINUE")
            pause()
            instrument.initialize_connection()
            instrument.clear_data()
            instrument.set_number_of_samples(options.samples)
            instrument.start_sampling()
            time.sleep(1)
            #Determines if the MetOne Device is running
            operation = True
            while operation:
                stats = instrument.operation_status()
                time.sleep(1) #Refresh Stats every 1 Second
                if stats == "Stop":
                    operation = False
                elif stats == "Running":
                    print(colorama.Fore.YELLOW + stats, end='')
                    print('\r', end='')
                elif stats == "Hold":
                    print(colorama.Fore.YELLOW + stats, end='')
                    print('\r', end='')
            #print out the data
            header, data = instrument.available_records()
            #Record to designated columns using a sorting loop
            record_dict = {}
            for number in range(options.samples):
                for key, value in zip(header.items(), data[number]):
                    for element in key:
                        record_dict[element]= value
                particle_count_1 = int(record_dict['Count1(M3)'])
                particle_count_2 = int(record_dict['Count2(M3)'])
                test_result = \
                        determine_criterion(particle_count_1, particle_count_2)
                print(record_dict)
                test_data['Time(Date Time)']=record_dict['Time']
                test_data['Size1(um)']=record_dict['Size1']
                test_data['Count1(M3)']=record_dict['Count1(M3)']
                test_data['Size2(um)']=record_dict['Size2']
                test_data['Count2(M3)']=record_dict['Count2(M3)']
                test_data['Location']=record_dict['Location']
                test_data['Sample Time(sec)']=record_dict['Sample Time']
                test_data['PASS/FAIL'] = test_result
                log_file.writerow(test_data)
                f.flush()
                final_result.append(test_result)
            writer.writerow(
                        {'{}'.format(datetime.now().strftime("%a-%b-%d-%y %I:%M %p"))})
        except KeyboardInterrupt:
            print("Test Cancelled")
            instrument.end_sampling()
            quit()
        except Exception as e:
            print("ERROR OCCURED")
            instrument.end_sampling()
            raise e
            quit()
        finally:
            pass_criterion(final_result)
