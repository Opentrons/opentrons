import os
import sys
sys.path.append('../../')
import stacker
from stacker import AXIS, DIR
import csv
import time
from typing import Dict
import numpy as np
import argparse
import mark10
import dash
from dash import html
from dash import dcc
from dash.dependencies import Input, Output
import plotly.graph_objs as go
from numpy import random
import pandas as pd
import os
import webbrowser
import threading

def open_browser():
	webbrowser.open_new("http://localhost:{}".format(web_port))

app = dash.Dash()
web_port = 8082

def find_filename(keyword: str):
    for fname in os.listdir(folder):
        #print(fname)
        if keyword in fname:
            #print(fname)
            return fname

def scan_for_files(folder):
    most_recent_file = None
    most_recent_time = 0
    # iterate over the files in the directory using os.scandir
    for entry in os.scandir(folder):
        if entry.is_file():
            # get the modification time of the file using entry.stat().st_mtime_ns
            mod_time = entry.stat().st_mtime_ns
            if mod_time > most_recent_time:
                # update the most recent file and its modification time
                most_recent_file = entry.name
                most_recent_time = mod_time
    return most_recent_file

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description="Motion Parameter Test Script")
    arg_parser.add_argument("-c", "--cycles", default = 100, help = "number of cycles to execute")
    arg_parser.add_argument("-a", "--axis", default = AXIS.X, help = "Choose a Axis")
    return arg_parser

def home(axis: AXIS):
    if axis == AXIS.X:
        TOTAL_TRAVEL = 202
        s.home(AXIS.X, DIR.POSITIVE_HOME)
    elif axis == AXIS.Z:
        TOTAL_TRAVEL = 110.75
        s.home(AXIS.Z, DIR.POSITIVE_NEGATIVE)
    elif axis == AXIS.L:
        TOTAL_TRAVEL == 30
        s.home(AXIS.L, DIR.POSITIVE_NEGATIVE)
    else:
        raise("NO AXIS DEFINED!!")

def fg_thread(fg_var, sg_value):
    global motion_active
    motion_active = True
    start_time = time.time()
    with open(f'SG_test_SG_value_{sg_value}_{time.time()}.csv', 'w', newline ='') as file:
        writer = csv.writer(file)
        fields = ["Time(s)", "Force(N)", "SG Value"]
        writer.writerow(fields)
        while motion_active:
            timer = time.time() - start_time
            fg_reading = fg_var.read_force()
            data = [timer, fg_reading, sg_value]
            writer.writerow(data)
            # timer = time.time() - start_time
            # test_data['Time(s)'] = timer
            # test_data['Force(N)'] = fg_var.get_reading()[0]
            # test_data['SG Value'] = sg_value
            file.flush()
        file.close()

if __name__ == '__main__':
    global motion_active
    working_dir = os.getcwd()
    detail_rows = 0
    # folder= working_dir + '/results/'
    # file_name = scan_for_files(folder)
    # datadata = pd.read_csv(folder + file_name, skiprows = detail_rows)
    arg_parser = build_arg_parser()
    options = arg_parser.parse_args()
    # Port setup
    s = stacker.FlexStacker(None).create('COM6')
    force_gauge = mark10.Mark10(None).create('COM5')
    force_gauge.connect()
    force_gauge.read_force()
    # determine what axis to test
    test_axis = AXIS.X
    # Determine what direction to home first
    if test_axis == AXIS.X:
        direction = DIR.NEGATIVE_HOME
        total_travel = 202
    elif test_axis == AXIS.Z:
        direction = DIR.NEGATIVE_HOME
        total_travel = 113.75
    elif test_axis == AXIS.L:
        direction = DIR.NEGATIVE_HOME
        total_travel = 30
    else:
        raise(f"No AXIS name {test_axis}")
    # Home axis
    # home(test_axis, direction)
    for c in range(1, 2):
        s.enable_SG(test_axis, 0, False)
        s.home(test_axis, direction)
        sg_value = int(input("Enter SG Value: "))
        s.enable_SG(test_axis, sg_value, True)
        #print(f'SG Value: {s.read_SG_value(test_axis)}')
        fg_thread = threading.Thread(target=fg_thread, args=(force_gauge, sg_value, ) )
        fg_thread.start()
        if test_axis == AXIS.X:
            s.move(test_axis, total_travel, DIR.POSITIVE)
        elif test_axis == AXIS.Z:
            s.move(test_axis, total_travel, DIR.POSITIVE)
        elif test_axis == AXIS.L:
            s.move(test_axis, total_travel, DIR.POSITIVE)
        else:
            raise("NO AXIS DEFINIED OR WRONG AXIS DEFINED")
        motion_active = False
        fg_thread.join()
