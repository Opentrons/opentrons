"""Plot Capacitance Distance Test Results."""
import os
import sys
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
        self.PLOT_PATH = "plot_capacitance/"
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
        self.df_average = self.average_df(self.df_data)

    def import_file(self, file):
        df = pd.read_csv(file)
        initial_capacitance = round(df["Capacitance"].min(), 2)
        df["Relative"] = round((df["Capacitance"] - initial_capacitance) / initial_capacitance, 3)
        df["Z Position"] = round(df["Current Position"].str.strip(")(").str.split(";").str[-1].astype(float), 3)
        df["Z Encoder"] = round(df["Current Encoder"].str.strip("][").str.split(";").str[2].astype(float), 3)
        df.name = file
        return df

    def create_folder(self):
        path = self.PLOT_PATH.replace("/","")
        if not os.path.exists(path):
            os.makedirs(path)

    def create_plot(self):
        print("Plotting Sensor Data...")
        self.sensor_plot()
        print("Plotting Absolute Capacitance...")
        self.absolute_plot()
        print("Plotting Relative Capacitance...")
        self.relative_plot()
        print("Plotting Average Capacitance...")
        self.average_plot()
        print("Plotting Capacitance vs. Encoder...")
        self.encoder_cap_plot()
        print("Plotting Position vs. Encoder...")
        self.encoder_pos_plot()
        print("Plotting Deck...")
        self.deck_plot()
        print("Plots Saved!")

    def average_df(self, df):
        df_avg = df.groupby("Step", as_index=False)[["Capacitance","Relative","Z Position"]].mean()
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

    def sensor_plot(self):
        df = self.df_data
        x_axis = "Time"
        y_axis = "Capacitance"
        x_first = df[x_axis].min()
        x_last = df[x_axis].max()
        y_first = df[y_axis].min()
        y_last = df[y_axis].max()
        fig = px.line(df, x=x_axis, y=[y_axis], markers=True)
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_sensor"
        self.plot_param["title"] = "Sensor Data"
        self.plot_param["x_title"] = "Time (min)"
        self.plot_param["y_title"] = "Capacitance (pF)"
        self.plot_param["x_range"] = [0, x_last]
        self.plot_param["y_range"] = [0, 14]
        self.plot_param["legend"] = "Data"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

    def absolute_plot(self):
        df = self.df_data
        x_axis = "Z Position"
        y_axis = "Capacitance"
        x_first = df[x_axis].min()
        x_last = df[x_axis].max()
        y_first = df[y_axis].min()
        y_last = df[y_axis].max()
        fig = px.line(df, x=x_axis, y=[y_axis], color="Cycle", markers=True)
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_absolute"
        self.plot_param["title"] = "Absolute Capacitance Data"
        self.plot_param["x_title"] = "Z-Axis Position (mm)"
        self.plot_param["y_title"] = "Capacitance (pF)"
        self.plot_param["x_range"] = [0, x_last]
        self.plot_param["y_range"] = [0, 14]
        self.plot_param["legend"] = "Cycles"
        self.plot_param["annotation"] = None
        zoom_param = self.plot_param.copy()
        self.write_plot(self.plot_param)
        zoom_param["filename"] = "plot_absolute_zoom"
        zoom_param["title"] = "Absolute Capacitance Zoom Data"
        zoom_param["y_range"] = [4.3, 4.6]
        self.write_plot(zoom_param)

    def relative_plot(self):
        df = self.df_data
        x_axis = "Z Position"
        y_axis = "Relative"
        x_first = df[x_axis].min()
        x_last = df[x_axis].max()
        y_first = df[y_axis].min()
        y_last = df[y_axis].max()
        fig = px.line(df, x=x_axis, y=[y_axis], color="Cycle", markers=True)
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_relative"
        self.plot_param["title"] = "Relative Capacitance Data"
        self.plot_param["x_title"] = "Z-Axis Position (mm)"
        self.plot_param["y_title"] = "∆C/C<sub>O</sub>"
        self.plot_param["x_range"] = [0, x_last]
        self.plot_param["y_range"] = [0, 1.8]
        self.plot_param["legend"] = "Cycles"
        self.plot_param["annotation"] = None
        zoom_param = self.plot_param.copy()
        self.write_plot(self.plot_param)
        zoom_param["filename"] = "plot_relative_zoom"
        zoom_param["title"] = "Relative Capacitance Zoom Data"
        zoom_param["y_range"] = [0,0.05]
        self.write_plot(zoom_param)

    def average_plot(self):
        df = self.df_average
        x_axis = "Z Position"
        y_axis = "Relative"
        x_first = df[x_axis].min()
        x_last = df[x_axis].max()
        y_first = df[y_axis].min()
        y_last = df[y_axis].max()
        fig = px.line(df, x=x_axis, y=[y_axis], markers=True)
        fig.update_traces(
            marker={
                "size":10,
                "line":{"width":2, "color":"black"}
            }
        )
        self.set_legend(fig, ["Average"])
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_average"
        self.plot_param["title"] = "Average Relative Capacitance Data"
        self.plot_param["x_title"] = "Z-Axis Position (mm)"
        self.plot_param["y_title"] = "∆C/C<sub>O</sub>"
        self.plot_param["x_range"] = [0, x_last]
        self.plot_param["y_range"] = [0, 1.8]
        self.plot_param["legend"] = "Cycles"
        self.plot_param["annotation"] = None
        zoom_param = self.plot_param.copy()
        self.write_plot(self.plot_param)
        zoom_param["filename"] = "plot_average_zoom"
        zoom_param["title"] = "Average Relative Capacitance Zoom Data"
        zoom_param["y_range"] = [0,0.05]
        self.write_plot(zoom_param)

    def encoder_cap_plot(self):
        df = self.df_data
        x_axis = "Z Encoder"
        y_axis = "Capacitance"
        x_first = df[x_axis].min()
        x_last = df[x_axis].max()
        y_first = df[y_axis].min()
        y_last = df[y_axis].max()
        fig = px.line(df, x=x_axis, y=[y_axis], color="Cycle", markers=True)
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_encoder_cap"
        self.plot_param["title"] = "Capacitance vs. Encoder"
        self.plot_param["x_title"] = "Z-Axis Encoder (mm)"
        self.plot_param["y_title"] = "Capacitance (pF)"
        self.plot_param["x_range"] = [x_first, x_last]
        self.plot_param["y_range"] = [4.3, 4.6]
        self.plot_param["legend"] = "Cycles"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

    def encoder_pos_plot(self):
        df = self.df_data
        x_axis = "Z Encoder"
        y_axis = "Z Position"
        x_first = df[x_axis].min()
        x_last = df[x_axis].max()
        y_first = df[y_axis].min()
        y_last = df[y_axis].max()
        fig = px.line(df, x=x_axis, y=[y_axis], color="Cycle", markers=True)
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_encoder_pos"
        self.plot_param["title"] = "Position vs. Encoder"
        self.plot_param["x_title"] = "Z-Axis Encoder (mm)"
        self.plot_param["y_title"] = "Z-Axis Position (mm)"
        self.plot_param["x_range"] = [x_first, x_last]
        self.plot_param["y_range"] = [y_first, y_last]
        self.plot_param["legend"] = "Cycles"
        self.plot_param["annotation"] = None
        self.write_plot(self.plot_param)

    def deck_plot(self):
        df = self.df_data
        x_axis = "Cycle"
        y_axis = "Deck Height"
        x_first = df[x_axis].min()
        x_last = df[x_axis].max()
        y_first = df[y_axis].min()
        y_last = df[y_axis].max()

        z_min = df[y_axis].min()
        z_min_id = df[y_axis].idxmin()
        z_min_xpos = df.loc[z_min_id][x_axis].item()
        z_min_text = f"Z Min = {z_min}mm"

        z_max = df[y_axis].max()
        z_max_id = df[y_axis].idxmax()
        z_max_xpos = df.loc[z_max_id][x_axis].item()
        z_max_text = f"Z Max = {z_max}mm"

        annotation_zmin = self.set_annotation(z_min_xpos, z_min, z_min_text, ax_pos=-100, ay_pos=100)
        annotation_zmax = self.set_annotation(z_max_xpos, z_max, z_max_text, ax_pos=100, ay_pos=-100)
        fig = px.line(df, x=x_axis, y=[y_axis], markers=True)
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_deck"
        self.plot_param["title"] = "Deck Position Data"
        self.plot_param["x_title"] = "Cycle"
        self.plot_param["y_title"] = "Deck Height (mm)"
        self.plot_param["x_range"] = [x_first, x_last]
        self.plot_param["y_range"] = [0.1, 0.2]
        self.plot_param["legend"] = "Data"
        self.plot_param["annotation"] = [annotation_zmin, annotation_zmax]
        self.write_plot(self.plot_param)

if __name__ == '__main__':
    print("\nPlot Capacitance Distance Test Results\n")
    plot = Plot(sys.argv[1])
    plot.create_plot()
