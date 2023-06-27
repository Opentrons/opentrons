"""Plot Gripper Lifetime Sensor Check Results."""
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
        self.list_dash = ['solid', 'dash']
        self.LIMIT = 1000
        self.PROBE_DIA = 5.5
        self.PLOT_HEIGHT = 800
        self.PLOT_WIDTH = 1000
        self.PLOT_FONT = 16
        self.PLOT_PATH = "plot_gripper_sensor_check/"
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
        self.df_avg = self.average_df(self.df_data)

    def import_file(self, file):
        df = pd.read_csv(file)
        df.name = file
        return df

    def create_folder(self):
        path = self.PLOT_PATH.replace("/","")
        if not os.path.exists(path):
            os.makedirs(path)

    def create_plot(self):
        print("Plotting Sensor Check...")
        self.gripper_sensor_plot()
        print("Plots Saved!")

    def average_df(self, df):
        df_avg = pd.DataFrame()
        df_avg["Capacitance Air"] = df.groupby(["Gripper Probe"])["Capacitance Air"].max()#mean()
        df_avg["Capacitance Deck"] = df.groupby(["Gripper Probe"])["Capacitance Deck"].max()#mean()
        df_avg.reset_index(inplace=True)
        df_avg = df_avg.round(2)
        print(df_avg)
        return df_avg

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

    def gripper_sensor_plot(self):
        df = self.df_data
        x_axis = "Cycle"
        y_axes = ["Capacitance Air","Capacitance Deck"]
        probes = df["Gripper Probe"].drop_duplicates().tolist()
        subfig = make_subplots()
        for i, probe in enumerate(probes):
            df_probe = df[df["Gripper Probe"] == probe]
            for j, y_axis in enumerate(y_axes):
                fig = px.line(df_probe, x=x_axis, y=[y_axis], markers=True, color_discrete_sequence=self.list_colors[i:], line_dash_sequence=self.list_dash[j:])
                self.set_legend(fig, ["{0} ({1})".format(probe, y_axis.strip("Capacitance "))])
                subfig.add_traces(fig.data)
        self.plot_param["figure"] = subfig
        self.plot_param["filename"] = "plot_sensor_check"
        self.plot_param["title"] = "Gripper Sensor Check (Period = 1 Lifetime)"
        self.plot_param["x_title"] = "Cycle Number"
        self.plot_param["y_title"] = "Capacitance (PF)"
        self.plot_param["x_range"] = [1, 10]
        self.plot_param["y_range"] = [0, 15]
        self.plot_param["legend"] = "Gripper Probe"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

if __name__ == '__main__':
    print("\nPlot Gripper Lifetime Sensor Check Results\n")
    plot = Plot(sys.argv[1])
    plot.create_plot()
