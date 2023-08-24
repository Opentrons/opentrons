"""Plot Gripper Jaw Encoder."""
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
        self.PLOT_PATH = "plot_gripper_encoder/"
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
        self.df_data = self.import_files(self.data)

    def import_files(self, data):
        df = pd.read_csv(data)
        return df

    def create_folder(self):
        path = self.PLOT_PATH.replace("/","")
        if not os.path.exists(path):
            os.makedirs(path)

    def create_plot(self):
        print("Plotting Encoder vs Cycle...")
        self.encoder_plot()
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

    def encoder_plot(self):
        df = self.df_data
        df["Input Force"] = df["Input Force"].astype(str) + " N"
        part_number = df["Part Number"].iloc[0]
        input_forces = df["Input Force"].unique()
        x_axis = "Cycle"
        y_axis = "Jaw Displacement"
        x_start = df[x_axis].iloc[0]
        x_end = df[x_axis].iloc[-1]
        y_start = df[y_axis].iloc[0]
        y_end = df[y_axis].iloc[-1]
        fig = px.line(df, x=x_axis, y=[y_axis], color="Input Force", symbol="Input Force", markers=True)
        fig.update_traces(marker={"size":8})

        avg_xpos = df[x_axis].iloc[-1]/2
        avg_encoder = round(df["Jaw Displacement"].mean(), 2)
        avg_text = f"Avg = {avg_encoder} mm"
        avg_annotation = self.set_annotation(avg_xpos, avg_encoder, avg_text, ax_pos=50, ay_pos=-50)

        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_encoder"
        self.plot_param["title"] = f"Gripper Jaw Displacement ({part_number})"
        self.plot_param["x_title"] = "Cycle"
        self.plot_param["y_title"] = "Jaw Displacement (mm)"
        self.plot_param["x_range"] = [x_start, x_end]
        self.plot_param["y_range"] = [0, 20]
        self.plot_param["legend"] = "Input Force"
        self.plot_param["annotation"] = [avg_annotation]
        self.write_plot(self.plot_param)

if __name__ == '__main__':
    print("\nPlot Gripper Jaw Encoder\n")
    plot = Plot(sys.argv[1])
    plot.create_plot()
