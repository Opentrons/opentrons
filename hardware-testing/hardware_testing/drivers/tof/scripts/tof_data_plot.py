"""Flex Stacker TOF Sensor Data Plot."""
import os
import sys
import csv
import argparse
import pandas as pd
import plotly.express as px
from plotly.subplots import make_subplots

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='Opentrons TOF Sensor Data Plot')
    arg_parser.add_argument('-f', '--folder_name', type=str, required=False, help='Folder name with raw data', default='tof_log')
    return arg_parser

class TOF_Plot():
    def __init__(self, folder):
        self.df_list = []
        self.data_folder = folder
        self.plot_folder = "tof_plot_process"
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

    def plot_samples(self):
        for df in self.df_list:
            zone = df.name.split("ZONE")[1][0]
            lab = df.name.split("LAB")[1][0]
            cols = sorted(df)
            for col in cols:
                if "Average" in col:
                    filename = f"tof_histogram_zone{zone}_average_lab{lab}"
                    title = f"TOF Histogram - Zone {zone} (Average) [Labware = {lab}]"
                else:
                    file_suffix = col.lower().replace(" ","")
                    filename = f"tof_histogram_zone{zone}_{file_suffix}_lab{lab}"
                    title = f"TOF Histogram - Zone {zone} ({col}) [Labware = {lab}]"
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

        print("All Plots Saved!")

    def plot_subtract(self):
        df_sub = pd.DataFrame()
        cols = sorted(self.df_average)
        zone = 1
        for col in cols:
            if "Labware0" not in col:
                lab = col[-1]
                df_sub[f"Subtraction{lab}"] = self.df_average[col] - self.df_average["Labware0"]
                filename = f"tof_histogram_zone{zone}_subtraction_lab{lab}"
                title = f"TOF Histogram - Zone {zone} (Subtraction) [Labware = {lab}]"
                fig = px.line(df_sub, y=f"Subtraction{lab}")
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

        print(df_sub)
        legend = []
        y_axis = sorted(df_sub)
        fig = px.line(df_sub, y=y_axis)
        for i in range(len(y_axis)):
            legend.append(f"Labware = {i+1}")
        self.set_legend(fig, legend)
        ## Normal Plot
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = f"tof_histogram_zone{zone}_subtraction_all"
        self.plot_param["title"] = f"TOF Histogram - Zone {zone} (Subtraction All)"
        self.plot_param["x_title"] = "Bin Number"
        self.plot_param["y_title"] = "Number of Photons"
        self.plot_param["x_range"] = [0, 127]
        self.plot_param["y_range"] = None
        self.plot_param["legend"] = "Number of Labware"
        self.plot_param["annotation"] = None
        self.make_plot(self.plot_param)
        ## Zoomed Plot
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = f"tof_histogram_zone{zone}_subtraction_all_zoomed"
        self.plot_param["title"] = f"TOF Histogram - Zone {zone} (Subtraction All) [Zoomed]"
        self.plot_param["x_title"] = "Bin Number"
        self.plot_param["y_title"] = "Number of Photons"
        self.plot_param["x_range"] = [0, 50]
        self.plot_param["y_range"] = None
        self.plot_param["legend"] = "Number of Labware"
        self.plot_param["annotation"] = None
        self.make_plot(self.plot_param)

    def plot_average_all(self):
        df_all = pd.DataFrame()
        for df in self.df_list:
            zone = df.name.split("ZONE")[1][0]
            lab = df.name.split("LAB")[1][0]
            df_all[f"Labware{lab}"] = df["Average"]
        df_all.sort_index(axis=1, inplace=True)
        legend = []
        y_axis = sorted(df_all)
        fig = px.line(df_all, y=y_axis)
        for i in range(len(y_axis)):
            legend.append(f"Labware = {i}")
        self.set_legend(fig, legend)
        ## Normal Plot
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
        ## Zoomed Plot
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = f"tof_histogram_zone{zone}_average_all_zoomed"
        self.plot_param["title"] = f"TOF Histogram - Zone {zone} (Average All) [Zoomed]"
        self.plot_param["x_title"] = "Bin Number"
        self.plot_param["y_title"] = "Number of Photons"
        self.plot_param["x_range"] = [0, 50]
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

    def import_files(self, folder):
        self.df_average = pd.DataFrame()
        for filename in os.listdir(folder):
            file = os.path.join(folder, filename)
            if os.path.isfile(file):
                if ".csv" in file:
                    df = pd.read_csv(file, header=None)
                    df.drop(0, axis=1, inplace=True)
                    df.columns = range(df.columns.size)
                    df = df.T
                    for col in df.columns:
                        df.rename(columns={col:f"Sample {col+1}"}, inplace=True)
                    df["Average"] = df.mean(axis=1)
                    df.name = file
                    self.df_list.append(df)
                    lab = df.name.split("LAB")[1][0]
                    self.df_average[f"Labware{lab}"] = df["Average"]
        self.df_average.sort_index(axis=1, inplace=True)
        print(self.df_average)

    def run(self):
        self.create_folder(self.plot_folder)
        self.import_files(args.folder_name)
        self.plot_samples()
        self.plot_average_all()
        self.plot_subtract()

if __name__ == '__main__':
    print("TOF Sensor Data Plot")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    plot = TOF_Plot(args.folder_name)
    plot.run()
