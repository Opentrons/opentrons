"""Plot Capacitive Probe Test Results."""
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
        self.PLOT_PATH = "plot_probe/"
        self.PLOT_FORMAT = ".png"
        self.plot_param = {
            "figure":None,
            "filename":None,
            "title":None,
            "x_title":None,
            "y_title":None,
            "x_range":None,
            "y_range":None,
            "legend":None,
            "annotation":None
        }
        self.create_folder()
        self.df_data = self.import_file(self.data)

    def import_file(self, file):
        df = pd.read_csv(file)
        df.name = file
        # df["Time"] = df["Time"]/60
        # df["X Center"] = round(df["X Left"] + (df["X Right"] - df["X Left"])/2, 3)
        # df["Y Center"] = round(df["Y Front"] + (df["Y Back"] - df["Y Front"])/2, 3)
        # df.to_csv("capacitive_probe_test_run-221031172003_slot5.csv", index=False)
        return df

    def create_folder(self):
        path = self.PLOT_PATH.replace("/","")
        if not os.path.exists(path):
            os.makedirs(path)

    def create_plot(self):
        list_data = list(self.df_data.columns)
        for data in list_data:
            if "Time" in data or "Cycle" in data:
                pass
            else:
                print(f"Plotting {data}...")
                if "Center" in data:
                    self.center_plot()
                else:
                    self.data_plot(data)
        print("Plots Saved!")

    def set_legend(self, figure, legend):
        for idx, name in enumerate(legend):
            figure.data[idx].name = name
            figure.data[idx].hovertemplate = name

    def set_annotation(self, x_pos, y_pos, text, ax_pos=0, ay_pos=0):
        annotation = {
            "x":x_pos,
            "y":y_pos,
            "ax":ax_pos,
            "ay":ay_pos,
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
        fig.write_image(self.PLOT_PATH + param["filename"] + self.PLOT_FORMAT)

    def data_plot(self, data):
        df = self.df_data
        x_axis = "Time"
        y_axis = [data]
        x_first = df[x_axis].iloc[0]
        x_last = df[x_axis].iloc[-1]
        y_avg = round(df[data].mean(), 3)
        min_id = df[y_axis].min(axis=1).idxmin()
        min_pos = df[y_axis].min().min()
        min_time = df.loc[min_id][x_axis].item()
        min_text = f"Min = {min_pos}mm"
        max_id = df[y_axis].max(axis=1).idxmax()
        max_pos = df[y_axis].max().max()
        max_time = df.loc[max_id][x_axis].item()
        max_text = f"Max = {max_pos}mm"
        annotation_min = self.set_annotation(min_time, min_pos, min_text, ay_pos=50)
        annotation_max = self.set_annotation(max_time, max_pos, max_text, ay_pos=-50)
        fig = px.line(df, x=x_axis, y=y_axis, markers=True)
        self.plot_param["figure"] = fig
        self.plot_param["filename"] = "plot_" + data.replace(" ", "_").lower()
        self.plot_param["title"] = f"{data} Data"
        self.plot_param["x_title"] = "Time (min)"
        self.plot_param["y_title"] = "Position (mm)"
        self.plot_param["x_range"] = [0, x_last]
        self.plot_param["y_range"] = [y_avg-1, y_avg+1]
        self.plot_param["legend"] = "Data"
        self.plot_param["annotation"] = [annotation_min, annotation_max]
        self.write_plot(self.plot_param)

    def center_plot(self):
        df = self.df_data
        x_data = "X Center"
        y_data = "Y Center"
        x_axis = x_data
        y_axis = [y_data]
        x_avg = round(df["X Center"].mean(), 3)
        y_avg = round(df["Y Center"].mean(), 3)

        x_min = df[x_data].min()
        x_min_id = df[x_data].idxmin()
        x_min_ypos = df.loc[x_min_id][y_data].item()
        x_min_text = f"X Min = {x_min}mm"

        x_max = df[x_data].max()
        x_max_id = df[x_data].idxmax()
        x_max_ypos = df.loc[x_max_id][y_data].item()
        x_max_text = f"X Max = {x_max}mm"

        y_min = df[y_data].min()
        y_min_id = df[y_data].idxmin()
        y_min_xpos = df.loc[y_min_id][x_data].item()
        y_min_text = f"Y Min = {y_min}mm"

        y_max = df[y_data].max()
        y_max_id = df[y_data].idxmax()
        y_max_xpos = df.loc[y_max_id][x_data].item()
        y_max_text = f"Y Max = {y_max}mm"

        annotation_xmin = self.set_annotation(x_min, x_min_ypos, x_min_text, ax_pos=-200)
        annotation_xmax = self.set_annotation(x_max, x_max_ypos, x_max_text, ax_pos=200)
        annotation_ymin = self.set_annotation(y_min_xpos, y_min, y_min_text, ay_pos=50)
        annotation_ymax = self.set_annotation(y_max_xpos, y_max, y_max_text, ay_pos=-50)

        fig1 = px.scatter(df, x=x_axis, y=y_axis, color_discrete_sequence=self.list_colors[0:])
        fig2 = px.scatter(x=[x_avg,x_avg], y=[[y_avg,y_avg]], color_discrete_sequence=self.list_colors[1:])
        fig1.update_traces(
            marker={
                "size":10,
                "line":{"width":2, "color":"black"}
            }
        )
        fig2.update_traces(
            marker={
                "size":10,
                "symbol":"diamond",
                "line":{"width":2, "color":"black"}
            }
        )
        self.set_legend(fig1, ["XY Center"])
        self.set_legend(fig2, ["Average"])
        subfig = make_subplots()
        subfig.add_traces(fig1.data + fig2.data)
        self.plot_param["figure"] = subfig
        self.plot_param["filename"] = "plot_center"
        self.plot_param["title"] = "XY Center Data"
        self.plot_param["x_title"] = "X Position (mm)"
        self.plot_param["y_title"] = "Y Position (mm)"
        self.plot_param["x_range"] = [x_avg-1, x_avg+1]
        self.plot_param["y_range"] = [y_avg-1, y_avg+1]
        self.plot_param["legend"] = "Data"
        self.plot_param["annotation"] = [annotation_xmin, annotation_xmax, annotation_ymin, annotation_ymax]
        self.write_plot(self.plot_param)

if __name__ == '__main__':
    print("\nPlot Capacitive Probe Test Results\n")
    plot = Plot(sys.argv[1])
    plot.create_plot()
