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
        self.PROBE_DIA = 4
        self.PROBE_RAD = self.PROBE_DIA / 2
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
        self.gauges = ["XL","XR","YF","YB"]
        self.gauge_legend = ["X-Left","X-Right","Y-Front","Y-Back"]
        self.create_folder()
        self.df_data = self.import_file(self.data)
        self.df_error = self.error_df(self.df_data)
        self.df_avg_error = self.avg_error_df(self.df_error)

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
        print(df_error)
        return df_error

    def avg_error_df(self, df):
        avg_list = []
        for i in range(len(self.gauge_legend)):
            avg_list.append([self.gauge_legend[i], abs(df[f"{self.gauges[i]} Error"].mean())])
        df_avg_err = pd.DataFrame(avg_list, columns=["Gauge","Average Error"])
        print(df_avg_err)
        return df_avg_err

    def create_plot(self):
        print("Plotting Gauge Data...")
        self.plot_gauges()
        print("Plotting Measured Error...")
        self.plot_error()
        print("Plotting Average Error...")
        self.plot_avg_error()
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

if __name__ == '__main__':
    print("\nPlot Belt Calibration Test Results\n")
    plot = Plot(sys.argv[1])
    plot.create_plot()
