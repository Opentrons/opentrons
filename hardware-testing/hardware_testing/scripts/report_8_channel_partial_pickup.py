import os
import sys
import pandas as pd
import plotly.express as px
from plotly.subplots import make_subplots

class Eight_Channel_Partial_Report:
    def __init__(self):
        self.DATA_PATH = "data"
        self.REPORT_PATH = "report"
        self.cycles = None
        self.df_data = None
        self.df_report = None
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
        self.report_file = "eight_channel_partial_tip_report"
        self.tip_length = {
            "T1K":95.7,
            "T200":58.35,
            "T50":57.9,
        }
        self.test_type = ["Leak","Feel"]

    def create_folder(self):
        path = self.REPORT_PATH
        if not os.path.exists(path):
            os.makedirs(path)

    def import_file(self, file):
        df = pd.read_csv(file)
        df.name = file
        pipette_type = df.name.split("_")[-6]
        tip_size = df.name.split("_")[-5]
        volume = df.name.split("_")[-4]
        motor_current = int(df.name.split("_")[-2].replace("C",""))
        df["Pipette Type"] = pipette_type
        df["Tip Size"] = tip_size
        df["Current"] = motor_current
        max_cycle = df["Cycle"].max()
        for i in range(max_cycle):
            cycle = i + 1
            leak_result = df.loc[(df["Cycle"]==cycle) & (df["Leak"] > 0)]["Leak"].values[0]
            feel_result = df.loc[(df["Cycle"]==cycle) & (df["Feel"] > 0)]["Feel"].values[0]
            max_position = df.loc[df["Cycle"]==cycle, "Z Gauge"].max()
            min_position = df.loc[df["Cycle"]==cycle, "Z Gauge"].min()
            df.loc[df["Cycle"]==cycle, "Variance"] = max_position - min_position
            df.loc[df["Cycle"]==cycle, "Leak"] = leak_result
            df.loc[df["Cycle"]==cycle, "Feel"] = feel_result
        return df

    def import_data(self):
        path = self.DATA_PATH
        df = pd.DataFrame()
        files = 0
        for file in os.listdir(path):
            files = files + 1
            if file.lower().endswith('.csv'):
                csv = os.path.join(path, file)
                data = self.import_file(csv)
                df = pd.concat([df, data], ignore_index=True)
        self.cycles = int(df["Cycle"].max())
        print(f"\nProcessed {files} files!\n")
        return df

    def setup_report(self):
        self.create_folder()
        self.df_data = self.import_data()
        self.df_report = self.create_report(self.df_data)

    def create_report(self, df):
        report = df.copy()
        drop_columns = ["Time","Gauge Slot","Tiprack Slot","Pipette","Speed"]
        sort_columns = ["Pipette Type","Tip Size","Nozzles","Current","Cycle","Tip"]
        report.drop(columns=drop_columns, inplace=True)
        pipette_type = report.pop("Pipette Type")
        tip_size = report.pop("Tip Size")
        nozzles = report.pop("Nozzles")
        current = report.pop("Current")
        cycle = report.pop("Cycle")
        tip = report.pop("Tip")
        report.insert(0, "Pipette Type", pipette_type)
        report.insert(1, "Tip Size", tip_size)
        report.insert(2, "Nozzles", nozzles)
        report.insert(3, "Current", current)
        report.insert(4, "Cycle", cycle)
        report.insert(5, "Tip", tip)
        for test in self.test_type:
            report[test] = report[test].astype(int)
            report[test] = report[test].replace(1, "Pass")
            report[test] = report[test].replace(2, "Fail")
        report["Leak"] = report.pop("Leak")
        report["Feel"] = report.pop("Feel")
        report.drop_duplicates(inplace=True)
        report.sort_values(by=sort_columns, inplace=True)
        report.reset_index(drop=True, inplace=True)
        print(report)
        return report

    def print_report(self):
        if self.df_report is not None:
            self.df_report.to_csv(f"{self.REPORT_PATH}/{self.report_file}.csv", index=False, float_format="%.3f")

    def save_report(self):
        print("\nGenerating report...")
        self.setup_report()
        print("Exporting report...")
        self.print_report()
        print("Report Saved!")

if __name__ == '__main__':
    report = Eight_Channel_Partial_Report()
    report.save_report()
