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
        self.dict_tables = {
            "Avg":"gripper_width_avg.csv",
            "Avg Force":"gripper_width_avg_force.csv",
        }
        self.create_folder()
        self.df_data = self.import_files(self.path)
        self.df_avg = self.average_df(self.df_data, self.dict_tables["Avg"])
        self.df_avgf = self.average_force_df(self.df_avg, self.dict_tables["Avg Force"])

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
        df.sort_values(by=["Input Force","Step Width"], ignore_index=True, inplace=True)
        return df

    def create_folder(self):
        path = self.PLOT_PATH.replace("/","")
        if not os.path.exists(path):
            os.makedirs(path)

    def average_df(self, df, filename):
        first_column = "Input Force"
        df_avg = pd.DataFrame()
        df_avg["Standard Deviation"] = df.groupby(["Step Width","Input Force"])["Absolute Error"].std()
        df_avg["Absolute Error"] = df.groupby(["Step Width","Input Force"])["Absolute Error"].mean()
        df_avg.sort_values(by=["Input Force","Step Width"], inplace=True)
        df_avg.reset_index(inplace=True)
        df_avg.insert(0, first_column, df_avg.pop(first_column))
        df_avg["Relative Error"] = df_avg["Absolute Error"] / df_avg["Step Width"]
        df_avg["Percent Error"] = df_avg["Relative Error"] * 100
        df_avg["Accuracy"] = 100 - df_avg["Percent Error"]
        df_avg = df_avg.round(4)
        df_avg.to_csv(self.PLOT_PATH + filename)
        print("\nAverage Data:\n")
        print(df_avg)
        return df_avg

    def average_force_df(self, df, filename):
        df_avgf = pd.DataFrame()
        df_avgf["Avg Standard Deviation"] = df.groupby(["Input Force"])["Standard Deviation"].mean()
        df_avgf["Avg Absolute Error"] = df.groupby(["Input Force"])["Absolute Error"].mean()
        df_avgf["Avg Relative Error"] = df.groupby(["Input Force"])["Relative Error"].mean()
        df_avgf["Avg Percent Error"] = df.groupby(["Input Force"])["Percent Error"].mean()
        df_avgf["Avg Accuracy"] = df.groupby(["Input Force"])["Accuracy"].mean()
        df_avgf = df_avgf.round(4)
        df_avgf.to_csv(self.PLOT_PATH + filename)
        print("\nAverage Data by Force:\n")
        print(df_avgf)
        return df_avgf

    def create_plot(self):
        print("Plotting Gripper Width Data...")
        self.gripper_width_plot()
        print("Plotting Gripper Width Error...")
        self.gripper_width_error_plot()
        print("Plots Saved!")

    def set_legend(self, figure, legend):
        for idx, name in enumerate(legend):
            figure.data[idx].name = name
            figure.data[idx].hovertemplate = name

    def set_annotation(self, x_pos, y_pos, text, ax_pos=0, ay_pos=0, x_ref="x1", y_ref="y1"):
        annotation = {
            "x":x_pos,
            "y":y_pos,
            "ax":ax_pos,
            "ay":ay_pos,
            "xref":x_ref,
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

    def gripper_width_plot(self):
        df = self.df_data
        forces = df["Input Force"].drop_duplicates().tolist()
        for force in forces:
            df_f = df[df["Input Force"] == force]
            x_axis = "Cycle"
            y_axis = "Gripper Width"
            x_start = df_f[x_axis].iloc[0]
            x_end = df_f[x_axis].iloc[-1]
            y_start = df_f[y_axis].iloc[0]
            y_end = df_f[y_axis].iloc[-1]

            max_annotation = []
            steps = df_f["Step Width"].drop_duplicates().tolist()
            for step in steps:
                df_step = df_f[df_f["Step Width"] == step]
                y_max = df_step[y_axis].max()
                y_max_id = df_step[y_axis].idxmax()
                y_max_xpos = df.iloc[y_max_id][x_axis]
                y_max_text = f"Max = {y_max}mm"
                max_annotation.append(self.set_annotation(y_max_xpos, y_max, y_max_text, ax_pos=50, ay_pos=-50))

            fig = px.line(df_f, x=x_axis, y=[y_axis], color="Step Width", markers=True)
            self.set_legend(fig, [str(i) + " mm" for i in steps])
            self.plot_param["figure"] = fig
            self.plot_param["filename"] = f"plot_gripper_width_force{force}"
            self.plot_param["title"] = f"DVT Gripper Jaw Width (Input Force = {force})"
            self.plot_param["x_title"] = "Cycle Number"
            self.plot_param["y_title"] = "Gripper Width (mm)"
            self.plot_param["x_range"] = [x_start, x_end]
            self.plot_param["y_range"] = [60, 100]
            self.plot_param["legend"] = "Step Width"
            self.plot_param["annotation"] = max_annotation
            self.write_plot(self.plot_param)

    def gripper_width_error_plot(self):
        df = self.df_avg
        x_axis = "Step Width"
        y_axis = "Absolute Error"
        y_std = "Standard Deviation"
        x_start = df[x_axis].iloc[0]
        x_end = df[x_axis].iloc[-1]
        y_start = df[y_axis].iloc[0]
        y_end = df[y_axis].iloc[-1]

        y_min = round(df[y_axis].min(), 3)
        y_min_id = df[y_axis].idxmin()
        y_min_width = df.iloc[y_min_id][x_axis]
        y_min_force = df.iloc[y_min_id]["Input Force"]

        y_max = round(df[y_axis].max(), 3)
        y_max_id = df[y_axis].idxmax()
        y_max_width = df.iloc[y_max_id][x_axis]
        y_max_force = df.iloc[y_max_id]["Input Force"]

        print(f"Min Absolute Error = {y_min} mm ({y_min_width} mm, {y_min_force})")
        print(f"Max Absolute Error = {y_max} mm ({y_max_width} mm, {y_max_force})")

        df["Input Force"] = df["Input Force"].astype(str) + " N"
        fig = px.bar(df, x=x_axis, y=[y_axis], color="Input Force", error_y=y_std, barmode='group')
        fig.update_layout(
            xaxis_tickmode = 'array',
            xaxis_tickvals = df[x_axis].tolist(),
        )
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = f"plot_gripper_width_error"
        self.plot_param["title"] = f"DVT Gripper Jaw Width (Absolute Error)"
        self.plot_param["x_title"] = "Staircase Width (mm)"
        self.plot_param["y_title"] = "Average Absolute Error (mm)"
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
