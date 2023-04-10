"""Plot Gripper Threshold Results."""
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
        self.PLOT_HEIGHT = 800
        self.PLOT_WIDTH = 1000
        self.PLOT_FONT = 16
        self.PLOT_PATH = "plot_gripper_threshold/"
        self.PLOT_FORMAT = ".png"
        # self.probes = ["Front","Rear"]
        self.probes = ["Rear"]
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
        self.df_avg = self.avg_df(self.df_data)
        self.zero = self.get_zero(self.df_data)

    def import_file(self, file):
        df = pd.read_csv(file)
        df["Z Error"] = abs(df["Z Gauge"] - df["Z Zero"])
        df.name = file
        return df

    def create_folder(self):
        path = self.PLOT_PATH.replace("/","")
        if not os.path.exists(path):
            os.makedirs(path)

    def avg_df(self, df):
        df_avg = pd.DataFrame()
        group = ["Threshold","Probe"]
        df_avg["Z Gauge Std"] = df.groupby(group)["Z Gauge"].std()
        df_avg["Z Gauge Average"] = df.groupby(group)["Z Gauge"].mean()
        df_avg["Z Error Average"] = df.groupby(group)["Z Error"].mean()
        # df_avg["Z Zero Average"] = df.groupby(group)["Z Zero"].mean()
        df_avg["Deck Height Average"] = df.groupby(group)["Deck Height"].mean()
        df_avg.reset_index(inplace=True)
        print(df_avg)
        return df_avg

    def get_zero(self, df):
        zero = round(df["Z Zero"].iloc[0], 2)
        return zero

    def create_plot(self):
        for probe in self.probes:
            print(f"Plotting Gauge Data ({probe})...")
            self.gauge_plot(probe)
            print(f"Plotting Average Gauge ({probe})...")
            self.avg_gauge_plot(probe)
            print(f"Plotting Average Error ({probe})...")
            self.avg_error_plot(probe)
        print("All Plots Saved!")

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

    def gauge_plot(self, probe):
        df = self.df_data
        df = df[df["Probe"] == probe]
        x_axis = "Trial"
        y_axis = "Z Gauge"
        x_first = df[x_axis].min()
        x_last = df[x_axis].max()
        y_first = df[y_axis].min()
        y_last = df[y_axis].max()
        fig = px.line(df, x=x_axis, y=[y_axis], color="Threshold", markers=True)
        legend = []
        for i in range(int(df["Threshold"].max())):
            threshold = i + 1.0
            legend.append(f"{threshold} pF")
        self.set_legend(fig, legend)
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_gauge_" + str(probe).lower()
        self.plot_param["title"] = f"Z Gauge Data ({probe} Probe)"
        self.plot_param["x_title"] = "Trial Number"
        self.plot_param["y_title"] = "Z-Axis Gauge (mm)"
        self.plot_param["x_range"] = [x_first, x_last]
        self.plot_param["y_range"] = [3, 3.5]
        self.plot_param["legend"] = "Threshold"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

    def avg_gauge_plot(self, probe):
        df = self.df_avg
        df = df[df["Probe"] == probe]
        x_axis = "Threshold"
        y_axis = "Z Gauge Average"
        x_ticks = df[x_axis].tolist()
        fig1 = px.bar(df, x=x_axis, y=[y_axis], barmode='group')
        fig2 = px.line(x=[-self.LIMIT, self.LIMIT], y=[[self.zero, self.zero]], line_dash_sequence=["dash"], color_discrete_sequence=["black"])
        self.set_legend(fig2, ["Z Zero"])
        subfig = make_subplots()
        subfig.add_traces(fig1.data + fig2.data)
        subfig.update_layout(
            xaxis_tickmode = "array",
            xaxis_tickvals = x_ticks,
        )
        self.plot_param["figure"] = subfig
        self.plot_param["filename"] = "plot_avg_gauge_" + str(probe).lower()
        self.plot_param["title"] = f"Z Gauge Average ({probe} Probe) [10 Trials]"
        self.plot_param["x_title"] = "Threshold (pF)"
        self.plot_param["y_title"] = "Z Gauge Average (mm)"
        self.plot_param["x_range"] = [x_ticks[0] - 0.5, x_ticks[-1] + 0.5]
        self.plot_param["y_range"] = [self.zero - 0.04, self.zero + 0.06]
        self.write_plot(self.plot_param)

    def avg_error_plot(self, probe):
        df = self.df_avg
        df = df[df["Probe"] == probe]
        x_axis = "Threshold"
        y_axis = "Z Error Average"
        y_error = "Z Gauge Std"
        fig = px.bar(df, x=x_axis, y=[y_axis], error_y=y_error, barmode='group')
        fig.update_layout(
            xaxis_tickmode = "array",
            xaxis_tickvals = df[x_axis].tolist(),
        )
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_avg_error_" + str(probe).lower()
        self.plot_param["title"] = f"Z Gauge Error Average ({probe} Probe) [10 Trials]"
        self.plot_param["x_title"] = "Threshold (pF)"
        self.plot_param["y_title"] = "Z Gauge Error Average (mm)"
        self.plot_param["x_range"] = None
        self.plot_param["y_range"] = [0, 0.06]
        self.write_plot(self.plot_param)

if __name__ == '__main__':
    print("\nPlot Gripper Probe Threshold Results\n")
    plot = Plot(sys.argv[1])
    plot.create_plot()
