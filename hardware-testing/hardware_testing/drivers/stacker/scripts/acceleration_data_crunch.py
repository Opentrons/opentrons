import numpy
import plotly
import pandas as pd
import os, sys
import time
import argparse

def print_to_string(list):
    count = 1
    data = ''
    for x in list:
        data += x + ','
    return data

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='Flex Stacker Axis Accelerated Lifetime Test')
    arg_parser.add_argument('-c', '--current', type=float, required=False, help='Current', default=1.0)
    arg_parser.add_argument('-s', '--speed', type=int, required=False, help='speed', default=50)
    return arg_parser

if __name__ == '__main__':
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    working_dir = os.getcwd()
    detail_row = 0
    file_name = working_dir + '/data/DVT Motion Parameter Test - 6 Tiprack Load Z Axis-Unit 2.csv'
    # print(f'file_name: {file_name}')
    df = pd.read_csv(file_name, skiprows=detail_row)
    print(df)
    new_df = df[
                [
                'MOTOR_CURRENT',
                'VELOCITY',
                'ACCELERATION',
                'PASS/FAIL',
                ]]
    current = args.current
    speed = args.speed
    accel_data = df['ACCELERATION']
    pass_fail_creterion = df['PASS/FAIL']
    total_num = int(2000/100)
    print(f'total: {total_num}')
    # sample_list = sample_list.tolist()
    target = df.loc[(new_df['MOTOR_CURRENT'] == current) & (new_df['VELOCITY'] == speed)]
    # print(sample_list)

    # print(new_df)
    split_list = [100,200,300,400]
    bigger_list = []
    list = []
    count = 0
    # print(f'current: {current}, velocity: {speed}')
    current_list = [0.1,0.2,0.3,0.4,0.5,0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5]
    speed_list = [50, 100, 150, 200, 250, 300]
    # speed_list = [10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200]
    for index, row in df.iterrows():
        if row['VELOCITY'] == 50:
            print(f'current: {row["MOTOR_CURRENT"]}, velocity: {row["VELOCITY"]}, accel: {row["ACCELERATION"]}')
        # if row['MOTOR_CURRENT'] == current:
        if row['MOTOR_CURRENT'] in current_list:
            if row['VELOCITY'] in speed_list:
            # if row['VELOCITY'] == speed:
                count += 1
                list.append(row["PASS/FAIL"])
                if count == 10:
                    # print(f'current: {row["MOTOR_CURRENT"]}, Velocity: {row["VELOCITY"]}, Accel: {row["ACCELERATION"]}')
                    d = print_to_string(list)
                    print(d)
                    bigger_list.append(list)
                    count = 0
                    list=[]
                    
                # print(index)
                # if (index) == 381:
                #     list.append(row["PASS/FAIL"])
                #     bigger_list.append(list)
                #     print(list)
                #     list=[]
