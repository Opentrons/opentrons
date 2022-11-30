"""Plot Capacitance Accuracy Test Results."""
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
        self.PLOT_PATH = "plot_capacitance_accuracy/"
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
        probe_tip_dia = 4
        cutout_size = 20
        total_distance = cutout_size - probe_tip_dia
        df["Time"] = abs(df["Time"] - df["Time"].iloc[0])
        df["X Error"] = df["X Distance"] - total_distance
        df["Y Error"] = df["Y Distance"] - total_distance
        df["X Absolute"] = abs(df["X Error"])
        df["Y Absolute"] = abs(df["Y Error"])
        df.name = file
        return df

    def create_folder(self):
        path = self.PLOT_PATH.replace("/","")
        if not os.path.exists(path):
            os.makedirs(path)

    def create_plot(self):
        print("Plotting Error Data...")
        self.error_plot()
        print("Plotting Bar Data...")
        self.avg_plot()
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

    def error_plot(self):
        df = self.df_data
        x_axis = "X Error"
        y_axis = "Y Error"
        x_first = df[x_axis].min()
        x_last = df[x_axis].max()
        y_first = df[y_axis].min()
        y_last = df[y_axis].max()
        fig1 = px.scatter(df, x=x_axis, y=[y_axis], color="Threshold")
        fig2 = px.line(x=[-100,100], y=[0,0], color_discrete_sequence=["black"], line_dash_sequence=["dash"])
        fig3 = px.line(x=[0,0], y=[-100,100], color_discrete_sequence=["black"], line_dash_sequence=["dash"])
        fig1.update_traces(
            marker={
                "size":10,
                "line":{"width":2, "color":"black"}
            }
        )
        subfig = make_subplots()
        subfig.add_traces(fig1.data + fig2.data + fig3.data)
        subfig.update_coloraxes(
            colorbar_title_text = "Sensor Threshold (pF)",
            cmax = 1,
            cmin = 0,
        )
        self.plot_param["figure"] = subfig
        self.plot_param["filename"] = "plot_error"
        self.plot_param["title"] = "Error Data"
        self.plot_param["x_title"] = "X Error (mm)"
        self.plot_param["y_title"] = "Y Error (mm)"
        self.plot_param["x_range"] = [-0.3, 0.3]
        self.plot_param["y_range"] = [-0.3, 0.3]
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

    def avg_plot(self):
        df = self.df_data
        df_avg = pd.DataFrame()
        df_avg["X Average"] = df.groupby(["Threshold"])["X Absolute"].mean()
        df_avg["Y Average"] = df.groupby(["Threshold"])["Y Absolute"].mean()
        df_avg.reset_index(inplace=True)
        x_axis = "Threshold"
        y_axis = ["X Average", "Y Average"]
        fig = px.bar(df_avg, x=x_axis, y=y_axis, barmode='group')
        fig.update_layout(
            xaxis_tickmode = "array",
            xaxis_tickvals = df[x_axis].tolist(),
        )
        for data in fig.data:
            data["width"] = 0.015
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_avg"
        self.plot_param["title"] = "Average Absolute Error"
        self.plot_param["x_title"] = "Sensor Threshold (pF)"
        self.plot_param["y_title"] = "Average Absolute Error (mm)"
        self.plot_param["x_range"] = None
        self.plot_param["y_range"] = [0, 1]
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

if __name__ == '__main__':
    print("\nPlot Capacitance Accuracy Test Results\n")
    plot = Plot(sys.argv[1])
    plot.create_plot()
