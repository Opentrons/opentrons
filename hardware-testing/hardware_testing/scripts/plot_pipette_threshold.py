"""Plot Pipette Threshold Results."""
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
        self.PLOT_PATH = "plot_pipette_threshold/"
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
        self.df_avg = self.avg_df(self.df_data)
        self.gauge_zero = self.get_gauge_zero(self.df_data)
        self.max_error = 0.05
        print(f"Z Gauge Zero = {self.gauge_zero}")

    def import_file(self, file):
        df = pd.read_csv(file)
        df["Z Error"] = df["Z Gauge"] - df["Z Zero"]
        df.name = file
        return df

    def create_folder(self):
        path = self.PLOT_PATH.replace("/","")
        if not os.path.exists(path):
            os.makedirs(path)

    def get_gauge_zero(self, df):
        gauge_zero = round(df["Z Zero"].iloc[0], 2)
        return gauge_zero

    def avg_df(self, df):
        df_avg = pd.DataFrame()
        df_avg["Z Gauge Average"] = df.groupby(["Threshold"])["Z Gauge"].mean()
        df_avg["Z Gauge Std"] = df.groupby(["Threshold"])["Z Gauge"].std()
        df_avg["Z Error Average"] = df.groupby(["Threshold"])["Z Error"].mean()
        # df_avg["Z Zero Average"] = df.groupby(["Threshold"])["Z Zero"].mean()
        # df_avg["Deck Height Average"] = df.groupby(["Threshold"])["Deck Height"].mean()
        df_avg.reset_index(inplace=True)
        print(df_avg)
        return df_avg

    def create_plot(self):
        print(f"Plotting Gauge Data...")
        self.gauge_plot()
        print(f"Plotting Average Gauge...")
        self.avg_gauge_plot()
        print(f"Plotting Average Error...")
        self.avg_error_plot()
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

    def gauge_plot(self):
        df = self.df_data
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
        self.plot_param["filename"] = "plot_gauge"
        self.plot_param["title"] = f"Z Gauge Data"
        self.plot_param["x_title"] = "Trial Number"
        self.plot_param["y_title"] = "Z-Axis Gauge (mm)"
        self.plot_param["x_range"] = [x_first, x_last]
        self.plot_param["y_range"] = [3, 3.5] # dial with o-ring
        self.plot_param["y_range"] = [1.7, 1.9] # dial without o-ring
        self.plot_param["legend"] = "Threshold"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

    def avg_gauge_plot(self):
        df = self.df_avg
        x_axis = "Threshold"
        y_axis = "Z Gauge Average"
        fig = px.bar(df, x=x_axis, y=[y_axis], barmode='group')
        fig.update_layout(
            xaxis_tickmode = "array",
            xaxis_tickvals = df[x_axis].tolist(),
        )
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_avg_gauge"
        self.plot_param["title"] = f"Z Gauge Average (10 Trials)"
        self.plot_param["x_title"] = "Threshold (pF)"
        self.plot_param["y_title"] = "Z Gauge Average (mm)"
        self.plot_param["x_range"] = None
        self.plot_param["y_range"] = [self.gauge_zero, self.gauge_zero + self.max_error]
        self.write_plot(self.plot_param)

    def avg_error_plot(self):
        df = self.df_avg
        x_axis = "Threshold"
        y_axis = "Z Error Average"
        fig = px.bar(df, x=x_axis, y=[y_axis], barmode='group')
        fig.update_layout(
            xaxis_tickmode = "array",
            xaxis_tickvals = df[x_axis].tolist(),
        )
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_avg_error"
        self.plot_param["title"] = f"Z Gauge Error Average (10 Trials)"
        self.plot_param["x_title"] = "Threshold (pF)"
        self.plot_param["y_title"] = "Z Gauge Error Average (mm)"
        self.plot_param["x_range"] = None
        self.plot_param["y_range"] = [0, self.max_error]
        self.write_plot(self.plot_param)

if __name__ == '__main__':
    print("\nPlot Pipette Probe Threshold Results\n")
    plot = Plot(sys.argv[1])
    plot.create_plot()
