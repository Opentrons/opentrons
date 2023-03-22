"""Plot Pipette Capacitance Results."""
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
        self.PLOT_PATH = "plot_pipette_capacitance/"
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
        self.x_increment = self.get_increment(self.df_data, "x")
        self.z_increment = self.get_increment(self.df_data, "z")
        self.max_relative = self.get_max_value(self.df_data, "Relative")
        self.min_absolute = self.get_min_value(self.df_data, "Capacitance")
        self.max_absolute = self.get_max_value(self.df_data, "Capacitance")
        print(f"X-Axis Increment = {self.x_increment}")
        print(f"Z-Axis Increment = {self.z_increment}")
        print(f"Max Relative Change in Capacitance = {self.max_relative}")
        print(f"Min Absolute Capacitance = {self.min_absolute}")
        print(f"Max Absolute Capacitance = {self.max_absolute}")

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
        print(f"Plotting Sensor Data...")
        self.sensor_plot()
        print(f"Plotting Distance Beyond Edge...")
        self.edge_plot()
        print(f"Plotting Absolute Capacitance...")
        self.absolute_all_plot()
        print(f"Plotting Relative Capacitance...")
        self.relative_all_plot()
        print("All Plots Saved!")

    def get_increment(self, df, axis):
        axis = axis.lower()
        if axis == "x":
            increment = round(abs(df["X Position"].iloc[-1] - df["X Position"].iloc[0]) / (df["X Step"].max() - 1), 3)
        elif axis == "z":
            increment = round(abs(df["Z Position"].iloc[-1] - df["Z Position"].iloc[0]) / (df["Z Step"].max() - 1), 3)
        return increment

    def get_max_value(self, df, column):
        return df[column].max()

    def get_min_value(self, df, column):
        return df[column].min()

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
        self.plot_param["title"] = f"Sensor Data"
        self.plot_param["x_title"] = "Time (min)"
        self.plot_param["y_title"] = "Capacitance (pF)"
        self.plot_param["x_range"] = [x_first, x_last]
        self.plot_param["y_range"] = [4, 14]
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
        self.plot_param["title"] = f"Edge Distance Data"
        self.plot_param["x_title"] = "Distance Beyond Edge (mm)"
        self.plot_param["y_title"] = "Capacitance (pF)"
        self.plot_param["x_range"] = [x_first, x_last]
        self.plot_param["y_range"] = None
        self.plot_param["legend"] = "Data"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

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
            distance = round(i * self.x_increment, 3)
            percentage = i * (self.x_increment*100/4)
            legend.append(f"{distance} mm [{percentage} %]")
        self.set_legend(fig, legend)
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_absolute_all"
        self.plot_param["title"] = f"Absolute Capacitance vs. Deck Height"
        self.plot_param["x_title"] = "Distance from Deck (mm)"
        self.plot_param["y_title"] = "Capacitance (pF)"
        self.plot_param["x_range"] = [x_first, x_last]
        # self.plot_param["y_range"] = [5, 12]
        self.plot_param["y_range"] = [13, 20]
        # self.plot_param["y_range"] = [14, 26]
        self.plot_param["legend"] = "Probe Side to Edge"
        self.plot_param["annotation"] = None
        zoom_param = self.plot_param.copy()
        self.write_plot(self.plot_param)
        zoom_param["filename"] = "plot_absolute_all_zoom"
        zoom_param["title"] = f"Absolute Capacitance vs. Deck Height Zoomed"
        zoom_param["x_range"] = [x_first, 1]
        # zoom_param["y_range"] = [5.6, 6.6]
        zoom_param["y_range"] = [13.6, 14.6]
        # zoom_param["y_range"] = [15.8, 16.8]
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
            distance = round(i * self.x_increment, 3)
            percentage = i * (self.x_increment*100/4)
            legend.append(f"{distance} mm [{percentage} %]")
        self.set_legend(fig, legend)
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_relative_all"
        self.plot_param["title"] = f"Relative Capacitance vs. Deck Height"
        self.plot_param["x_title"] = "Distance from Deck (mm)"
        self.plot_param["y_title"] = "∆C/C<sub>O</sub>"
        self.plot_param["x_range"] = [x_first, x_last]
        self.plot_param["y_range"] = [0, 2.25]
        self.plot_param["legend"] = "Probe Side to Edge"
        self.plot_param["annotation"] = None
        zoom_param = self.plot_param.copy()
        self.write_plot(self.plot_param)
        zoom_param["filename"] = "plot_relative_all_zoom"
        zoom_param["title"] = f"Relative Capacitance vs. Deck Height Zoomed"
        zoom_param["x_range"] = [x_first, 1]
        zoom_param["y_range"] = [0, 0.2]
        self.write_plot(zoom_param)

if __name__ == '__main__':
    print("\nPlot Gripper Probe Capacitance Results\n")
    plot = Plot(sys.argv[1])
    plot.create_plot()
