"""Plot Gripper Width Slider Test Results."""
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
        self.PLOT_PATH = "plot_gripper_width_slider/"
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
            "Avg Error":"gripper_width_avg_error.csv",
        }
        self.create_folder()
        self.df_data = self.import_files(self.path)
        self.df_avg = self.average_df(self.df_data, self.dict_tables["Avg"])
        self.df_avg_err = self.average_width_df(self.df_avg, self.dict_tables["Avg Error"])

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
        df.sort_values(by=["Gripper Width","Cycle"], ignore_index=True, inplace=True)
        return df

    def create_folder(self):
        path = self.PLOT_PATH.replace("/","")
        if not os.path.exists(path):
            os.makedirs(path)

    def average_df(self, df, filename):
        df_avg = pd.DataFrame()
        df_avg["Encoder StdDev"] = df.groupby(["Gripper Width"])["Encoder Error"].std()
        df_avg["Measured StdDev"] = df.groupby(["Gripper Width"])["Measured Error"].std()
        df_avg["Encoder Error"] = abs(df.groupby(["Gripper Width"])["Encoder Error"].mean())
        df_avg["Measured Error"] = abs(df.groupby(["Gripper Width"])["Measured Error"].mean())
        df_avg["Jaw Error"] = abs(df.groupby(["Gripper Width"])["Jaw Error"].mean())
        df_avg.sort_values(by=["Gripper Width"], inplace=True)
        df_avg.reset_index(inplace=True)
        df_avg = df_avg.round(4)
        df_avg.to_csv(self.PLOT_PATH + filename)
        print("\nAverage Data:\n")
        print(df_avg)
        return df_avg

    def average_width_df(self, df, filename):
        df_avg_err = pd.DataFrame()
        df_avg_err["Gripper Width"] = df["Gripper Width"]
        df_avg_err["Avg Standard Deviation"] = df["Measured StdDev"]
        df_avg_err["Avg Absolute Error"] = df["Measured Error"]
        df_avg_err["Avg Relative Error"] = df_avg_err["Avg Absolute Error"] / df_avg_err["Gripper Width"]
        df_avg_err["Avg Percent Error"] = df_avg_err["Avg Relative Error"] * 100
        df_avg_err["Avg Accuracy"] = 100 - df_avg_err["Avg Percent Error"]
        df_avg_err = df_avg_err.round(4)
        df_avg_err.to_csv(self.PLOT_PATH + filename)
        print("\nAverage Error:\n")
        print(df_avg_err)
        return df_avg_err

    def create_plot(self):
        print("Plotting Gripper Width Slider Data...")
        self.gripper_width_slider_plot()
        print("Plotting Gripper Slider Error...")
        self.gripper_error_all_plot()
        print("Plotting Gripper Encoder Error...")
        self.gripper_error_encoder_plot()
        print("Plotting Gripper Measured Error...")
        self.gripper_error_measured_plot()
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

    def gripper_width_slider_plot(self):
        df = self.df_data
        x_axis = "Cycle"
        y_axis = "Measured Width"
        x_start = df[x_axis].iloc[0]
        x_end = df[x_axis].iloc[-1]
        y_start = df[y_axis].iloc[0]
        y_end = df[y_axis].iloc[-1]

        max_annotation = []
        width_list = df["Gripper Width"].drop_duplicates().tolist()
        for width in width_list:
            df_w = df[df["Gripper Width"] == width]
            y_max = df_w[y_axis].max()
            y_max_id = df_w[y_axis].idxmax()
            y_max_xpos = df.iloc[y_max_id][x_axis]
            y_max_text = f"Max = {y_max}mm"
            max_annotation.append(self.set_annotation(y_max_xpos, y_max, y_max_text, ax_pos=50, ay_pos=-50))

        fig = px.line(df, x=x_axis, y=[y_axis], color="Gripper Width", markers=True)
        self.set_legend(fig, [str(i) + " mm" for i in width_list])
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = f"plot_gripper_width_slider"
        self.plot_param["title"] = f"DVT Gripper Jaw Width (Slider)"
        self.plot_param["x_title"] = "Cycle Number"
        self.plot_param["y_title"] = "Measured Width (mm)"
        self.plot_param["x_range"] = [x_start, x_end]
        self.plot_param["y_range"] = [70, 90]
        self.plot_param["legend"] = "Desired Width"
        self.plot_param["annotation"] = max_annotation
        self.write_plot(self.plot_param)

    def gripper_error_all_plot(self):
        df = self.df_avg
        x_axis = "Gripper Width"
        y_axis = ["Encoder Error","Measured Error"]
        y_std = ["Encoder StdDev","Measured StdDev"]
        x_start = df[x_axis].iloc[0]
        x_end = df[x_axis].iloc[-1]
        y_start = df[y_axis].iloc[0]
        y_end = df[y_axis].iloc[-1]
        subfig = make_subplots()
        for i in range(len(y_axis)):
            fig = px.bar(df, x=x_axis, y=[y_axis[i]], error_y=y_std[i], barmode='group', color_discrete_sequence=self.color_list[i:])
            subfig.add_traces(fig.data)
        subfig.update_layout(
            xaxis_tickmode = 'array',
            xaxis_tickvals = df[x_axis].tolist(),
        )
        self.plot_param["figure"] = subfig
        self.plot_param["filename"] = f"plot_gripper_slider_error_all"
        self.plot_param["title"] = f"DVT Gripper Jaw Width (Absolute Error)"
        self.plot_param["x_title"] = "Desired Jaw Width (mm)"
        self.plot_param["y_title"] = "Average Absolute Error (mm)"
        self.plot_param["x_range"] = None
        self.plot_param["y_range"] = [0, 0.5]
        self.plot_param["legend"] = "Error Data"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

    def gripper_error_encoder_plot(self):
        df = self.df_avg
        x_axis = "Gripper Width"
        y_axis = "Encoder Error"
        y_std = "Encoder StdDev"
        x_start = df[x_axis].iloc[0]
        x_end = df[x_axis].iloc[-1]
        y_start = df[y_axis].iloc[0]
        y_end = df[y_axis].iloc[-1]
        fig = px.bar(df, x=x_axis, y=[y_axis], error_y=y_std, barmode='group', color_discrete_sequence=self.color_list[0:])
        fig.update_layout(
            xaxis_tickmode = 'array',
            xaxis_tickvals = df[x_axis].tolist(),
        )
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = f"plot_gripper_slider_error_encoder"
        self.plot_param["title"] = f"DVT Gripper Jaw Width (Encoder Error)"
        self.plot_param["x_title"] = "Desired Jaw Width (mm)"
        self.plot_param["y_title"] = "Average Absolute Error (mm)"
        self.plot_param["x_range"] = None
        self.plot_param["y_range"] = [0, 0.05]
        self.plot_param["legend"] = "Error Data"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

    def gripper_error_measured_plot(self):
        df = self.df_avg
        x_axis = "Gripper Width"
        y_axis = "Measured Error"
        y_std = "Measured StdDev"
        x_start = df[x_axis].iloc[0]
        x_end = df[x_axis].iloc[-1]
        y_start = df[y_axis].iloc[0]
        y_end = df[y_axis].iloc[-1]
        fig = px.bar(df, x=x_axis, y=[y_axis], error_y=y_std, barmode='group', color_discrete_sequence=self.color_list[1:])
        fig.update_layout(
            xaxis_tickmode = 'array',
            xaxis_tickvals = df[x_axis].tolist(),
        )
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = f"plot_gripper_slider_error_measured"
        self.plot_param["title"] = f"DVT Gripper Jaw Width (Measured Error)"
        self.plot_param["x_title"] = "Desired Jaw Width (mm)"
        self.plot_param["y_title"] = "Average Absolute Error (mm)"
        self.plot_param["x_range"] = None
        self.plot_param["y_range"] = [0, 0.5]
        self.plot_param["legend"] = "Error Data"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

if __name__ == '__main__':
    print("\nPlot Gripper Width Slider Test Results\n")
    path = str(input("Enter Gripper Width data path: ") or "..")
    plot = Plot(path)
    plot.create_plot()
