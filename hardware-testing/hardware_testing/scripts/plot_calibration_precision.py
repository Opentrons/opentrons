"""Plot Calibration Precision Test Results."""
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
        self.PLOT_PATH = "plot_precision/"
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

    def import_file(self, file):
        df = pd.read_csv(file)
        df.name = file
        return df

    def create_folder(self):
        path = self.PLOT_PATH.replace("/","")
        if not os.path.exists(path):
            os.makedirs(path)

    def create_plot(self):
        print("Plotting Gauges...")
        self.gauge_plot()
        print("Plotting Encoders...")
        self.encoder_plot()
        print("Plotting Positions...")
        self.position_plot()
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

    def gauge_plot(self):
        df = self.df_data
        x_axis = "Time"
        y_axis = ["X Gauge","Y Gauge"]
        x_first = df[x_axis].iloc[0]
        x_last = df[x_axis].iloc[-1]

        x_min = df[y_axis[0]].min()
        x_min_id = df[y_axis[0]].idxmin()
        x_min_xpos = df.loc[x_min_id][x_axis].item()
        x_min_text = f"X Min = {x_min}mm"

        x_max = df[y_axis[0]].max()
        x_max_id = df[y_axis[0]].idxmax()
        x_max_xpos = df.loc[x_max_id][x_axis].item()
        x_max_text = f"X Max = {x_max}mm"

        y_min = df[y_axis[1]].min()
        y_min_id = df[y_axis[1]].idxmin()
        y_min_xpos = df.loc[y_min_id][x_axis].item()
        y_min_text = f"Y Min = {y_min}mm"

        y_max = df[y_axis[1]].max()
        y_max_id = df[y_axis[1]].idxmax()
        y_max_xpos = df.loc[y_max_id][x_axis].item()
        y_max_text = f"Y Max = {y_max}mm"

        annotation_xmin = self.set_annotation(x_min_xpos, x_min, x_min_text, ax_pos=-100, ay_pos=50)
        annotation_xmax = self.set_annotation(x_max_xpos, x_max, x_max_text, ax_pos=-100, ay_pos=-50)
        annotation_ymin = self.set_annotation(y_min_xpos, y_min, y_min_text, ax_pos=-100, ay_pos=50, y_ref="y2")
        annotation_ymax = self.set_annotation(y_max_xpos, y_max, y_max_text, ax_pos=-100, ay_pos=50, y_ref="y2")

        fig1 = px.line(df, x=x_axis, y=[y_axis[0]], markers=True, color_discrete_sequence=self.list_colors[0:])
        fig2 = px.line(df, x=x_axis, y=[y_axis[1]], markers=True, color_discrete_sequence=self.list_colors[1:])
        fig2.update_traces(yaxis="y2")
        subfig = make_subplots(specs=[[{"secondary_y": True}]])
        subfig.add_traces(fig1.data + fig2.data)
        self.plot_param["figure"] = subfig
        self.plot_param["filename"] = "plot_gauges"
        self.plot_param["title"] = f"Gauge Data"
        self.plot_param["x_title"] = "Time (min)"
        self.plot_param["y_title"] = "X Gauge (mm)"
        self.plot_param["y2_title"] = "Y Gauge (mm)"
        self.plot_param["x_range"] = [0, x_last]
        self.plot_param["y_range"] = [5.85,5.91]
        self.plot_param["y2_range"] = [9.28,9.34]
        self.plot_param["legend"] = "Gauges"
        self.plot_param["annotation"] = [annotation_xmin, annotation_xmax, annotation_ymin, annotation_ymax]
        self.write_plot(self.plot_param)

    def encoder_plot(self):
        df = self.df_data
        x_axis = "Time"
        df["X Encoder"] = df["Slot Center Encoder"].str.strip("][").str.split(";").str[0].astype(float)
        df["Y Encoder"] = df["Slot Center Encoder"].str.strip("][").str.split(";").str[1].astype(float)
        y_axis = ["X Encoder","Y Encoder"]
        x_first = df[x_axis].iloc[0]
        x_last = df[x_axis].iloc[-1]

        x_min = df[y_axis[0]].min()
        x_min_id = df[y_axis[0]].idxmin()
        x_min_xpos = df.loc[x_min_id][x_axis].item()
        x_min_text = f"X Min = {x_min}mm"

        x_max = df[y_axis[0]].max()
        x_max_id = df[y_axis[0]].idxmax()
        x_max_xpos = df.loc[x_max_id][x_axis].item()
        x_max_text = f"X Max = {x_max}mm"

        y_min = df[y_axis[1]].min()
        y_min_id = df[y_axis[1]].idxmin()
        y_min_xpos = df.loc[y_min_id][x_axis].item()
        y_min_text = f"Y Min = {y_min}mm"

        y_max = df[y_axis[1]].max()
        y_max_id = df[y_axis[1]].idxmax()
        y_max_xpos = df.loc[y_max_id][x_axis].item()
        y_max_text = f"Y Max = {y_max}mm"

        annotation_xmin = self.set_annotation(x_min_xpos, x_min, x_min_text, ax_pos=100, ay_pos=50)
        annotation_xmax = self.set_annotation(x_max_xpos, x_max, x_max_text, ax_pos=-100, ay_pos=-50)
        annotation_ymin = self.set_annotation(y_min_xpos, y_min, y_min_text, ax_pos=100, ay_pos=50, y_ref="y2")
        annotation_ymax = self.set_annotation(y_max_xpos, y_max, y_max_text, ax_pos=-100, ay_pos=-50, y_ref="y2")

        fig1 = px.line(df, x=x_axis, y=[y_axis[0]], markers=True, color_discrete_sequence=self.list_colors[0:])
        fig2 = px.line(df, x=x_axis, y=[y_axis[1]], markers=True, color_discrete_sequence=self.list_colors[1:])
        fig2.update_traces(yaxis="y2")
        subfig = make_subplots(specs=[[{"secondary_y": True}]])
        subfig.add_traces(fig1.data + fig2.data)
        self.plot_param["figure"] = subfig
        self.plot_param["filename"] = "plot_encoders"
        self.plot_param["title"] = f"Encoder Data"
        self.plot_param["x_title"] = "Time (min)"
        self.plot_param["y_title"] = "X Encoder (mm)"
        self.plot_param["y2_title"] = "Y Encoder (mm)"
        self.plot_param["x_range"] = [0, x_last]
        # self.plot_param["y_range"] = [53.04,53.07]
        self.plot_param["y_range"] = [53.16,53.21]
        self.plot_param["y2_range"] = [31.52,31.6]
        self.plot_param["legend"] = "Encoders"
        self.plot_param["annotation"] = [annotation_xmin, annotation_xmax, annotation_ymin, annotation_ymax]
        self.write_plot(self.plot_param)

    def position_plot(self):
        df = self.df_data
        x_axis = "Time"
        df["X Position"] = round(df["Slot Center Position"].str.strip(")(").str.split(";").str[0].astype(float), 3)
        df["Y Position"] = round(df["Slot Center Position"].str.strip(")(").str.split(";").str[1].astype(float), 3)
        y_axis = ["X Position","Y Position"]
        x_first = df[x_axis].iloc[0]
        x_last = df[x_axis].iloc[-1]

        x_min = df[y_axis[0]].min()
        x_min_id = df[y_axis[0]].idxmin()
        x_min_xpos = df.loc[x_min_id][x_axis].item()
        x_min_text = f"X Min = {x_min}mm"

        x_max = df[y_axis[0]].max()
        x_max_id = df[y_axis[0]].idxmax()
        x_max_xpos = df.loc[x_max_id][x_axis].item()
        x_max_text = f"X Max = {x_max}mm"

        y_min = df[y_axis[1]].min()
        y_min_id = df[y_axis[1]].idxmin()
        y_min_xpos = df.loc[y_min_id][x_axis].item()
        y_min_text = f"Y Min = {y_min}mm"

        y_max = df[y_axis[1]].max()
        y_max_id = df[y_axis[1]].idxmax()
        y_max_xpos = df.loc[y_max_id][x_axis].item()
        y_max_text = f"Y Max = {y_max}mm"

        annotation_xmin = self.set_annotation(x_min_xpos, x_min, x_min_text, ax_pos=100, ay_pos=50)
        annotation_xmax = self.set_annotation(x_max_xpos, x_max, x_max_text, ax_pos=-100, ay_pos=-50)
        annotation_ymin = self.set_annotation(y_min_xpos, y_min, y_min_text, ax_pos=-100, ay_pos=50, y_ref="y2")
        annotation_ymax = self.set_annotation(y_max_xpos, y_max, y_max_text, ax_pos=-100, ay_pos=-50, y_ref="y2")

        fig1 = px.line(df, x=x_axis, y=[y_axis[0]], markers=True, color_discrete_sequence=self.list_colors[0:])
        fig2 = px.line(df, x=x_axis, y=[y_axis[1]], markers=True, color_discrete_sequence=self.list_colors[1:])
        fig2.update_traces(yaxis="y2")
        subfig = make_subplots(specs=[[{"secondary_y": True}]])
        subfig.add_traces(fig1.data + fig2.data)
        self.plot_param["figure"] = subfig
        self.plot_param["filename"] = "plot_positions"
        self.plot_param["title"] = f"Position Data"
        self.plot_param["x_title"] = "Time (min)"
        self.plot_param["y_title"] = "X Position (mm)"
        self.plot_param["y2_title"] = "Y Position (mm)"
        self.plot_param["x_range"] = [0, x_last]
        self.plot_param["y_range"] = [62.57,62.63]
        self.plot_param["y2_range"] = [40.35,40.42]
        self.plot_param["legend"] = "Gantry"
        self.plot_param["annotation"] = [annotation_xmin, annotation_xmax, annotation_ymin, annotation_ymax]
        self.write_plot(self.plot_param)

if __name__ == '__main__':
    print("\nPlot Calibration Precision Test Results\n")
    plot = Plot(sys.argv[1])
    plot.create_plot()
