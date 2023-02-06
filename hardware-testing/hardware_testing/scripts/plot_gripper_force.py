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
        self.titles = {
            "Input DC":"Input Duty Cycle (%)",
            "Input Force":"Input Force (N)",
        }
        self.ranges = {
            "Input DC":[10,60],
            "Input Force":[5,30],
            "Current":[50,450],
            "Force":[5,30],
        }
        self.dticks = {
            "Input DC":10,
            "Input Force":5,
        }
        self.create_folder()
        self.df_data = self.import_file(self.data)
        self.input = self.get_input(self.df_data)
        self.df_avg = self.avg_df(self.df_data)

    def import_file(self, file):
        df = pd.read_csv(file)
        df["Current"] = df["RMS"]*1000
        df["Peak+"] = df["Peak Plus"]*1000
        df["Peak-"] = df["Peak Minus"]*1000
        df["Frequency"] = df["PWM Frequency"]/1000
        df.name = file
        return df

    def create_folder(self):
        path = self.PLOT_PATH.replace("/","")
        if not os.path.exists(path):
            os.makedirs(path)

    def create_plot(self):
        print("Plotting Trial Data...")
        self.trial_plot(1)
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
        print("Plotting PWM Frequency vs. PWM DC...")
        self.freq_pwm_plot()
        # if self.input == "Input DC":
        #     print("Plotting Force Polynomial...")
        #     self.force_poly_plot(2.0)
        print("Plots Saved!")

    def get_input(self, df):
        if df["Input DC"].iloc[0] > 0:
            return "Input DC"
        else:
            return "Input Force"

    def avg_df(self, df):
        df_avg = pd.DataFrame()
        df = df.groupby(["Vref", self.input])
        df_avg["Force"] = round(df["Force"].mean(), 2)
        df_avg["Current"] = round(df["Current"].mean(), 2)
        df_avg["Min Current"] = round(df["Current"].min(), 2)
        df_avg["Max Current"] = round(df["Current"].max(), 2)
        df_avg["Peak+"] = round(df["Peak+"].mean(), 2)
        df_avg["Peak-"] = round(df["Peak-"].mean(), 2)
        df_avg["Duty Cycle"] = round(df["PWM Duty Cycle"].mean(), 2)
        df_avg["Frequency"] = round(df["Frequency"].mean(), 2)
        df_avg.reset_index(inplace=True)
        if self.input == "Input DC":
            df_avg["Polynomial"] = round(0.0017*pow(df_avg[self.input], 2) + 0.3531*df_avg[self.input] + 1.5, 2)
        return df_avg

    def set_legend(self, figure, legend):
        for idx, name in enumerate(legend):
            figure.data[idx].name = name
            figure.data[idx].hovertemplate = name
            figure.data[idx].showlegend = True

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

    def trial_plot(self, cycle):
        df = self.df_data
        df = df[df["Cycle"]==cycle]
        dc = df[self.input].iloc[0]
        x_axis = "Trial"
        fig1 = px.line(df, x=x_axis, y=["Force"], markers=True, color_discrete_sequence=self.list_colors[0:])
        fig2 = px.line(df, x=x_axis, y=["Current"], markers=True, color_discrete_sequence=self.list_colors[1:])
        fig2.update_traces(yaxis="y2")
        subfig = make_subplots(specs=[[{"secondary_y": True}]])
        subfig.add_traces(fig1.data + fig2.data)
        subfig.update_layout(
            yaxis_tickmode = 'linear',
            yaxis_dtick = 2.5,
            yaxis2_tickmode = 'linear',
            yaxis2_dtick = 40,
        )
        self.plot_param["figure"] = subfig
        self.plot_param["filename"] = "plot_trial"
        self.plot_param["title"] = f"Trial Data (Input = {dc}%)"
        self.plot_param["x_title"] = "Trial Number"
        self.plot_param["y_title"] = "Measured Force (N)"
        self.plot_param["y2_title"] = "Measured Current [RMS] (mA)"
        self.plot_param["x_range"] = [0, 20]
        self.plot_param["y_range"] = [25, 35]
        self.plot_param["y2_range"] = [160, 480]
        self.plot_param["legend"] = "Data"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

    def current_pwm_plot(self):
        df = self.df_avg
        df = df[df["Vref"]==2.0]
        df = df[df[self.input]<=60]
        x_axis = self.input
        y_axis = "Current"
        fig = px.line(df, x=x_axis, y=[y_axis], color="Vref", markers=True)
        fig.update_layout(
            xaxis_tickmode = 'linear',
            xaxis_tick0 = 0,
            xaxis_dtick = self.dticks[self.input],
        )
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_current_pwm"
        self.plot_param["title"] = f"Current vs. {self.input}"
        self.plot_param["x_title"] = self.titles[self.input]
        self.plot_param["y_title"] = "Average Current [RMS] (mA)"
        self.plot_param["x_range"] = self.ranges[self.input]
        self.plot_param["y_range"] = self.ranges["Current"]
        self.plot_param["legend"] = "Vref (V)"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

    def force_pwm_plot(self):
        df = self.df_avg
        # df = df[df["Vref"]==2.0]
        # df = df[df[self.input]<=60]
        x_axis = self.input
        y_axis = "Force"
        fig = px.line(df, x=x_axis, y=[y_axis], color="Vref", markers=True)
        fig.update_layout(
            xaxis_tickmode = 'linear',
            xaxis_tick0 = 0,
            xaxis_dtick = self.dticks[self.input],
        )
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_force_pwm"
        self.plot_param["title"] = f"Force vs. {self.input}"
        self.plot_param["x_title"] = self.titles[self.input]
        self.plot_param["y_title"] = "Average Force (N)"
        self.plot_param["x_range"] = self.ranges[self.input]
        self.plot_param["y_range"] = self.ranges["Force"]
        self.plot_param["legend"] = "Vref (V)"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

    def force_poly_plot(self, vref):
        df = self.df_avg
        df = df[df["Vref"]==vref]
        df = df[df[self.input]<=60]
        x_axis = self.input
        y_axis = "Force"
        poly = "Polynomial"

        df_table = df[[x_axis, y_axis, poly]].copy()
        df_table.set_index(x_axis, inplace=True)
        df_table.to_csv(self.PLOT_PATH + "force-pwm.csv")

        poly_xpos = 35
        poly_id = df.index[df[x_axis] == poly_xpos].tolist()
        poly_ypos = df.loc[poly_id]["Polynomial"].item()
        poly_text = "y = 0.0017x<sup>2</sup> + 0.3531x + 1.5"

        annotation_poly = self.set_annotation(poly_xpos, poly_ypos, poly_text, ax_pos=-100, ay_pos=-100)

        fig1 = px.line(df, x=x_axis, y=[y_axis], markers=True)
        fig2 = px.line(df, x=x_axis, y=[poly], line_dash_sequence=["dash"], color_discrete_sequence=["red"])
        self.set_legend(fig1, ["Measured Force"])
        subfig = make_subplots()
        subfig.add_traces(fig1.data + fig2.data)
        subfig.update_layout(
            xaxis_tickmode = 'linear',
            xaxis_tick0 = 0,
            xaxis_dtick = 10,
        )
        self.plot_param["figure"] = subfig
        self.plot_param["filename"] = "plot_force_poly"
        self.plot_param["title"] = f"Force vs. PWM Duty Cycle (Vref = {vref}V)"
        self.plot_param["x_title"] = self.titles[self.input]
        self.plot_param["y_title"] = "Average Force (N)"
        self.plot_param["x_range"] = self.ranges[self.input]
        self.plot_param["y_range"] = self.ranges["Force"]
        self.plot_param["legend"] = "Data"
        self.plot_param["annotation"] = [annotation_poly]
        self.write_plot(self.plot_param)

    def avg_current_force_plot(self):
        df = self.df_avg
        df = df[df["Vref"]==2.0]
        df = df[df["Force"]<=31]
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
        self.plot_param["x_range"] = self.ranges["Force"]
        self.plot_param["y_range"] = self.ranges["Current"]
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
        self.plot_param["x_range"] = self.ranges["Force"]
        self.plot_param["y_range"] = self.ranges["Current"]
        self.plot_param["legend"] = "Vref (V)"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

    def peak_pwm_plot(self):
        df = self.df_avg
        # max_vref = df["Vref"].max()
        max_vref = 2.0
        df = df[df["Vref"]==max_vref]
        df = df[df[self.input]<=60]
        x_axis = self.input
        y_axis = ["Peak+","Peak-"]
        fig1 = px.bar(df, x=x_axis, y=y_axis, barmode="group")
        fig2 = px.line(df, x=x_axis, y=["Current"], line_dash_sequence=["dash"], color_discrete_sequence=["black"], markers=True)
        self.set_legend(fig2, ["RMS"])
        subfig = make_subplots()
        subfig.add_traces(fig1.data + fig2.data)
        subfig.update_layout(
            xaxis_tickmode = 'linear',
            xaxis_tick0 = 0,
            xaxis_dtick = self.dticks[self.input]
        )
        self.plot_param["figure"] = subfig
        self.plot_param["filename"] = "plot_peak_pwm"
        self.plot_param["title"] = f"Peak vs. {self.input} @ Max Vref [{max_vref} V]"
        self.plot_param["x_title"] = self.titles[self.input]
        self.plot_param["y_title"] = "Current [Peak] (mA)"
        self.plot_param["x_range"] = [0, max(self.ranges[self.input])+min(self.ranges[self.input])]
        self.plot_param["y_range"] = [0, 600]
        self.plot_param["legend"] = "Current"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

    def freq_pwm_plot(self):
        df = self.df_avg
        x_axis = self.input
        y_axis = "Frequency"
        avg_freq = df[df[self.input]<=95]["Frequency"].mean()
        fig1 = px.scatter(df, x=x_axis, y=[y_axis], color="Vref")
        fig2 = px.line(x=[0, 100], y=[avg_freq, avg_freq], line_dash_sequence=["dash"], color_discrete_sequence=["black"])
        fig1.update_traces(
            marker={
                "size":10,
                "line":{"width":2, "color":"black"}
            }
        )
        subfig = make_subplots()
        subfig.add_traces(fig1.data + fig2.data)
        subfig.update_layout(
            xaxis_tickmode = 'linear',
            xaxis_tick0 = 0,
            xaxis_dtick = 10,
        )
        subfig.update_coloraxes(
            colorbar_title_text = "Vref (V)",
            cmax = 2.7,
            cmin = 1.0,
        )
        self.plot_param["figure"] = subfig
        self.plot_param["filename"] = "plot_freq_pwm"
        self.plot_param["title"] = f"PWM Frequency vs. PWM Duty Cycle"
        self.plot_param["x_title"] = self.titles[self.input]
        self.plot_param["y_title"] = "Measured Frequency (kHz)"
        self.plot_param["x_range"] = self.ranges[self.input]
        self.plot_param["y_range"] = [32, 32.2]
        self.plot_param["legend"] = "Vref (V)"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

if __name__ == '__main__':
    print("\nPlot Gripper Force Test Results\n")
    plot = Plot(sys.argv[1])
    plot.create_plot()
