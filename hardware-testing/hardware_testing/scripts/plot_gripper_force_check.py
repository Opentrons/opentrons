"""Plot Gripper Lifetime Force Check Results."""
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
        self.PROBE_DIA = 5.5
        self.PLOT_HEIGHT = 800
        self.PLOT_WIDTH = 1000
        self.PLOT_FONT = 16
        self.PLOT_PATH = "plot_gripper_force_check/"
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
        self.create_folder()
        self.df_data = self.import_file(self.data)

    def import_file(self, file):
        df = pd.read_csv(file)
        df.name = file
        return df

    def create_folder(self):
        path = self.PLOT_PATH.replace("/","")
        if not os.path.exists(path):
            os.makedirs(path)

    def create_plot(self):
        print("Plotting Force Check...")
        self.gripper_force_plot()
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

    def gripper_force_plot(self):
        df = self.df_data
        x_axis = "Cycle"
        y_axis = "Output Force"
        y_axis2 = "Input Force"
        x_start = df[x_axis].iloc[0]
        x_end = df[x_axis].iloc[-1]
        y_start = df[y_axis].iloc[0]
        y_end = df[y_axis].iloc[-1]
        y_avg = df[y_axis].mean()
        y_min = df[y_axis].min()
        y_max = df[y_axis].max()
        y_range = y_max - y_min

        y_range = round(y_range, 3)
        y_avg = round(y_avg, 3)
        y_avg_xpos = df[x_axis].mean()
        y_avg_text = f"Avg Force = {y_avg}N ± {y_range/2}N"

        annotation_yavg = self.set_annotation(y_avg_xpos, y_avg, y_avg_text, ax_pos=100, ay_pos=100)

        fig1 = px.line(df, x=x_axis, y=[y_axis], markers=True)
        fig2 = px.line(df, x=x_axis, y=[y_axis2], line_dash_sequence=["dash"], color_discrete_sequence=["red"])
        subfig = make_subplots()
        subfig.add_traces(fig1.data + fig2.data)
        self.plot_param["figure"] = subfig
        self.plot_param["filename"] = "plot_force_check"
        self.plot_param["title"] = "Gripper Force Check (Period = 1 Lifetime)"
        self.plot_param["x_title"] = "Cycle Number"
        self.plot_param["y_title"] = "Output Force (N)"
        self.plot_param["x_range"] = [1, 10]
        self.plot_param["y_range"] = [0, 25]
        self.plot_param["legend"] = "Data"
        self.plot_param["annotation"] = [annotation_yavg]
        self.write_plot(self.plot_param)

if __name__ == '__main__':
    print("\nPlot Gripper Lifetime Force Check Results\n")
    plot = Plot(sys.argv[1])
    plot.create_plot()
