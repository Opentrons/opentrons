"""Plot Pipette Calibration Test Results."""
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
        self.PROBE_DIA = 5.5
        self.PROBE_RAD = self.PROBE_DIA / 2
        self.PLOT_HEIGHT = 800
        self.PLOT_WIDTH = 1000
        self.PLOT_FONT = 16
        self.PLOT_PATH = "plot_pipette_calibration/"
        self.PLOT_FORMAT = ".png"
        # self.axes = ["X", "Y", "Z"]
        self.axes = ["X", "Y"]
        # self.axes = ["Z"]
        self.jog_offset = 0 # mm
        self.gauge_time =  0.25 # min
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
            "annotation":None,
        }
        self.gauge_zero = {
            "X":None,
            "Y":None,
            "Z":None,
        }
        self.axes_data = {
            "X":None,
            "Y":None,
            "Z":None,
        }
        self.create_folder()
        self.df_data = self.import_file(self.data)
        self.cycle_time = self.get_cycle_time(self.df_data)
        self.calibration_time = self.get_calibration_time(self.cycle_time)
        print(f"Test Cycles = {len(self.df_data)}")
        print(f"Average Cycle Time = {self.cycle_time}")
        print(f"Average Calibration Time = {self.calibration_time}")
        self.compute_axes(self.df_data)
        self.print_axes()

    def import_file(self, file):
        df = pd.read_csv(file)
        # df = df[(df["Cycle"] > 0) & (df["Cycle"] < 50)]
        self.total_cycles = df["Cycle"].max()
        self.slot = df["Slot"].iloc[0]
        if "X" in self.axes:
            self.gauge_zero["X"] = df["X Zero"].iloc[0]
            df["X Zeroed"] = round(df["X Gauge"] - df["X Zero"] - (self.PROBE_RAD + self.jog_offset), 3)
        if "Y" in self.axes:
            self.gauge_zero["Y"] = df["Y Zero"].iloc[0]
            df["Y Zeroed"] = round(df["Y Gauge"] - df["Y Zero"] - (self.PROBE_RAD + self.jog_offset), 3)
        if "Z" in self.axes:
            self.gauge_zero["Z"] = df["Z Zero"].iloc[0]
            df["Z Zeroed"] = round(df["Z Gauge"] - df["Z Zero"], 3)
        df.name = file
        return df

    def create_folder(self):
        path = self.PLOT_PATH.replace("/","")
        if not os.path.exists(path):
            os.makedirs(path)

    def create_plot(self):
        print("Plotting Deck Height...")
        self.deck_height_plot()
        if "X" in self.axes or "Y" in self.axes :
            print("Plotting Slot Center...")
            self.slot_center_plot()
            print("Plotting Axis Center...")
            for idx, axis in enumerate(self.axes):
                if idx < 2:
                    self.axis_center_plot(axis, idx)
        print("Plotting Gauge Data...")
        for idx, axis in enumerate(self.axes):
            self.gauge_plot(axis, idx)
            self.gauge_plot(axis, idx, zero=True)
        print("Plots Saved!")

    def get_cycle_time(self, df):
        cycles = len(df)
        total_time = []
        for i in range(cycles-1):
            stop_time = df["Time"].iloc[-(i+1)]
            start_time = df["Time"].iloc[-(i+2)]
            total_time.append(round(stop_time - start_time, 3))
        avg_time = sum(total_time) / len(total_time)
        avg_time = round(avg_time, 3)
        return avg_time

    def get_calibration_time(self, avg_time):
        return round(avg_time - self.gauge_time, 3)

    def compute_axes(self, df):
        for axis in self.axes:
            df_axis = pd.DataFrame()
            df_axis["Measured"] = df[f"{axis} Gauge"]
            df_axis["Actual"] = df[f"{axis} Zero"] + self.PROBE_RAD
            df_axis["Absolute Error"] = abs(df_axis["Measured"] - df_axis["Actual"])
            df_axis["Relative Error"] = df_axis["Absolute Error"] / df_axis["Actual"]
            df_axis["Percent Error"] = df_axis["Relative Error"] * 100
            df_axis["Accuracy"] = 100 - df_axis["Percent Error"]
            df_axis["Range"] = df_axis["Measured"].max() - df_axis["Measured"].min()
            df_axis["Range±"] = df_axis["Range"] / 2
            df_axis["Average Deviation"] = abs(df_axis["Measured"] - df_axis["Measured"].mean())
            df_axis["Standard Deviation"] = df_axis["Measured"].std()
            self.axes_data[axis] = df_axis

    def print_axes(self):
        for axis in self.axes:
            print(f"\n{axis}-axis Data:")
            print("-> {}-axis Full Range = {:.3f} mm".format(axis, self.axes_data[axis]["Range"].iloc[0]))
            print("-> {}-axis ± Range = ± {:.3f} mm".format(axis, self.axes_data[axis]["Range±"].iloc[0]))
            print("-> {}-axis Average Absolute Deviation = ± {:.3f} mm".format(axis, self.axes_data[axis]["Average Deviation"].mean()))
            print("-> {}-axis Average Standard Deviation = ± {:.3f} mm".format(axis, self.axes_data[axis]["Standard Deviation"].mean()))
            print("-> {}-axis Average Absolute Error = {:.3f} mm".format(axis, self.axes_data[axis]["Absolute Error"].mean()))
            print("-> {}-axis Average Relative Error = {:.3f} mm".format(axis, self.axes_data[axis]["Relative Error"].mean()))
            print("-> {}-axis Average Percent Error = {:.3f}%".format(axis, self.axes_data[axis]["Percent Error"].mean()))
            print("-> {}-axis Average Accuracy = {:.3f}%".format(axis, self.axes_data[axis]["Accuracy"].mean()))
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

    def deck_height_plot(self):
        df = self.df_data
        x_axis = "Cycle"
        y_axis = "Deck Height"
        x_start = df[x_axis].iloc[0]
        x_end = df[x_axis].iloc[-1]
        y_start = df[y_axis].iloc[0]
        y_end = df[y_axis].iloc[-1]

        y_min = round(df[y_axis].min(), 3)
        y_min_id = df[y_axis].idxmin()
        y_min_xpos = df.loc[y_min_id][x_axis].item()
        y_min_text = f"Deck Min = {y_min}mm"

        y_max = round(df[y_axis].max(), 3)
        y_max_id = df[y_axis].idxmax()
        y_max_xpos = df.loc[y_max_id][x_axis].item()
        y_max_text = f"Deck Max = {y_max}mm"

        annotation_ymin = self.set_annotation(y_min_xpos, y_min, y_min_text, ax_pos=100, ay_pos=100)
        annotation_ymax = self.set_annotation(y_max_xpos, y_max, y_max_text, ax_pos=100, ay_pos=-100)

        fig = px.line(df, x=x_axis, y=[y_axis], markers=True)
        fig.update_layout(
            xaxis_tickmode = 'linear',
            xaxis_tick0 = 0,
            xaxis_dtick = 10,
        )
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_deck_height"
        self.plot_param["title"] = "Deck Height"
        self.plot_param["x_title"] = "Cycle Number"
        self.plot_param["y_title"] = "Deck Height (mm)"
        self.plot_param["x_range"] = [0, x_end]
        self.plot_param["y_range"] = [-2, -1]
        self.plot_param["legend"] = "Data"
        self.plot_param["annotation"] = [annotation_ymin, annotation_ymax]
        self.write_plot(self.plot_param)

    def slot_center_plot(self):
        df = self.df_data
        x_axis = "X Center"
        y_axis = "Y Center"
        x_start = df[x_axis].iloc[0]
        x_end = df[x_axis].iloc[-1]
        y_start = df[y_axis].iloc[0]
        y_end = df[y_axis].iloc[-1]
        x_avg = df[x_axis].mean()
        y_avg = df[y_axis].mean()
        x_min = df[x_axis].min()
        y_min = df[y_axis].min()
        x_max = df[x_axis].max()
        y_max = df[y_axis].max()
        x_off = 0.10
        y_off = 0.10
        fig1 = px.scatter(df, x=x_axis, y=[y_axis], color_discrete_sequence=["green"])
        fig2 = px.line(x=[-self.LIMIT, self.LIMIT], y=[[y_avg, y_avg]], line_dash_sequence=["dash"], color_discrete_sequence=["blue"])
        fig3 = px.line(x=[x_avg, x_avg], y=[[-self.LIMIT, self.LIMIT]], line_dash_sequence=["dash"], color_discrete_sequence=["red"])
        self.set_legend(fig1, ["Slot Center"])
        self.set_legend(fig2, ["X Average"])
        self.set_legend(fig3, ["Y Average"])
        fig1.update_traces(
            marker={
                "size":10,
                "line":{"width":2, "color":"black"}
            }
        )
        subfig = make_subplots()
        subfig.add_traces(fig1.data + fig2.data + fig3.data)
        self.plot_param["figure"] = subfig
        self.plot_param["filename"] = "plot_slot_center"
        self.plot_param["title"] = f"Slot #{self.slot} Calibrated Center (x{self.total_cycles} Cycles)"
        self.plot_param["x_title"] = "X-Axis Position (mm)"
        self.plot_param["y_title"] = "Y-Axis Position (mm)"
        self.plot_param["x_range"] = [x_avg - x_off, x_avg + x_off]
        self.plot_param["y_range"] = [y_avg - y_off, y_avg + y_off]
        self.plot_param["legend"] = "Data"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

    def axis_center_plot(self, axis, index):
        df = self.df_data
        x_axis = "Cycle"
        y_axis = f"{axis} Center"
        x_start = df[x_axis].iloc[0]
        x_end = df[x_axis].iloc[-1]
        y_start = df[y_axis].iloc[0]
        y_end = df[y_axis].iloc[-1]
        x_avg = df[x_axis].mean()
        y_avg = df[y_axis].mean()
        x_off = 0.10
        y_off = 0.10

        y_min = round(df[y_axis].min(), 3)
        y_min_id = df[y_axis].idxmin()
        y_min_xpos = df.loc[y_min_id][x_axis].item()
        y_min_text = f"{axis} Min = {y_min}mm"

        y_max = round(df[y_axis].max(), 3)
        y_max_id = df[y_axis].idxmax()
        y_max_xpos = df.loc[y_max_id][x_axis].item()
        y_max_text = f"{axis} Max = {y_max}mm"

        y_avg = round(y_avg, 2)
        y_avg_xpos = 0
        y_avg_text = f"{axis} Avg = {y_avg}mm"

        y_start = round(y_min, 2) - 0.05
        y_end = round(y_max, 2) + 0.05

        annotation_ymin = self.set_annotation(y_min_xpos, y_min, y_min_text, ax_pos=100, ay_pos=100)
        annotation_ymax = self.set_annotation(y_max_xpos, y_max, y_max_text, ax_pos=100, ay_pos=-100)
        annotation_yavg = self.set_annotation(y_avg_xpos, y_avg, y_avg_text, ax_pos=100, ay_pos=-100)

        fig1 = px.line(df, x=x_axis, y=[y_axis], markers=True, color_discrete_sequence=self.list_colors[index:])
        fig2 = px.line(x=[-self.LIMIT, self.LIMIT], y=[[y_avg, y_avg]], line_dash_sequence=["dash"], color_discrete_sequence=["black"])
        self.set_legend(fig2, ["Average"])
        subfig = make_subplots()
        subfig.add_traces(fig1.data + fig2.data)
        subfig.update_layout(
            xaxis_tickmode = 'linear',
            xaxis_tick0 = 0,
            xaxis_dtick = 10,
        )
        self.plot_param["figure"] = subfig
        self.plot_param["filename"] = f"plot_center_{axis}"
        self.plot_param["title"] = f"{axis} Center Data"
        self.plot_param["x_title"] = "Cycle Number"
        self.plot_param["y_title"] = f"{axis} Center (mm)"
        self.plot_param["x_range"] = [0, x_end]
        self.plot_param["y_range"] = [y_avg - y_off, y_avg + y_off]
        self.plot_param["legend"] = "Data"
        self.plot_param["annotation"] = [annotation_ymin, annotation_ymax, annotation_yavg]
        self.write_plot(self.plot_param)

    def gauge_plot(self, axis, index, zero=False):
        df = self.df_data
        x_axis = "Cycle"
        if zero:
            y_axis = f"{axis} Zeroed"
            filename = f"plot_gauge_zero_{axis}"
            title = f"(Zeroed) {axis} Gauge Data"
        else:
            y_axis = f"{axis} Gauge"
            filename = f"plot_gauge_{axis}"
            title = f"(Original) {axis} Gauge Data"
        x_start = df[x_axis].iloc[0]
        x_end = df[x_axis].iloc[-1]

        y_min = df[y_axis].min()
        y_min_id = df[y_axis].idxmin()
        y_min_xpos = df.loc[y_min_id][x_axis].item()
        y_min_text = f"{axis} Min = {y_min}mm"

        y_max = df[y_axis].max()
        y_max_id = df[y_axis].idxmax()
        y_max_xpos = df.loc[y_max_id][x_axis].item()
        y_max_text = f"{axis} Max = {y_max}mm"

        y_avg = df[y_axis].mean()
        y_range = (y_max - y_min) / 2

        y_range = round(y_range, 3)
        y_avg = round(y_avg, 3)
        y_avg_xpos = 0
        y_avg_text = f"{axis} Avg = {y_avg}mm ± {y_range}mm"

        y_start = round(y_min, 2) - 0.05
        y_end = round(y_max, 2) + 0.05

        if axis == "Z":
            annotation_ymin = self.set_annotation(y_min_xpos, y_min, y_min_text, ax_pos=-100, ay_pos=100)
        else:
            annotation_ymin = self.set_annotation(y_min_xpos, y_min, y_min_text, ax_pos=100, ay_pos=100)
        annotation_ymax = self.set_annotation(y_max_xpos, y_max, y_max_text, ax_pos=-100, ay_pos=-100)
        annotation_yavg = self.set_annotation(y_avg_xpos, y_avg, y_avg_text, ax_pos=100, ay_pos=-100)

        fig1 = px.line(df, x=x_axis, y=[y_axis], markers=True, color_discrete_sequence=self.list_colors[index:])
        fig2 = px.line(x=[-self.LIMIT, self.LIMIT], y=[[y_avg, y_avg]], line_dash_sequence=["dash"], color_discrete_sequence=["black"])
        self.set_legend(fig2, ["Average"])
        subfig = make_subplots()
        subfig.add_traces(fig1.data + fig2.data)
        subfig.update_layout(
            xaxis_tickmode = 'linear',
            xaxis_tick0 = 0,
            xaxis_dtick = 10,
        )
        self.plot_param["figure"] = subfig
        self.plot_param["filename"] = filename
        self.plot_param["title"] = title
        self.plot_param["x_title"] = "Cycle Number"
        self.plot_param["y_title"] = f"{axis} Gauge Displacement (mm)"
        self.plot_param["x_range"] = [0, x_end]
        self.plot_param["y_range"] = [y_start, y_end]
        self.plot_param["legend"] = "Gauges"
        self.plot_param["annotation"] = [annotation_ymin, annotation_ymax, annotation_yavg]
        self.write_plot(self.plot_param)

if __name__ == '__main__':
    print("\nPlot Pipette Calibration Test Results\n")
    plot = Plot(sys.argv[1])
    plot.create_plot()
