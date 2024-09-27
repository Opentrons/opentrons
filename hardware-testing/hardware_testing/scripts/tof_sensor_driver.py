"""Flex Stacker TOF Sensor Driver."""
import os
import sys
import csv
import time
import serial
import argparse
import pandas as pd
import plotly.express as px
from plotly.subplots import make_subplots
from datetime import datetime

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='Opentrons Temperature Kit Driver')
    arg_parser.add_argument('-t', '--test', action="store_true", required=False, help='Gets sample histogram data from the sensor')
    arg_parser.add_argument('-w', '--labware', action="store_true", required=False, help='Measures the sensor for different labware quantity')
    arg_parser.add_argument('-m', '--labware_max', type=int, required=False, help='Sets the maximum number of labware', default=3)
    arg_parser.add_argument('-z', '--zone', type=int, required=False, help='Sets the zone number for histogram data (0-9)', default=1)
    arg_parser.add_argument('-l', '--log', type=float, required=False, help='Sets the log duration (min)', default=0.1)
    arg_parser.add_argument('-p', '--port_name', type=str, required=False, help='Sets serial connection port, ex: -p COM5')
    return arg_parser

class TOFSensor():
    def __init__(self, port="/dev/ttyACM0", baudrate=115200):
        self.datetime = datetime.now()
        self.PORT = port
        self.BAUDRATE = baudrate
        self.TIMEOUT = 0.1
        self.ACK = "\n"
        self.GCODE = {
            "HIST_ZONE":"TOF$HZ",
        }
        self.sensor = None
        self.log_file = None
        self.log_folder = "tof_log"
        self.plot_folder = "tof_plots"
        self.hist_header = "#HLONG"
        self.LIMIT = 1000
        self.PLOT_HEIGHT = 800
        self.PLOT_WIDTH = 1000
        self.PLOT_FONT = 16
        self.PLOT_FORMAT = ".png"
        self.plot_param = {
            "figure":None,
            "filename":None,
            "title":None,
            "x_title":None,
            "y_title":None,
            "y2_title":None,
            "x_range":None,
            "y_range":None,
            "y2_range":None,
            "legend":None,
            "annotation":None
        }
        self.df_list = []

    def connect(self):
        try:
            self.sensor = serial.Serial(port = self.PORT,
                                        baudrate = self.BAUDRATE,
                                        parity = serial.PARITY_NONE,
                                        stopbits = serial.STOPBITS_ONE,
                                        bytesize = serial.EIGHTBITS,
                                        timeout = self.TIMEOUT)
        except serial.SerialException:
            error = "Unable to access Serial port"
            raise serial.SerialException(error)

    def disconnect(self):
        self.equipment.close()

    def send_packet(self, packet):
        self.sensor.flushInput()
        self.sensor.write(packet.encode("utf-8"))

    def get_packet(self):
        self.sensor.flushOutput()
        packet = self.sensor.readline().decode("utf-8").strip(self.ACK)
        return packet

    def get_histogram_zone(self, zone):
        self.packet = "{},{}{}".format(self.GCODE["HIST_ZONE"], zone, self.ACK)
        self.send_packet(self.packet)
        time.sleep(2.0)
        reading = True
        while reading:
            data = self.get_packet()
            if self.hist_header in data:
                reading = False
            else:
                self.send_packet(self.packet)
                time.sleep(2.0)
        print("")
        print(data)
        return data

    def histogram_to_list(self, histogram):
        hist_list = histogram.split(":")[1].split(",")
        return hist_list

    def log_histogram(self, duration, labware = 0):
        self.create_folder(self.log_folder)
        if labware > 0:
            self.create_file(labware)
        else:
            self.create_file()
        filename = f"{self.log_folder}/{self.log_file}"
        self.start_time = time.time()
        with open(filename, 'w') as f:
            writer = csv.writer(f)
            elapsed_time = (time.time() - self.start_time)/60
            while elapsed_time < duration:
                hist = self.get_histogram_zone(args.zone)
                bins = self.histogram_to_list(hist)
                elapsed_time = (time.time() - self.start_time)/60
                data = [elapsed_time] + bins
                writer.writerow(data)
                f.flush()
                time.sleep(1.0)

    def import_log(self, file):
        df = pd.read_csv(file, header=None)
        df.drop(0, axis=1, inplace=True)
        df.columns = range(df.columns.size)
        df = df.T
        for col in df.columns:
            df.rename(columns={col:f"Sample {col+1}"}, inplace=True)
        df.name = file
        return df

    def plot_log(self, labware = 0):
        zone = args.zone
        filename = f"{self.log_folder}/{self.log_file}"
        self.create_folder(self.plot_folder)
        df = self.import_log(filename)
        cols = sorted(df)
        print(df)
        for col in cols:
            file_suffix = col.lower().replace(" ","")
            if labware > 0:
                filename = f"tof_histogram_zone{zone}_{file_suffix}_lab{labware}"
                title = f"TOF Histogram - Zone {zone} ({col}) [Labware = {labware}]"
            else:
                filename = f"tof_histogram_zone{zone}_{file_suffix}"
                title = f"TOF Histogram - Zone {zone} ({col})"
            fig = px.line(df, y=col)
            self.plot_param["figure"] = fig
            self.plot_param["filename"] = filename
            self.plot_param["title"] = title
            self.plot_param["x_title"] = "Bin Number"
            self.plot_param["y_title"] = "Number of Photons"
            self.plot_param["x_range"] = [0, 127]
            self.plot_param["y_range"] = None
            self.plot_param["legend"] = None
            self.plot_param["annotation"] = None
            self.make_plot(self.plot_param)

        df["Average"] = df.mean(axis=1)
        print(df)
        if labware > 0:
            filename = f"tof_histogram_zone{zone}_average_lab{labware}"
            title = f"TOF Histogram - Zone {zone} (Average) [Labware = {labware}]"
            self.df_list.append(df)
        else:
            filename = f"tof_histogram_zone{zone}_average"
            title = f"TOF Histogram - Zone {zone} (Average)"
        fig = px.line(df, y="Average")
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = filename
        self.plot_param["title"] = title
        self.plot_param["x_title"] = "Bin Number"
        self.plot_param["y_title"] = "Number of Photons"
        self.plot_param["x_range"] = [0, 127]
        self.plot_param["y_range"] = None
        self.plot_param["legend"] = None
        self.plot_param["annotation"] = None
        self.make_plot(self.plot_param)

        if labware == args.labware_max:
            df_all = pd.DataFrame()
            for i, df in enumerate(self.df_list):
                df_all[f"Labware{i+1}"] = df["Average"]
            print(df_all)
            legend = []
            y_axis = sorted(df_all)
            fig = px.line(df_all, y=y_axis)
            for i in range(len(y_axis)):
                legend.append(f"Labware = {i+1}")
            self.set_legend(fig, legend)
            self.plot_param["figure"] = fig
            self.plot_param["filename"] = f"tof_histogram_zone{zone}_average_all"
            self.plot_param["title"] = f"TOF Histogram - Zone {zone} (Average All)"
            self.plot_param["x_title"] = "Bin Number"
            self.plot_param["y_title"] = "Number of Photons"
            self.plot_param["x_range"] = [0, 127]
            self.plot_param["y_range"] = None
            self.plot_param["legend"] = "Number of Labware"
            self.plot_param["annotation"] = None
            self.make_plot(self.plot_param)

    def set_legend(self, figure, legend):
        for idx, name in enumerate(legend):
            figure.data[idx].name = name
            figure.data[idx].hovertemplate = name

    def set_annotation(self, x_pos, y_pos, text, ax_pos=0, ay_pos=0, y_ref="y1"):
        annotation = {
            "x":x_pos,
            "y":y_pos,
            "ax":ax_pos,
            "ay":ay_pos,
            "xref":"x1",
            "yref":y_ref,
            "text":text,
            "showarrow":True,
            "arrowhead":3,
            "arrowsize":2,
            "font":{"size":20,"color":"black"},
            "bordercolor":"black",
            "bgcolor":"white"
        }
        return annotation

    def make_plot(self, param):
        fig = param["figure"]
        fig.update_xaxes(minor_showgrid=True)
        fig.update_yaxes(minor_showgrid=True)
        fig.update_layout(
            font_size=self.PLOT_FONT,
            height=self.PLOT_HEIGHT,
            width=self.PLOT_WIDTH,
            title=param["title"],
            xaxis_title=param["x_title"],
            yaxis_title=param["y_title"],
            xaxis_range=param["x_range"],
            yaxis_range=param["y_range"],
            xaxis_showgrid=True,
            yaxis_showgrid=True,
            xaxis_linecolor="black",
            yaxis_linecolor="black",
            xaxis_ticks="outside",
            yaxis_ticks="outside",
            legend_title=param["legend"],
            annotations=param["annotation"]
        )
        if param["y2_title"] is not None:
            fig.update_layout(yaxis2_title=param["y2_title"], yaxis2_range=param["y2_range"])

        fig.write_image(self.plot_folder + "/" + param["filename"] + self.PLOT_FORMAT)

        for key, value in self.plot_param.items():
            self.plot_param[key] = None

    def create_folder(self, folder):
        if not os.path.exists(folder):
            os.makedirs(folder)

    def create_file(self, labware = 0):
        current_datetime = self.datetime.strftime("%m-%d-%y_%H-%M")
        port = self.PORT
        if "dev" in port:
            port = port.replace('/dev/tty','')
        if labware > 0:
            filename = f"TOF_{port}_ZONE{args.zone}_LAB{labware}_{current_datetime}.csv"
        else:
            filename = f"TOF_{port}_ZONE{args.zone}_{current_datetime}.csv"
        self.log_file = filename
        print(f"File Name: {self.log_file}")

if __name__ == '__main__':
    print("TOF Sensor Driver")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    if args.port_name:
        sensor = TOFSensor(port=args.port_name, baudrate=115200)
    else:
        sensor = TOFSensor(port="/dev/ttyACM0", baudrate=115200)
    sensor.connect()
    if args.test:
        sensor.log_histogram(args.log)
        sensor.plot_log()
    elif args.labware:
        print(f"Testing TOF Sensor from 1 to {args.labware_max} labware.\n")
        for i in range(args.labware_max):
            input(f"\nMeasure for Labware = {i+1} [Press ENTER to continue]")
            sensor.log_histogram(args.log, i+1)
            sensor.plot_log(i+1)
        print("Test Completed!")
    else:
        while True:
            sensor.get_histogram_zone(args.zone)
            time.sleep(1.0)
