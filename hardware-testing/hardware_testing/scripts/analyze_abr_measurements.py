from ast import Try
import sys, os, time, datetime
from hardware_testing import data
import csv

if __name__ == "__main__":
    df = pd.DataFrame()
    test_type_list = {"E", "P"}

    # Gets the current working directory
    current_working_directory = os.getcwd()
    test_type = input("Test Type (E/P): ")

    while test_type not in test_type_list:
        print(f"Your input was: {test_type}. Expected input was {test_type_list}")
        test_type = input("Test Type (E/P): ")
    if test_type == "E":
        subfolder = "Evaporation Results/"
    elif test_type == "P":
        subfolder = "Protocol Results/"
    new_folder_path = os.path.join(current_working_directory, subfolder)
    folders_in_directory = os.listdir(new_folder_path)
    analysis_folder = input(
        f"Desired Folder, Available Folders: {folders_in_directory} "
    )
    analysis_folder_path = os.path.join(new_folder_path, analysis_folder)
    analysis_results_folder = os.path.join(analysis_folder_path, "Results")
    if not os.path.exists(analysis_results_folder):
        os.makedirs(analysis_results_folder)
    final_df = pd.DataFrame()
    i = 0
    for filename in os.listdir(analysis_folder_path):
        if filename.endswith(".csv"):
            if "copy" in filename:
                raise ValueError(
                    "Error: Filename contains the string 'copy'. Please rename file."
                )
            path = os.path.join(analysis_folder_path, filename)
            df = pd.read_csv(path)
            date, robot, step, sample = filename.split("_")[:4]
            sample = sample.split(".")[0]
            df["Sample Name"] = filename
            sample_num = filename.split("_")[2].split(".")[0]
            df["Date"] = pd.to_datetime(df["Date"])
            duration = (df["Date"].iloc[-1] - df["Date"].iloc[0]).total_seconds()
            mass_stable = df.loc[df["Stable"] == 1, "Scale Reading"].iloc[0]
            date = str(df["Date"][0]).split(" ")[0]
            df_summary = pd.DataFrame(
                {
                    "Date": date,
                    "File Name": filename,
                    "Plate State": step,
                    "Robot": robot,
                    "Stabilization Duration (sec)": duration,
                    "Mass (g)": mass_stable,
                    "Sample": sample,
                },
                index=[i],
            )
            final_df = pd.concat([df_summary, final_df])
            i = i + 1

    # Pivot the DataFrame
    pivoted_df = final_df.pivot_table(
        index=["Date", "Robot", "Sample"],
        columns="Plate State",
        values=["Mass (g)"],
        aggfunc="first",
    ).reset_index()

    # Flatten the MultiIndex columns
    pivoted_df.columns = [
        f"{col[0]}_{col[1]}" if col[1] else col[0] for col in pivoted_df.columns
    ]
    pivoted_df = pivoted_df.rename(
        columns={
            "Mass (g)_1": "Empty Plate Mass (g)",
            "Mass (g)_2": "PreRun Mass (g)",
            "Mass (g)_3": "PostRun Mass (g)",
        }
    )
    pivoted_df["PreRun Mass (g)"].fillna(
        pivoted_df["Empty Plate Mass (g)"], inplace=True
    )
    # If mass 2 is missing fill with mass 1 bc no liquid added
    if test_type == "P":
        # Add columns
        pivoted_df["PreRun Liquid (uL)"] = 1000 * (
            pivoted_df["PreRun Mass (g)"] - pivoted_df["Empty Plate Mass (g)"]
        )
        pivoted_df["PostRun Liquid (uL)"] = 1000 * (
            pivoted_df["PostRun Mass (g)"] - pivoted_df["Empty Plate Mass (g)"]
        )
        pivoted_df["Liquid Moved (uL)"] = (
            pivoted_df["PostRun Liquid (uL)"] - pivoted_df["PreRun Liquid (uL)"]
        )
        pivoted_df["Expected (uL)"] = " "
        pivoted_df["Setup Error (uL)"] = " "
        pivoted_df["Software"] = " "
        pivoted_df["Protocol"] = " "
        pivoted_df["Labware Type"] = " "
        pivoted_df = pivoted_df[
            [
                "Date",
                "Robot",
                "Software",
                "Protocol",
                "Labware Type",
                "Sample",
                "Empty Plate Mass (g)",
                "PreRun Mass (g)",
                "PreRun Liquid (uL)",
                "Expected (uL)",
                "Setup Error (uL)",
                "PostRun Mass (g)",
                "PostRun Liquid (uL)",
                "Liquid Moved (uL)",
            ]
        ]
    else:
        print("Evaporation Runs")
    # Save to csv in input folder
    time_now = datetime.datetime.now()
    today_date = str(time_now).split(" ")[0]
    filename = "Analyzed-" + analysis_folder + "_Summary.csv"
    # analysis_results_folder = os.path.join(analysis_results_folder, filename)
    print(analysis_results_folder)
    # pivoted_df.to_csv(analysis_results_folder, mode='a', index=False, header=False)
    # df = pd.read_csv(analysis_results_folder)
    # df.drop_duplicates(inplace = True)

    # print(df['Robot'].unique())
    # df['Sample and Robot'] = df['Robot'] + "_" + df['Sample']
    # fig = px.scatter(df, x='Date', y='Liquid Moved (uL)', color='Sample and Robot', hover_data = ['Robot'])
    # # Create drop-down button for the 'Robot' column
    # buttons = [
    #     dict(label=robot, method='update', args=[{'visible': [robot == r for r in df['Robot']]}])
    #     for robot in df['Robot'].unique()
    # ]

    # fig.update_layout(updatemenus=[dict(type='dropdown', active=0, buttons=buttons)])

    # # Set initial visibility
    # fig.update_traces(visible=False)  # Set all traces to invisible initially

    # fig.show()

    # fig_path = os.path.join(new_folder_path, 'graphtest.html')
    # fig.write_html(fig_path)

    results_path = os.path.join(analysis_results_folder, filename)
    pivoted_df.to_csv(results_path, index=False)
