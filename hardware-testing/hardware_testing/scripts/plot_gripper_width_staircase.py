"""Plot Gripper Width Staircase Test Results."""
import os
import sys
import argparse
import pandas as pd
import plotly.express as px
from plotly.subplots import make_subplots

class Plot:
    def __init__(self, path):
        self.path = path
        self.color_list = px.colors.qualitative.Plotly
        self.LIMIT = 1000
        self.PROBE_DIA = 5.5
        self.PLOT_HEIGHT = 800
        self.PLOT_WIDTH = 1000
        self.PLOT_FONT = 16
        self.PLOT_PATH = "plot_gripper_width_staircase/"
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
        self.df_data = self.import_files(self.path)
        self.df_avg = self.average_df(self.df_data)

    def import_files(self, path):
        df = pd.DataFrame()
        for item in os.listdir(path):
            dir = os.path.join(path, item)
            if os.path.isdir(dir):
                for file in os.listdir(dir):
                    print(file)
                    if file.lower().endswith('.csv'):
                        csv = os.path.join(dir, file)
                        data = pd.read_csv(csv)
                        df = df.append(data, ignore_index=True)
        df["Input Force"] = df["Input Force"].astype(int)
        df.sort_values(by=["Input Force","Step Width"], ignore_index=True, inplace=True)
        print(df)
        return df

    def create_folder(self):
        path = self.PLOT_PATH.replace("/","")
        if not os.path.exists(path):
            os.makedirs(path)

    def average_df(self, df):
        df_avg = pd.DataFrame()
        df_avg["Average Width"] = df.groupby(["Step Width","Input Force"])["Gripper Width"].mean()
        df_avg["Average Error"] = df.groupby(["Step Width","Input Force"])["Absolute Error"].mean()
        df_avg.reset_index(inplace=True)
        print(df_avg)
        return df_avg

    def create_plot(self):
        print("Plotting Gripper Width Error...")
        self.gripper_width_error_plot()
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

    def gripper_width_error_plot(self):
        df = self.df_avg
        x_axis = "Step Width"
        y_axis = "Average Error"
        df["Input Force"] = df["Input Force"].astype(str) + " N"
        x_start = df[x_axis].iloc[0]
        x_end = df[x_axis].iloc[-1]
        y_start = df[y_axis].iloc[0]
        y_end = df[y_axis].iloc[-1]
        fig = px.bar(df, x=x_axis, y=[y_axis], color="Input Force", barmode='group')
        fig.update_layout(
            xaxis_tickmode = 'array',
            xaxis_tickvals = df[x_axis].tolist(),
        )
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = f"plot_gripper_width_error"
        self.plot_param["title"] = f"DVT Gripper Jaw Width Error"
        self.plot_param["x_title"] = "Staircase Width (mm)"
        self.plot_param["y_title"] = "Average Width Error (mm)"
        self.plot_param["x_range"] = None
        self.plot_param["y_range"] = [0, 2]
        self.plot_param["legend"] = "Input Force"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

if __name__ == '__main__':
    print("\nPlot Gripper Width Staircase Test Results\n")
    path = str(input("Enter Gripper Width data path: ") or "..")
    plot = Plot(path)
    plot.create_plot()
