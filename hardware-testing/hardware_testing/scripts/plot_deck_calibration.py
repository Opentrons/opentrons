"""Plot Deck Calibration Repeatability Test Results."""
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
        self.PLOT_HEIGHT = 800
        self.PLOT_WIDTH = 1000
        self.PLOT_FONT = 16
        self.PLOT_PATH = "plot_deck_calibration/"
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
        df["Zeroed Z Gauge"] = round(df["Z Gauge"] - df["Z Gauge Zero"], 3)
        df["Normalized"] = round(df["Z Height"] - df["Z Height"].min(), 3)
        df.name = file
        return df

    def create_folder(self):
        path = self.PLOT_PATH.replace("/","")
        if not os.path.exists(path):
            os.makedirs(path)

    def create_plot(self):
        print("Plotting Position Data...")
        self.position_plot()
        print("Plotting Normalized Position Data...")
        self.normalized_plot()
        print("Plotting Gauge Data...")
        self.gauge_plot()
        print("Plotting Zeroed Gauge Data...")
        self.zero_plot()
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

    def position_plot(self):
        df = self.df_data
        x_axis = "Time"
        y_axis = "Z Height"
        x_first = df[x_axis].min()
        x_last = df[x_axis].max()
        y_first = df[y_axis].min()
        y_last = df[y_axis].max()

        z_min = df[y_axis].min()
        z_min_id = df[y_axis].idxmin()
        z_min_xpos = df.loc[z_min_id][x_axis].item()
        z_min_text = f"Z Min = {z_min}mm"

        z_max = df[y_axis].max()
        z_max_id = df[y_axis].idxmax()
        z_max_xpos = df.loc[z_max_id][x_axis].item()
        z_max_text = f"Z Max = {z_max}mm"

        annotation_zmin = self.set_annotation(z_min_xpos, z_min, z_min_text, ax_pos=-100, ay_pos=100)
        annotation_zmax = self.set_annotation(z_max_xpos, z_max, z_max_text, ax_pos=100, ay_pos=-100)
        fig = px.line(df, x=x_axis, y=[y_axis], markers=True)
        self.set_legend(fig, ["Z-Axis Position"])
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_position"
        self.plot_param["title"] = "Z Position Data"
        self.plot_param["x_title"] = "Time (min)"
        self.plot_param["y_title"] = "Z-Axis Position (mm)"
        self.plot_param["x_range"] = [0, x_last]
        self.plot_param["y_range"] = [0.1, 0.3]
        self.plot_param["legend"] = "Data"
        self.plot_param["annotation"] = [annotation_zmin, annotation_zmax]
        self.write_plot(self.plot_param)

    def normalized_plot(self):
        df = self.df_data
        x_axis = "Time"
        y_axis = "Normalized"
        x_first = df[x_axis].min()
        x_last = df[x_axis].max()
        y_first = df[y_axis].min()
        y_last = df[y_axis].max()

        z_min = df[y_axis].min()
        z_min_id = df[y_axis].idxmin()
        z_min_xpos = df.loc[z_min_id][x_axis].item()
        z_min_text = f"Z Min = {z_min}mm"

        z_max = df[y_axis].max()
        z_max_id = df[y_axis].idxmax()
        z_max_xpos = df.loc[z_max_id][x_axis].item()
        z_max_text = f"Z Max = {z_max}mm"

        annotation_zmin = self.set_annotation(z_min_xpos, z_min, z_min_text, ax_pos=-100, ay_pos=-100)
        annotation_zmax = self.set_annotation(z_max_xpos, z_max, z_max_text, ax_pos=100, ay_pos=100)
        fig = px.line(df, x=x_axis, y=[y_axis], markers=True, color_discrete_sequence=self.list_colors[1:])
        self.set_legend(fig, ["Z-Axis Position"])
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_normalized"
        self.plot_param["title"] = "[Normalized] Z Position Data"
        self.plot_param["x_title"] = "Time (min)"
        self.plot_param["y_title"] = "[Normalized] Z-Axis Position (mm)"
        self.plot_param["x_range"] = [0, x_last]
        self.plot_param["y_range"] = [0, 0.06]
        self.plot_param["legend"] = "Data"
        self.plot_param["annotation"] = [annotation_zmin, annotation_zmax]
        self.write_plot(self.plot_param)

    def gauge_plot(self):
        df = self.df_data
        x_axis = "Time"
        y_axis = "Z Gauge"
        x_first = df[x_axis].min()
        x_last = df[x_axis].max()
        y_first = df[y_axis].min()
        y_last = df[y_axis].max()

        z_min = df[y_axis].min()
        z_min_id = df[y_axis].idxmin()
        z_min_xpos = df.loc[z_min_id][x_axis].item()
        z_min_text = f"Z Min = {z_min}mm"

        z_max = df[y_axis].max()
        z_max_id = df[y_axis].idxmax()
        z_max_xpos = df.loc[z_max_id][x_axis].item()
        z_max_text = f"Z Max = {z_max}mm"

        annotation_zmin = self.set_annotation(z_min_xpos, z_min, z_min_text, ax_pos=-100, ay_pos=100)
        annotation_zmax = self.set_annotation(z_max_xpos, z_max, z_max_text, ax_pos=100, ay_pos=-100)
        fig = px.line(df, x=x_axis, y=[y_axis], markers=True)
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_gauge"
        self.plot_param["title"] = "Original Z Gauge Data"
        self.plot_param["x_title"] = "Time (min)"
        self.plot_param["y_title"] = "Z Gauge Displacement (mm)"
        self.plot_param["x_range"] = [0, x_last]
        self.plot_param["y_range"] = [1.64, 1.74]
        self.plot_param["legend"] = "Data"
        self.plot_param["annotation"] = [annotation_zmin, annotation_zmax]
        self.write_plot(self.plot_param)

    def zero_plot(self):
        df = self.df_data
        x_axis = "Time"
        y_axis = "Zeroed Z Gauge"
        x_first = df[x_axis].min()
        x_last = df[x_axis].max()
        y_first = df[y_axis].min()
        y_last = df[y_axis].max()
        y_avg = round(df[y_axis].mean(), 3)

        z_min = df[y_axis].min()
        z_min_id = df[y_axis].idxmin()
        z_min_xpos = df.loc[z_min_id][x_axis].item()
        z_min_text = f"Z Min = {z_min}mm"

        z_max = df[y_axis].max()
        z_max_id = df[y_axis].idxmax()
        z_max_xpos = df.loc[z_max_id][x_axis].item()
        z_max_text = f"Z Max = {z_max}mm"

        z_avg = y_avg
        z_avg_xpos = 0
        z_avg_text = f"Z Avg = {z_avg}mm"

        annotation_zmin = self.set_annotation(z_min_xpos, z_min, z_min_text, ax_pos=-100, ay_pos=100)
        annotation_zmax = self.set_annotation(z_max_xpos, z_max, z_max_text, ax_pos=100, ay_pos=-100)
        annotation_zavg = self.set_annotation(z_avg_xpos, z_avg, z_avg_text, ax_pos=100, ay_pos=-100)
        fig1 = px.line(df, x=x_axis, y=[y_axis], markers=True, color_discrete_sequence=self.list_colors[1:])
        fig2 = px.line(x=[0, x_last], y=[[y_avg, y_avg]], line_dash_sequence=["dash"], color_discrete_sequence=["black"])
        self.set_legend(fig1, ["Z Gauge"])
        self.set_legend(fig2, ["Average"])
        subfig = make_subplots()
        subfig.add_traces(fig1.data + fig2.data)
        self.plot_param["figure"] = subfig
        self.plot_param["filename"] = "plot_zero"
        self.plot_param["title"] = "[Zeroed] Z Gauge Data"
        self.plot_param["x_title"] = "Time (min)"
        self.plot_param["y_title"] = "[Zeroed] Z Gauge Displacement (mm)"
        self.plot_param["x_range"] = [0, x_last]
        self.plot_param["y_range"] = [0, 0.1]
        self.plot_param["legend"] = "Data"
        self.plot_param["annotation"] = [annotation_zmin, annotation_zmax, annotation_zavg]
        self.write_plot(self.plot_param)

if __name__ == '__main__':
    print("\nPlot Deck Calibration Repeatability Test Results\n")
    plot = Plot(sys.argv[1])
    plot.create_plot()
