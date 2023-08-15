"""Plot Gripper Force Results."""
import os
import sys
import argparse
import pandas as pd
import plotly.express as px
from plotly.subplots import make_subplots

class Plot:
    def __init__(self, path):
        self.path = path
        self.list_colors = px.colors.qualitative.Plotly
        self.LIMIT = 1000
        self.PROBE_DIA = 5.5
        self.PLOT_HEIGHT = 800
        self.PLOT_WIDTH = 1000
        self.PLOT_FONT = 16
        self.PLOT_PATH = "plot_gripper_force/"
        self.PLOT_FORMAT = ".png"
        self.compute = ["Average", "Median", "Maximum"]
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
        self.df_data = self.import_files(self.path)
        self.df_sum = self.summarize_df(self.df_data)
        self.df_avg = self.get_average(self.df_sum)
        print("\nNumber of Grippers: {}\n".format(len(self.df_data["Part Number"].unique())))

    def import_files(self, path):
        df = pd.DataFrame()
        for item in os.listdir(path):
            dir = os.path.join(path, item)
            if os.path.isdir(dir):
                for file in os.listdir(dir):
                    if file.lower().endswith('.csv'):
                        csv = os.path.join(dir, file)
                        data = pd.read_csv(csv)
                        df = df.append(data, ignore_index=True)
        df["Input Force"] = df["Input Force"].astype(int)
        df.sort_values(by=["Part Number","Input Force"], ignore_index=True, inplace=True)
        return df

    def create_folder(self):
        path = self.PLOT_PATH.replace("/","")
        if not os.path.exists(path):
            os.makedirs(path)

    def summarize_df(self, df):
        df_sum = pd.DataFrame()
        df_sum["Average Force"] = df.groupby(["Part Number","Input Force"])["Output Force"].mean()
        df_sum["Median Force"] = df.groupby(["Part Number","Input Force"])["Output Force"].median()
        df_sum["Maximum Force"] = df.groupby(["Part Number","Input Force"])["Output Force"].max()
        df_sum["Minimum Force"] = df.groupby(["Part Number","Input Force"])["Output Force"].min()
        df_sum["StdDev Force"] = df.groupby(["Part Number","Input Force"])["Output Force"].std()
        df_sum.reset_index(inplace=True)
        print(df_sum)
        return df_sum

    def get_average(self, df):
        df_avg = pd.DataFrame()
        df_avg["Avg Average Force"] = df.groupby(["Input Force"])["Average Force"].mean()
        df_avg["Avg Median Force"] = df.groupby(["Input Force"])["Median Force"].mean()
        df_avg["Avg Maximum Force"] = df.groupby(["Input Force"])["Maximum Force"].mean()
        df_avg["Avg Minimum Force"] = df.groupby(["Input Force"])["Minimum Force"].mean()
        df_avg["Avg StdDev Force"] = df.groupby(["Input Force"])["StdDev Force"].mean()
        df_avg.reset_index(inplace=True)
        print(df_avg)
        return df_avg

    def create_plot(self):
        print("Plotting Force-to-Force...")
        self.avg_force_plot()
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

    def avg_force_plot(self):
        df = self.df_sum
        df_avg = self.df_avg
        df["Input Force"] = df["Input Force"].astype(str) + " N"
        for operate in self.compute:
            x_axis = "Part Number"
            y_axis = f"{operate} Force"
            x_start = df[x_axis].iloc[0]
            x_end = df[x_axis].iloc[-1]
            y_start = df[y_axis].iloc[0]
            y_end = df[y_axis].iloc[-1]
            fig = []
            avg_annotation = []
            avg_xpos = df[x_axis].iloc[0]
            fig.append(px.scatter(df, x=x_axis, y=[y_axis], color="Input Force", symbol="Input Force"))
            for i in range(len(df_avg)):
                avg_force = df_avg[f"Avg {operate} Force"].iloc[i]
                fig.append(px.line(x=[x_start, x_end], y=[avg_force, avg_force], line_dash_sequence=["dash"], color_discrete_sequence=self.list_colors[i:]))
                avg_text = "Avg = {:.2f} N".format(avg_force)
                avg_annotation.append(self.set_annotation(avg_xpos, avg_force, avg_text, ax_pos=100, ay_pos=-100))
            subfig = make_subplots()
            for i in range(len(fig)):
                subfig.add_traces(fig[i].data)
            subfig.update_traces(marker={"size":15})
            self.plot_param["figure"] = subfig
            self.plot_param["filename"] = f"plot_{operate.lower()}_force"
            self.plot_param["title"] = f"DVT Gripper {operate} Force (Input Force)"
            self.plot_param["x_title"] = "Part Number"
            self.plot_param["y_title"] = f"{operate} Output Force (N)"
            self.plot_param["x_range"] = None
            self.plot_param["y_range"] = [0, 25]
            self.plot_param["legend"] = "Input Force"
            self.plot_param["annotation"] = avg_annotation
            self.write_plot(self.plot_param)

if __name__ == '__main__':
    print("\nPlot Gripper Force Results\n")
    path = str(input("Enter Gripper Force data path: ") or "gripper force")
    plot = Plot(path)
    plot.create_plot()
