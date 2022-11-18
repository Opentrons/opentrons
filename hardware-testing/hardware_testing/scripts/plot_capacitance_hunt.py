"""Plot Capacitance Hunt Test Results."""
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
        self.PLOT_PATH = "plot_capacitance_hunt/"
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
        initial_capacitance = round(df["Capacitance"].min(), 2)
        df["Time"] = abs(df["Time"] - df["Time"].iloc[0])
        df["Relative"] = round((df["Capacitance"] - initial_capacitance) / initial_capacitance, 3)
        df["X Position"] = round(df["Current Position"].str.strip(")(").str.split(";").str[0].astype(float), 3)
        df["Z Position"] = round(df["Current Position"].str.strip(")(").str.split(";").str[-1].astype(float), 3)
        df["Deck Height"] = abs(df["Z Position"] - df["Z Position"].iloc[0])
        df["Edge Distance"] = abs(df["X Position"] - df["X Position"].iloc[0])
        df.name = file
        return df

    def create_folder(self):
        path = self.PLOT_PATH.replace("/","")
        if not os.path.exists(path):
            os.makedirs(path)

    def create_plot(self):
        print("Plotting Sensor Data...")
        self.sensor_plot()
        print("Plotting Distance Beyond Edge...")
        self.edge_plot()
        print("Plotting Absolute Capacitance...")
        self.absolute_all_plot()
        print("Plotting Relative Capacitance...")
        self.relative_all_plot()
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

    def sensor_plot(self):
        df = self.df_data
        x_axis = "Time"
        y_axis = "Capacitance"
        x_first = df[x_axis].min()
        x_last = df[x_axis].max()
        y_first = df[y_axis].min()
        y_last = df[y_axis].max()
        fig = px.line(df, x=x_axis, y=[y_axis], markers=True)
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_sensor"
        self.plot_param["title"] = "Sensor Data"
        self.plot_param["x_title"] = "Time (min)"
        self.plot_param["y_title"] = "Capacitance (pF)"
        self.plot_param["x_range"] = [x_first, x_last]
        self.plot_param["y_range"] = [0, 14]
        self.plot_param["legend"] = "Data"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

    def edge_plot(self):
        df = self.df_data
        x_axis = "Edge Distance"
        y_axis = "Capacitance"
        x_first = df[x_axis].min()
        x_last = df[x_axis].max()
        y_first = df[y_axis].min()
        y_last = df[y_axis].max()
        fig = px.line(df, x=x_axis, y=[y_axis], markers=True)
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_edge"
        self.plot_param["title"] = "Edge Distance Data"
        self.plot_param["x_title"] = "Distance Beyond Edge (mm)"
        self.plot_param["y_title"] = "Capacitance (pF)"
        self.plot_param["x_range"] = [x_first, x_last]
        self.plot_param["y_range"] = None
        self.plot_param["legend"] = "Data"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

    def add_probe_inset(self,
        fig, step_size, probe_width, probe_height,
        x_center, y_zero, y_offset,
        text_x_center, text_y_center, title_height
    ) -> None:
        for i in range(5):
            distance = i * step_size
            percentage = i * (step_size*100/4)
            circle_offset = probe_width*percentage/100
            y_start = y_zero - (i*y_offset)
            y_end = (y_zero + probe_height) - (i*y_offset)
            fig.add_shape(type="rect",
                x0=x_center, y0=y_start,
                x1=(x_center + probe_width), y1=y_end,
                line_color="RoyalBlue",
                fillcolor="LightSkyBlue",
            )
            fig.add_shape(type="circle",
                x0=(x_center - probe_width) + circle_offset, y0=y_start,
                x1=(x_center + circle_offset), y1=y_end,
                line_color="LightSeaGreen",
                fillcolor="PaleTurquoise",
            )
            fig.add_annotation(
                x=text_x_center, y=text_y_center-(i*y_offset),
                text=f"{distance} mm [{percentage} %]",
                showarrow=False,
            )
        fig.add_annotation(
            x=x_center, y=title_height,
            text="[Top View]<br>Probe / Edge",
            showarrow=False,
        )

    def absolute_all_plot(self):
        df = self.df_data
        x_axis = "Deck Height"
        y_axis = "Capacitance"
        x_first = df[x_axis].min()
        x_last = df[x_axis].max()
        y_first = df[y_axis].min()
        y_last = df[y_axis].max()
        fig = px.line(df, x=x_axis, y=[y_axis], color="X Step", markers=True)
        legend = []
        for i in range(df["X Step"].max()):
            increment = 0.5
            distance = i * increment
            percentage = i * (increment*100/4)
            legend.append(f"{distance} mm [{percentage} %]")
        self.set_legend(fig, legend)

        self.add_probe_inset(fig, step_size=1,
            probe_width=0.16, probe_height=0.8,
            x_center=1.6, y_zero=10.1, y_offset=1,
            text_x_center=1.2, text_y_center=10.5,
            title_height=11.4
        )
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_absolute_all"
        self.plot_param["title"] = "Absolute Capacitance vs. Deck Height"
        self.plot_param["x_title"] = "Distance from Deck (mm)"
        self.plot_param["y_title"] = "Capacitance (pF)"
        self.plot_param["x_range"] = [x_first, x_last]
        self.plot_param["y_range"] = [3, 12]
        self.plot_param["legend"] = "Probe Side to Edge"
        self.plot_param["annotation"] = None
        zoom_param = self.plot_param.copy()
        self.write_plot(self.plot_param)
        self.add_probe_inset(fig, step_size=1,
            probe_width=0.08, probe_height=0.08,
            x_center=0.8, y_zero=4.61, y_offset=0.1,
            text_x_center=0.6, text_y_center=4.65,
            title_height=4.74
        )
        zoom_param["filename"] = "plot_absolute_all_zoom"
        zoom_param["title"] = "Absolute Capacitance vs. Deck Height Zoomed"
        zoom_param["x_range"] = [x_first, 1]
        zoom_param["y_range"] = [3.8, 4.8]
        self.write_plot(zoom_param)

    def relative_all_plot(self):
        df = self.df_data
        x_axis = "Deck Height"
        y_axis = "Relative"
        x_first = df[x_axis].min()
        x_last = df[x_axis].max()
        y_first = df[y_axis].min()
        y_last = df[y_axis].max()
        fig = px.line(df, x=x_axis, y=[y_axis], color="X Step", markers=True)
        legend = []
        for i in range(df["X Step"].max()):
            distance = i * 0.5
            percentage = i * (0.5*100/4)
            legend.append(f"{distance} mm [{percentage} %]")
        self.set_legend(fig, legend)
        self.add_probe_inset(fig, step_size=1,
            probe_width=0.16, probe_height=0.2,
            x_center=1.6, y_zero=1.76, y_offset=0.24,
            text_x_center=1.2, text_y_center=1.86,
            title_height=2.1
        )
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_relative_all"
        self.plot_param["title"] = "Relative Capacitance vs. Deck Height"
        self.plot_param["x_title"] = "Distance from Deck (mm)"
        self.plot_param["y_title"] = "∆C/C<sub>O</sub>"
        self.plot_param["x_range"] = [x_first, x_last]
        self.plot_param["y_range"] = [0, 2.25]
        self.plot_param["legend"] = "Probe Side to Edge"
        self.plot_param["annotation"] = None
        zoom_param = self.plot_param.copy()
        self.write_plot(self.plot_param)
        self.add_probe_inset(fig, step_size=1,
            probe_width=0.08, probe_height=0.018,
            x_center=0.8, y_zero=0.152, y_offset=0.022,
            text_x_center=0.6, text_y_center=0.161,
            title_height=0.18
        )
        zoom_param["filename"] = "plot_relative_all_zoom"
        zoom_param["title"] = "Relative Capacitance vs. Deck Height Zoomed"
        zoom_param["x_range"] = [x_first, 1]
        zoom_param["y_range"] = [0, 0.2]
        self.write_plot(zoom_param)

if __name__ == '__main__':
    print("\nPlot Capacitance Hunt Test Results\n")
    plot = Plot(sys.argv[1])
    plot.create_plot()
