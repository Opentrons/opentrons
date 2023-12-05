"""Plot Gripper Lifetime Force History."""
import os
import sys
import argparse
import pandas as pd
import plotly.express as px
from plotly.subplots import make_subplots

class Plot:
    def __init__(self, force, sensor):
        self.force = force
        self.sensor = sensor
        self.list_colors = px.colors.qualitative.Plotly
        self.list_dash = ['solid', 'dash']
        self.LIMIT = 1000
        self.PLOT_HEIGHT = 800
        self.PLOT_WIDTH = 1000
        self.PLOT_FONT = 16
        self.PLOT_PATH = "plot_gripper_history/"
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
        self.lifetime = [7.5, 15, 22.5, 52.5]
        self.years = self.get_years(self.lifetime)
        self.year_color = ["green", "yellow", "orange", "red"]
        self.year_period = [0,3,3,5,5,6,6,7]
        self.probes = ["Front","Rear"]
        self.contacts = ["Air","Deck"]
        self.df_force = self.import_file(self.force)
        self.df_sensor = self.import_file(self.sensor)

    def import_file(self, file):
        df = pd.read_csv(file)
        df.name = file
        return df

    def create_folder(self):
        path = self.PLOT_PATH.replace("/","")
        if not os.path.exists(path):
            os.makedirs(path)

    def get_years(self, lifetime):
        return [f"{i} Years" for i in lifetime]

    def create_plot(self):
        print("Plotting Force History...")
        self.gripper_force_history_plot()
        print("Plotting Sensor History...")
        self.gripper_sensor_history_plot()
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

    def add_years(self, fig):
        for i in range(len(self.years)):
            fig.add_vrect(
                x0=self.year_period[i*2], x1=self.year_period[(i*2)+1],
                annotation_text=self.years[i], annotation_position="top right",
                annotation=dict(font_size=20),
                fillcolor=self.year_color[i], opacity=0.2, line_width=0
            )

    def gripper_force_history_plot(self):
        df = self.df_force
        x_axis = "Period"
        y_axis = "Output Force"
        y_axis2 = "Input Force"
        fig1 = px.line(df, x=x_axis, y=[y_axis], color="Gripper", markers=True)
        fig2 = px.line(df, x=x_axis, y=[y_axis2], line_dash_sequence=["dash"], color_discrete_sequence=["red"])
        subfig = make_subplots()
        subfig.add_traces(fig1.data + fig2.data)
        self.add_years(subfig)
        self.plot_param["figure"] = subfig
        self.plot_param["filename"] = "plot_force_history"
        self.plot_param["title"] = "Gripper Lifetime Force History"
        self.plot_param["x_title"] = "Lifetime Period"
        self.plot_param["y_title"] = "Average Force (N)"
        self.plot_param["x_range"] = None
        self.plot_param["y_range"] = [10, 30]
        self.plot_param["legend"] = "Gripper"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

    def gripper_sensor_history_plot(self):
        df = self.df_sensor
        grippers = df["Gripper"].unique().tolist()
        x_axis = "Period"
        y_axis = "Capacitance"
        for gripper in grippers:
            df_gripper = df[df["Gripper"] == gripper]
            subfig = make_subplots()
            for i, probe in enumerate(self.probes):
                df_probe = df_gripper[df_gripper["Probe"] == probe]
                for j, contact in enumerate(self.contacts):
                    df_contact = df_probe[df_probe["Contact"] == contact]
                    fig = px.line(df_contact, x=x_axis, y=[y_axis], markers=True, color_discrete_sequence=self.list_colors[i:], line_dash_sequence=self.list_dash[j:])
                    self.set_legend(fig, [f"{probe} ({contact})"])
                    subfig.add_traces(fig.data)
            self.add_years(subfig)
            self.plot_param["figure"] = subfig
            self.plot_param["filename"] = f"plot_sensor_history_{gripper.lower()}"
            self.plot_param["title"] = f"Gripper Lifetime Sensor History ({gripper})"
            self.plot_param["x_title"] = "Lifetime Period"
            self.plot_param["y_title"] = "Average Capacitance (pF)"
            self.plot_param["x_range"] = None
            self.plot_param["y_range"] = [0, 14]
            self.plot_param["legend"] = "Probes"
            self.plot_param["annotation"] = None
            self.write_plot(self.plot_param)

if __name__ == '__main__':
    print("\nPlot Gripper Lifetime Force History\n")
    plot = Plot(sys.argv[1], sys.argv[2])
    plot.create_plot()
