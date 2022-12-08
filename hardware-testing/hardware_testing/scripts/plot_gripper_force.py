"""Plot Gripper Force Test Results."""
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
        self.PLOT_PATH = "plot_gripper_force/"
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

    def import_file(self, file):
        df = pd.read_csv(file)
        df["Current"] = df["RMS"]*1000
        df["Peak+"] = df["Peak Plus"]*1000
        df["Peak-"] = df["Peak Minus"]*1000
        df.name = file
        return df

    def create_folder(self):
        path = self.PLOT_PATH.replace("/","")
        if not os.path.exists(path):
            os.makedirs(path)

    def create_plot(self):
        print("Plotting Current vs. PWM DC...")
        self.current_pwm_plot()
        print("Plotting Force vs. PWM DC...")
        self.force_pwm_plot()
        print("Plotting Avg Current vs. Force...")
        self.avg_current_force_plot()
        print("Plotting Max Current vs. Force...")
        self.max_current_force_plot()
        print("Plotting Peak vs. PWM DC...")
        self.peak_pwm_plot()
        print("Plots Saved!")

    def avg_df(self, df):
        df_avg = pd.DataFrame()
        df = df.groupby(["Vref","DC"])
        df_avg["Force"] = df["Force"].mean()
        df_avg["Current"] = round(df["Current"].mean(), 2)
        df_avg["Max Current"] = round(df["Current"].max(), 2)
        df_avg["Peak+"] = round(df["Peak+"].mean(), 2)
        df_avg["Peak-"] = round(df["Peak-"].mean(), 2)
        df_avg["PWM Duty Cycle"] = round(df["PWM Duty Cycle"].mean(), 2)
        df_avg["PWM Frequency"] = round(df["PWM Frequency"].mean(), 2)
        df_avg.reset_index(inplace=True)
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

    def current_pwm_plot(self):
        df = self.df_avg
        x_axis = "DC"
        y_axis = "Current"
        fig = px.line(df, x=x_axis, y=[y_axis], color="Vref", markers=True)
        fig.update_layout(
            xaxis_tickmode = 'linear',
            xaxis_tick0 = 0,
            xaxis_dtick = 10,
        )
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_current_pwm"
        self.plot_param["title"] = "Current vs. PWM Duty Cycle"
        self.plot_param["x_title"] = "Duty Cycle (%)"
        self.plot_param["y_title"] = "Average Current [RMS] (mA)"
        self.plot_param["x_range"] = [0, 100]
        self.plot_param["y_range"] = [50, 350]
        self.plot_param["legend"] = "Vref (V)"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

    def force_pwm_plot(self):
        df = self.df_avg
        x_axis = "DC"
        y_axis = "Force"
        fig = px.line(df, x=x_axis, y=[y_axis], color="Vref", markers=True)
        fig.update_layout(
            xaxis_tickmode = 'linear',
            xaxis_tick0 = 0,
            xaxis_dtick = 10,
        )
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_force_pwm"
        self.plot_param["title"] = "Force vs. PWM Duty Cycle"
        self.plot_param["x_title"] = "Duty Cycle (%)"
        self.plot_param["y_title"] = "Average Force (N)"
        self.plot_param["x_range"] = [0, 100]
        self.plot_param["y_range"] = [0, 35]
        self.plot_param["legend"] = "Vref (V)"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

    def avg_current_force_plot(self):
        df = self.df_avg
        x_axis = "Force"
        y_axis = "Current"
        fig = px.line(df, x=x_axis, y=[y_axis], color="Vref", markers=True)
        fig.update_layout(
            xaxis_tickmode = 'linear',
            xaxis_tick0 = 0,
            xaxis_dtick = 5,
        )
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_avg_current_force"
        self.plot_param["title"] = "Current vs. Force"
        self.plot_param["x_title"] = "Average Force (N)"
        self.plot_param["y_title"] = "Average Current [RMS] (mA)"
        self.plot_param["x_range"] = [0, 35]
        self.plot_param["y_range"] = [50, 350]
        self.plot_param["legend"] = "Vref (V)"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

    def max_current_force_plot(self):
        df = self.df_avg
        x_axis = "Force"
        y_axis = "Max Current"
        fig = px.line(df, x=x_axis, y=[y_axis], color="Vref", markers=True)
        fig.update_layout(
            xaxis_tickmode = 'linear',
            xaxis_tick0 = 0,
            xaxis_dtick = 5,
        )
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_max_current_force"
        self.plot_param["title"] = "Max Current vs. Force"
        self.plot_param["x_title"] = "Average Force (N)"
        self.plot_param["y_title"] = "Max Current [RMS] (mA)"
        self.plot_param["x_range"] = [0, 35]
        self.plot_param["y_range"] = [50, 350]
        self.plot_param["legend"] = "Vref (V)"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

    def peak_pwm_plot(self):
        df = self.df_avg
        max_vref = df["Vref"].max()
        df = df[df["Vref"]==max_vref]
        x_axis = "DC"
        y_axis = ["Peak+","Peak-"]
        fig1 = px.bar(df, x=x_axis, y=y_axis, barmode="group")
        fig2 = px.line(df, x=x_axis, y=["Current"], line_dash_sequence=["dash"], color_discrete_sequence=["black"], markers=True)
        self.set_legend(fig2, ["RMS"])
        subfig = make_subplots()
        subfig.add_traces(fig1.data + fig2.data)
        subfig.update_layout(
            xaxis_tickmode = 'linear',
            xaxis_tick0 = 0,
            xaxis_dtick = 10,
        )
        self.plot_param["figure"] = subfig
        self.plot_param["filename"] = "plot_peak_pwm"
        self.plot_param["title"] = f"Peak vs. PWM Duty Cycle @ Max Vref [{max_vref} V]"
        self.plot_param["x_title"] = "Duty Cycle (%)"
        self.plot_param["y_title"] = "Current [Peak] (mA)"
        self.plot_param["x_range"] = [0, 100]
        self.plot_param["y_range"] = [50, 450]
        self.plot_param["legend"] = "Current"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

if __name__ == '__main__':
    print("\nPlot Gripper Force Test Results\n")
    plot = Plot(sys.argv[1])
    plot.create_plot()
