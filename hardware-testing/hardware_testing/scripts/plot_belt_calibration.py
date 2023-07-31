"""Plot Gripper Calibration Test Results."""
import os
import sys
import argparse
import pandas as pd
import plotly.express as px
from plotly.subplots import make_subplots

class Plot:
    def __init__(self, data):
        self.data = data
        self.list_colors = px.colors.qualitative.Plotly
        self.LIMIT = 1000
        self.CUTOUT_SIZE = 20 # mm
        self.CUTOUT_HALF = self.CUTOUT_SIZE / 2
        self.PROBE_DIA = 4 # mm
        self.PROBE_RAD = self.PROBE_DIA / 2
        self.GAUGE_BLOCK = 12 # mm
        self.CALIPER_X = 348.40 # mm
        self.CALIPER_Y = 341.05 # mm
        self.PLOT_HEIGHT = 800
        self.PLOT_WIDTH = 1000
        self.PLOT_FONT = 16
        self.PLOT_PATH = "plot_belt_calibration/"
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
        self.axes = ["X","Y"]
        self.gauges = ["XL","XR","YF","YB"]
        self.gauge_legend = ["X-Left","X-Right","Y-Front","Y-Back"]
        self.create_folder()
        self.df_data = self.import_file(self.data)
        self.df_error = self.error_df(self.df_data)
        self.df_avg_error = self.avg_error_df(self.df_error)
        self.df_distance = self.distance_df(self.df_data, self.df_error)
        self.df_avg_distance = self.avg_distance_df(self.df_distance)

    def import_file(self, file):
        df = pd.read_csv(file)
        df.name = file
        return df

    def create_folder(self):
        path = self.PLOT_PATH.replace("/","")
        if not os.path.exists(path):
            os.makedirs(path)

    def error_df(self, df):
        df_error = pd.DataFrame()
        df_error["Cycle"] = df["Cycle"]
        for gauge in self.gauges:
            df_error[f"{gauge} Error"] = (df[f"{gauge} Gauge"] - df[f"{gauge} Zero"]) - self.PROBE_RAD
        return df_error

    def avg_error_df(self, df):
        avg_list = []
        for i in range(len(self.gauge_legend)):
            avg_list.append([self.gauge_legend[i], abs(df[f"{self.gauges[i]} Error"].mean())])
        df_avg_err = pd.DataFrame(avg_list, columns=["Gauge","Average Error"])
        return df_avg_err

    def distance_df(self, df, error):
        df_distance = pd.DataFrame()
        x_left_gantry = df["XL Position"].str.strip(")(").str.split(";").str[0].astype(float)
        x_right_gantry = df["XR Position"].str.strip(")(").str.split(";").str[0].astype(float)
        y_front_gantry = df["YF Position"].str.strip(")(").str.split(";").str[1].astype(float)
        y_back_gantry = df["YB Position"].str.strip(")(").str.split(";").str[1].astype(float)

        x_left_encoder = df["XL Encoder"].str.strip(")(").str.split(";").str[0].astype(float)
        x_right_encoder = df["XR Encoder"].str.strip(")(").str.split(";").str[0].astype(float)
        y_front_encoder = df["YF Encoder"].str.strip(")(").str.split(";").str[1].astype(float)
        y_back_encoder = df["YB Encoder"].str.strip(")(").str.split(";").str[1].astype(float)

        x_left_machine = df["XL Machine"].str.strip(")(").str.split(";").str[0].astype(float)
        x_right_machine = df["XR Machine"].str.strip(")(").str.split(";").str[0].astype(float)
        y_front_machine = df["YF Machine"].str.strip(")(").str.split(";").str[1].astype(float)
        y_back_machine = df["YB Machine"].str.strip(")(").str.split(";").str[1].astype(float)

        x_error = error["XL Error"] + error["XR Error"]
        y_error = error["YF Error"] + error["YB Error"]

        df_distance["X Gantry"] = (x_right_gantry - x_left_gantry) - self.GAUGE_BLOCK*2
        df_distance["Y Gantry"] = (y_back_gantry - y_front_gantry) - self.GAUGE_BLOCK*2
        df_distance["X Encoder"] = (x_right_encoder - x_left_encoder) - self.GAUGE_BLOCK*2
        df_distance["Y Encoder"] = (y_back_encoder - y_front_encoder) - self.GAUGE_BLOCK*2
        df_distance["X Machine"] = (x_left_machine - x_right_machine) - self.GAUGE_BLOCK*2
        df_distance["Y Machine"] = (y_front_machine - y_back_machine) - self.GAUGE_BLOCK*2
        df_distance["X Measured"] = self.CALIPER_X + x_error
        df_distance["Y Measured"] = self.CALIPER_Y + y_error

        df_distance["X Gantry Error"] = df_distance["X Gantry"] - self.CALIPER_X
        df_distance["Y Gantry Error"] = df_distance["Y Gantry"] - self.CALIPER_Y
        df_distance["X Encoder Error"] = df_distance["X Encoder"] - self.CALIPER_X
        df_distance["Y Encoder Error"] = df_distance["Y Encoder"] - self.CALIPER_Y
        df_distance["X Machine Error"] = df_distance["X Machine"] - self.CALIPER_X
        df_distance["Y Machine Error"] = df_distance["Y Machine"] - self.CALIPER_Y
        df_distance["X Measured Error"] = df_distance["X Measured"] - self.CALIPER_X
        df_distance["Y Measured Error"] = df_distance["Y Measured"] - self.CALIPER_Y
        return df_distance

    def avg_distance_df(self, df):
        avg_list = []
        for axis in self.axes:
            avg_list.append([f"{axis}-Axis", "Gantry", abs(df[f"{axis} Gantry"].mean()), abs(df[f"{axis} Gantry Error"].mean()), df[f"{axis} Gantry Error"].std()])
        for axis in self.axes:
            avg_list.append([f"{axis}-Axis", "Encoder", abs(df[f"{axis} Encoder"].mean()), abs(df[f"{axis} Encoder Error"].mean()), df[f"{axis} Encoder Error"].std()])
        for axis in self.axes:
            avg_list.append([f"{axis}-Axis", "Machine", abs(df[f"{axis} Machine"].mean()), abs(df[f"{axis} Machine Error"].mean()), df[f"{axis} Machine Error"].std()])
        for axis in self.axes:
            avg_list.append([f"{axis}-Axis", "Measured", abs(df[f"{axis} Measured"].mean()), abs(df[f"{axis} Measured Error"].mean()), df[f"{axis} Measured Error"].std()])
        df_avg_distance = pd.DataFrame(avg_list, columns=["Axis","Type","Distance","Average Error","StdDev"])
        print(df_avg_distance)
        return df_avg_distance

    def create_plot(self):
        print("Plotting Gauge Data...")
        self.plot_gauges()
        print("Plotting Measured Error...")
        self.plot_error()
        print("Plotting Average Error...")
        self.plot_avg_error()
        print("Plotting Average Distance...")
        self.plot_avg_distance()
        print("Plots Saved!")

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

    def write_plot(self, param):
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

        fig.write_image(self.PLOT_PATH + param["filename"] + self.PLOT_FORMAT)

        for key, value in self.plot_param.items():
            self.plot_param[key] = None

    def plot_gauges(self):
        df = self.df_data
        x_axis = "Cycle"
        y_axis = []
        for gauge in self.gauges:
            y_axis.append(f"{gauge} Gauge")
        x_start = df[x_axis].iloc[0]
        x_end = df[x_axis].iloc[-1]
        y_start = df[y_axis].iloc[0]
        y_end = df[y_axis].iloc[-1]
        fig = px.line(df, x=x_axis, y=y_axis, markers=True)
        self.set_legend(fig, self.gauge_legend)
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_gauges"
        self.plot_param["title"] = f"Gauge Data"
        self.plot_param["x_title"] = "Cycle Number"
        self.plot_param["y_title"] = "Gauge Displacement (mm)"
        self.plot_param["x_range"] = [x_start, x_end]
        self.plot_param["y_range"] = [0, 10]
        self.plot_param["legend"] = "Gauges"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

    def plot_error(self):
        df = self.df_error
        x_axis = "Cycle"
        y_axis = []
        for gauge in self.gauges:
            y_axis.append(f"{gauge} Error")
        x_start = df[x_axis].iloc[0]
        x_end = df[x_axis].iloc[-1]
        y_start = df[y_axis].iloc[0]
        y_end = df[y_axis].iloc[-1]
        fig = px.line(df, x=x_axis, y=y_axis, markers=True)
        self.set_legend(fig, self.gauge_legend)
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_error"
        self.plot_param["title"] = f"Meaured Error"
        self.plot_param["x_title"] = "Cycle Number"
        self.plot_param["y_title"] = "Measured Error (mm)"
        self.plot_param["x_range"] = [x_start, x_end]
        self.plot_param["y_range"] = [-0.6, 0.6]
        self.plot_param["legend"] = "Gauges"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

    def plot_avg_error(self):
        df = self.df_avg_error
        x_axis = "Gauge"
        y_axis = "Average Error"
        x_start = df[x_axis].iloc[0]
        x_end = df[x_axis].iloc[-1]
        y_start = df[y_axis].iloc[0]
        y_end = df[y_axis].iloc[-1]
        fig = px.bar(df, x=x_axis, y=[y_axis])
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_avg_error"
        self.plot_param["title"] = f"Average Absolute Error"
        self.plot_param["x_title"] = "Gauge Location"
        self.plot_param["y_title"] = "Average Absolute Error (mm)"
        self.plot_param["x_range"] = [x_start, x_end]
        self.plot_param["y_range"] = [0, 0.5]
        self.plot_param["legend"] = "Data"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

    def plot_avg_distance(self):
        df = self.df_avg_distance
        cycles = len(self.df_data)
        x_axis = "Axis"
        y_axis = "Average Error"
        x_start = df[x_axis].iloc[0]
        x_end = df[x_axis].iloc[-1]
        y_start = df[y_axis].iloc[0]
        y_end = df[y_axis].iloc[-1]
        fig = px.bar(df, x=x_axis, y=[y_axis], color="Type", error_y="StdDev", barmode="group")
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_avg_distance"
        self.plot_param["title"] = f"Average Absolute Error ({cycles} cycles)"
        self.plot_param["x_title"] = "Gantry Axis"
        self.plot_param["y_title"] = "Average Absolute Error (mm)"
        self.plot_param["x_range"] = [x_start, x_end]
        self.plot_param["y_range"] = [0, 1.2]
        self.plot_param["legend"] = "Data"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

if __name__ == '__main__':
    print("\nPlot Belt Calibration Test Results\n")
    plot = Plot(sys.argv[1])
    plot.create_plot()
