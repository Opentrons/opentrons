"""Plot Gripper Center Test Results."""
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
        self.PROBE_DIA = 4
        self.PROBE_RAD = self.PROBE_DIA / 2
        self.PLOT_HEIGHT = 800
        self.PLOT_WIDTH = 1000
        self.PLOT_FONT = 16
        self.PLOT_PATH = "plot_gripper_center/"
        self.PLOT_FORMAT = ".png"
        self.slot = None
        self.force = None
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
        self.df_offset = self.compute_offset(self.df_data)
        print(f"Slot Number = {self.slot}")
        print(f"Input Force = {self.force} N")
        print(f"Test Cycles = {len(self.df_data)}")
        self.print_offset(self.df_offset)

    def import_file(self, file):
        df = pd.read_csv(file)
        # df = df[df["Cycle"] <= 40]
        self.total_cycles = df["Cycle"].max()
        self.slot = df["Slot"].iloc[0]
        self.force = df["Input Force"].iloc[0]
        df.name = file
        return df

    def create_folder(self):
        path = self.PLOT_PATH.replace("/","")
        if not os.path.exists(path):
            os.makedirs(path)

    def create_plot(self):
        print("Plotting Gripper Center Offset...")
        self.center_offset_plot()
        print("Plots Saved!")

    def compute_offset(self, df):
        df_off = pd.DataFrame()
        df_off["Measured"] = df["Y Offset"]
        df_off["Actual"] = 0
        df_off["Absolute Error"] = abs(df_off["Measured"] - df_off["Actual"])
        df_off["Relative Error"] = df_off["Absolute Error"] / (1 + df_off["Actual"])
        df_off["Percent Error"] = df_off["Relative Error"] * 100
        df_off["Accuracy"] = 100 - df_off["Percent Error"]
        df_off["Range"] = df_off["Measured"].max() - df_off["Measured"].min()
        df_off["Range±"] = df_off["Range"] / 2
        df_off["Average Deviation"] = abs(df_off["Measured"] - df_off["Measured"].mean())
        df_off["Standard Deviation"] = df_off["Measured"].std()
        return df_off

    def print_offset(self, df):
        print(f"\nY-axis Offset Data:")
        print("-> Full Range = {:.3f} mm".format(df["Range"].iloc[0]))
        print("-> ± Range = ± {:.3f} mm".format(df["Range±"].iloc[0]))
        print("-> Average Absolute Deviation = ± {:.3f} mm".format(df["Average Deviation"].mean()))
        print("-> Average Standard Deviation = ± {:.3f} mm".format(df["Standard Deviation"].mean()))
        print("-> Average Absolute Error = {:.3f} mm".format(df["Absolute Error"].mean()))
        print("-> Average Relative Error = {:.3f} mm".format(df["Relative Error"].mean()))
        print("-> Average Percent Error = {:.3f}%".format(df["Percent Error"].mean()))
        print("-> Average Accuracy = {:.3f}%".format(df["Accuracy"].mean()))
        print("")

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

    def center_offset_plot(self):
        df = self.df_data
        x_axis = "Cycle"
        y_axis = "Y Offset"
        x_start = df[x_axis].iloc[0]
        x_end = df[x_axis].iloc[-1]
        y_start = df[y_axis].iloc[0]
        y_end = df[y_axis].iloc[-1]
        x_avg = df[x_axis].mean()
        y_avg = df[y_axis].mean()
        y_min = round(df[y_axis].min(), 3)
        y_max = round(df[y_axis].max(), 3)

        df_sort = df.loc[(df["Y Offset"] - 0).abs().argsort()]
        y_acc = round(df_sort[y_axis].iloc[0], 3)
        y_acc_xpos = df_sort.iloc[0][x_axis].item()
        y_acc_text = f"Most Accurate Offset = {y_acc}mm"

        y_min = round(df[y_axis].min(), 3)
        y_min_id = df[y_axis].idxmin()
        y_min_xpos = df.iloc[y_min_id][x_axis].item()
        y_min_text = f"Min Value = {y_min}mm"

        y_max = round(df[y_axis].max(), 3)
        y_max_id = df[y_axis].idxmax()
        y_max_xpos = df.iloc[y_max_id][x_axis].item()
        y_max_text = f"Max Value = {y_max}mm"

        y_range = round((y_max - y_min)/2, 3)
        y_avg = round(df[y_axis].mean(), 3)
        y_avg_xpos = 0
        y_avg_text = f"Avg = {y_avg}mm ± {y_range}mm"

        annotation_ymin = self.set_annotation(y_min_xpos, y_min, y_min_text, ax_pos=-100, ay_pos=100)
        annotation_ymax = self.set_annotation(y_max_xpos, y_max, y_max_text, ax_pos=-100, ay_pos=-100)
        annotation_yavg = self.set_annotation(y_avg_xpos, y_avg, y_avg_text, ax_pos=100, ay_pos=-100)
        annotation_yacc = self.set_annotation(y_acc_xpos, y_acc, y_acc_text, ax_pos=100, ay_pos=-100)

        fig1 = px.line(df, x=x_axis, y=[y_axis], markers=True)
        fig2 = px.line(x=[-self.LIMIT, self.LIMIT], y=[[0, 0]], line_dash_sequence=["dashdot"], color_discrete_sequence=["black"])
        fig3 = px.line(x=[-self.LIMIT, self.LIMIT], y=[[y_avg, y_avg]], line_dash_sequence=["dash"], color_discrete_sequence=["red"])
        self.set_legend(fig2, ["Y Center"])
        self.set_legend(fig3, ["Average"])
        subfig = make_subplots()
        subfig.add_traces(fig1.data + fig2.data + fig3.data)
        subfig.update_layout(
            xaxis_tickmode = 'linear',
            xaxis_tick0 = 0,
            xaxis_dtick = 10,
        )
        self.plot_param["figure"] = subfig
        self.plot_param["filename"] = "plot_center_offset"
        self.plot_param["title"] = f"Gripper Y-Axis Center Offset (Input Force = {self.force} N)"
        self.plot_param["x_title"] = "Cycle Number"
        self.plot_param["y_title"] = "Y-Axis Offset (mm)"
        self.plot_param["x_range"] = [0, x_end]
        self.plot_param["y_range"] = [-0.2, 0.2]
        self.plot_param["legend"] = "Data"
        self.plot_param["annotation"] = [annotation_ymin, annotation_ymax, annotation_yavg, annotation_yacc]
        self.write_plot(self.plot_param)

if __name__ == '__main__':
    print("\nPlot Gripper Center Test Results\n")
    plot = Plot(sys.argv[1])
    plot.create_plot()
