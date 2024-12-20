import json
import pandas as pd
import statistics
import os
import sys
import traceback
import plotly.graph_objects as go

global baseline_x, baseline_y
baseline_x = 'baseline_x.json'
baseline_z = 'baseline_z.json'
baseline_labware = 'baseline_lab_{axis}.json'
baseline_stacker = 'baseline_stack_{axis}.json'
baseline_sensor = 'baseline_sensor_{axis}.json'

global options
options = ['Make Baseline', 'Validate Labware', 'Validation Checks', 'Plot']

def plot_baseline(plot_choice):
    if plot_choice.lower() == 'baseline':
        baselines = [baseline_x, baseline_z]
        bins = list(range(1, 129))  # X-axis: Bin numbers (1 to 128)
        for baseline in baselines:
            try:
                file = open(baseline, 'r')
            except:
                raise
            baseline_dict = json.load(file)
            # Create line traces for each zone
            fig = go.Figure()
            for zone in baseline_dict:
                zone_data = baseline_dict[zone]
                fig.add_trace(go.Scatter(x=bins, y=zone_data, mode='lines', name=f'Zone {zone}'))

            # Customize layout
            fig.update_layout(
                title=f"TOF Sensor Baseline: {baseline}",
                xaxis_title="Bins",
                yaxis_title="Photon Count",
                legend_title="Zones",
                template="plotly_white",
            )
            fig.show()
    elif plot_choice.lower() =='labware data':
        file_csv = input('Path to labware csv: ')
        axis = input('Which axis? z or x?: ')
        try:
            file_df = pd.read_csv(file_csv)
        except:
            print('Cannot read file')
       
        if axis == 'z':
            baseline_file = baseline_z
            zone = '1'
        elif axis == 'x':
            baseline_file = baseline_x
            zone = '6'
        try:
            bfile = open(baseline_file)
        except:
            print('Could not find baseline')
        baseline_dict = json.load(bfile)
        bfile.close()
        lab_data = process_data(file_df)

        bins = [x for x in range(1,129)]
        fig = go.Figure()
        zone_data = baseline_dict[zone]
        fig.add_trace(go.Scatter(x=bins, y=zone_data, mode='lines', name=f'Baseline {axis}', line=dict(dash='dash')))
    
        zone_data = lab_data[zone]
        fig.add_trace(go.Scatter(x=bins, y=zone_data, mode='lines', name=f'Labware'))
    
        fig.update_layout(
                title=f"Labware with Baseline",
                xaxis_title="Bins",
                yaxis_title="Photon Count",
                legend_title="Zones",
                template="plotly_white",
            )
        fig.show()

    elif plot_choice.lower() == 'labware comparison':
        labwares_files = [baseline_labware.format(axis = 'x'), baseline_labware.format(axis = 'z')]
        bins = list(range(1, 129))  # X-axis: Bin numbers (1 to 128)
        for labware_data in labwares_files:
            try:
                file = open(labware_data, 'r')
            except:
                raise

            labwares_dict = json.load(file)
            if('x' in labware_data.split('_')[-1]):
                zone = '6'
            elif('z' in labware_data.split('_')[-1]):
                zone = '1'

            # Create line traces for each zone
            fig = go.Figure()

            for labware in labwares_dict:
                y_data = labwares_dict[labware][zone]
                fig.add_trace(go.Scatter(x=bins, y=y_data, mode='lines', name=labware))
            
            # Customize layout
            fig.update_layout(
                title=f"TOF Labware Comparison: {labware_data}",
                xaxis_title="Bins",
                yaxis_title="Photon Count",
                legend_title=f'Zone: {zone}',
                template="plotly_white",
            )
            fig.show()

    elif plot_choice.lower() == 'stacker comparison':
        stackers_files = [baseline_stacker.format(axis = 'x'), baseline_stacker.format(axis = 'z')]
        bins = list(range(1, 129))  # X-axis: Bin numbers (1 to 128)
        for stacker_data in stackers_files:
            try:
                file = open(stacker_data, 'r')
            except:
                raise

            stackers_dict = json.load(file)
            if('x' in stacker_data.split('_')[-1]):
                zone = '6'
            elif('z' in stacker_data.split('_')[-1]):
                zone = '1'

            # Create line traces for each zone
            fig = go.Figure()

            for stacker in stackers_dict:
                y_data = stackers_dict[stacker][zone]
                fig.add_trace(go.Scatter(x=bins, y=y_data, mode='lines', name=stacker))
            
            # Customize layout
            fig.update_layout(
                title=f"TOF Stacker Comparison: {stacker_data}",
                xaxis_title="Bins",
                yaxis_title="Photon Count",
                legend_title=f'Zone: {zone}',
                template="plotly_white",
            )
            fig.show()

    elif plot_choice.lower() == 'sensor comparison':
        sensors_files = [baseline_sensor.format(axis = 'x'), baseline_sensor.format(axis = 'z')]
        bins = list(range(1, 129))  # X-axis: Bin numbers (1 to 128)
        for sensor_data in sensors_files:
            try:
                file = open(sensor_data, 'r')
            except:
                raise

            sensors_dict = json.load(file)
            if('x' in sensor_data.split('_')[-1]):
                zone = '6'
            elif('z' in sensor_data.split('_')[-1]):
                zone = '1'

            # Create line traces for each zone
            fig = go.Figure()

            for sensor in sensors_dict:
                y_data = sensors_dict[sensor][zone]
                fig.add_trace(go.Scatter(x=bins, y=y_data, mode='lines', name=sensor))
            
            # Customize layout
            fig.update_layout(
                title=f"TOF Sensor Comparison: {file}",
                xaxis_title="Bins",
                yaxis_title="Photon Count",
                legend_title=f'Zone: {zone}',
                template="plotly_white",
            )
            fig.show()

def create_baseline(df_path, axis):
    df = pd.read_csv(df_path)
    print(df.shape)
    baseline_rows = df[(df['Labware Stacked'] == 0) & (df['Axis'] == axis) & (df['Test'] == 'Gripper')]
    zones = {}
    labwares = {}
    stackers = {}
    sensors = {}

    return_zones = {}
    return_labwares = {}
    return_stackers = {}
    return_sensors= {}
    i = 0

    bins = [str(i) for i in range(1, 129)]
    # print(baseline_rows)
    bin_labels = ['Time', 'Zone'] + bins
    for row in baseline_rows.itertuples(index = False, name='data'):
        # print(f'ROW: {row}')
        # break
        labware = row._5
        stacker = row._1
        sensor = row.Serial
        baseline_values = json.loads(row.Values)
        baseline_df = pd.DataFrame(baseline_values, columns=bin_labels)
        # print(labware, stacker, sensor)
        
        if labware not in labwares:
            labwares[labware] = {}
        if stacker not in stackers:
            stackers[stacker] = {}
        if sensor not in sensors:
            sensors[sensor] = {}
        # print(baseline_df)
        # baseline_values.columns = bin_labels
        for entry in baseline_df.itertuples():
            # Load JSON and create a DataFrame
            # samples = json.loads(entry)
            # sample_df = pd.DataFrame(entry, columns=bin_labels)
            # sample_df.columns = bin_labels
            # print(f'Entry: {entry}')
            zone = str(int(entry.Zone))
            if zone not in zones:
                zones[zone] = {}  # Initialize zone if not present
            if zone not in labwares[labware]:
                labwares[labware][zone] = {}
            if zone not in stackers[stacker]:
                stackers[stacker][zone] = {}
            if zone not in sensors[sensor]:
                sensors[sensor][zone] ={}

            for i in range(3, 131):
                bin_str = str(i)
                bin = '_' + bin_str
                bin_val = getattr(entry, bin)
                if bin_str not in zones[zone]:
                    zones[zone][bin_str] = []  # Initialize bin if not present
                if bin_str not in labwares[labware][zone]:
                    labwares[labware][zone][bin_str] = []
                if bin_str not in stackers[stacker][zone]:
                    stackers[stacker][zone][bin_str] = []
                if bin_str not in sensors[sensor][zone]:
                    sensors[sensor][zone][bin_str] = []

                zones[zone][bin_str].append(bin_val)
                labwares[labware][zone][bin_str].append(bin_val)
                stackers[stacker][zone][bin_str].append(bin_val)
                sensors[sensor][zone][bin_str].append(bin_val)

                # print(bin_val)

    with open('zones.json', 'w') as file:
        json.dump(zones, file)
    file.close()
    for zone in zones:   
        if zone not in return_zones:
            return_zones[zone] = []
            bin_thresholds = []
        for bin_label in zones[zone]:
            list_vals = zones[zone][bin_label]
            # print(f'ZON: {zone}, BINS: {list_vals}')
            mean = sum(list_vals)/len(list_vals)
            std = statistics.pstdev(list_vals)
            threshold = mean+(6*std)
            bin_thresholds.append(threshold)
        return_zones[zone] = bin_thresholds

    for labware in labwares:
        if labware not in return_labwares:
            return_labwares[labware] = {}
        for zone in labwares[labware]:
            if zone not in return_labwares[labware]:
                return_labwares[labware][zone] = []
            for bin_label in labwares[labware][zone]:
                bin_vals = labwares[labware][zone][bin_label]
                mean = sum(bin_vals)/len(bin_vals)
                return_labwares[labware][zone].append(mean)

    for stacker in stackers:
        if stacker not in return_stackers:
            return_stackers[stacker] = {}
        for zone in stackers[stacker]:
            if zone not in return_stackers[stacker]:
                return_stackers[stacker][zone] = []
            for bin_label in stackers[stacker][zone]:
                bin_vals = stackers[stacker][zone][bin_label]
                mean = sum(bin_vals)/len(bin_vals)
                return_stackers[stacker][zone].append(mean)

    for sensor in sensors:
        print(sensor)
        if sensor not in return_sensors:
            return_sensors[sensor] = {}
        for zone in sensors[sensor]:
            if zone not in return_sensors[sensor]:
                return_sensors[sensor][zone] = []
            for bin_label in sensors[sensor][zone]:
                bin_vals = sensors[sensor][zone][bin_label]
                mean = sum(bin_vals)/len(bin_vals)
                return_sensors[sensor][zone].append(mean)


    return (return_zones, return_labwares, return_stackers, return_sensors)

def process_data(data_df):

    bin_labels = ['Time', 'Zone'] + [str(i) for i in range(1, 129)]
 
    data_df.columns = bin_labels
    # sample_df = None
    zones = {}
    return_zones = {}
    for entry in data_df.itertuples():
        zone = str(int(getattr(entry, 'Zone')))
        if zone not in zones:
            zones[zone] = {}  # Initialize zone if not present

        for i in range(3, 131):
            bin_str = str(i)
            bin = '_' + bin_str
            bin_val = getattr(entry, bin)
            if bin_str not in zones[zone]:
                zones[zone][bin_str] = []  # Initialize bin if not present
            zones[zone][bin_str].append(bin_val)
            # Ensure zone is a string
    for zone in zones:   
        if zone not in return_zones:
            return_zones[zone] = []
            bin_averages = []
        for bin_label in zones[zone]:
            list_vals = zones[zone][bin_label]
            if list_vals:
                mean = sum(list_vals)/len(list_vals)
                bin_averages.append(mean)
        return_zones[zone] = bin_averages
        # print(f'RETURN: {return_zones}')
    return return_zones

    
def sense_labware(axis, data_df):
    # print(df)
    raw_data = process_data(data_df)
    baseline_zones = {}
    baseline_file = baseline_z

    if axis == 'X-Axis':
        baseline_file = baseline_x
    try:
        with open(baseline_file, 'r') as file:
            baseline_zones = json.load(file)
            file.close()
    except json.JSONDecodeError:
        print("Can't read file")
    if axis == 'X-Axis':
        # Zone 6: If any bins 25 - 40 are positive, we see labware,  have the script say “labware!”
        z6_baseline = baseline_zones['6']
        z6_raw_data = raw_data['6']
        for bin in range(25, 41):
            delta = z6_raw_data[bin] - z6_baseline[bin]
            if delta > 0:
                return True
    elif axis == 'Z-Axis':
        # Zone1: If any bin lower than 64 is positive, we see labware, have the script say “labware!”
        z1_baseline = baseline_zones['1']
        # print(f"BASE: {z1_baseline}")
        z1_raw_data = raw_data['1']
        # print(f"RAW: {z1_raw_data}")
        for bin in range(57, 59):
            delta = z1_raw_data[bin] - z1_baseline[bin]
            if delta > 0:
                return True
    return False


def plot_tests(hashes, labware, axis):
    df = pd.read_csv('TOF_raw_data_df.csv')
    bins = list(range(1, 129))
    
    ptest ='Positives'
    if labware == 1:
        ptest = 'Negatives'
    if axis == 'Z-Axis':
        zone = 1
        baseline = baseline_z
    elif axis == 'X-Axis':
        baseline = baseline_x
        zone = 6
    fig = go.Figure()

    # Plot labware data
    for hash in hashes:
        matches = df[(df['Hash_id'] == hash) & (df['Labware Stacked'] == labware) & (df['Axis'] == axis)]
        for i, match in enumerate(matches.itertuples()):
            # print(match)
            labware_name = getattr(match, '_6')
            labware_num = getattr(match, '_8')
            test = getattr(match, 'Test')
            # print(f'NAME: {labware_name}')
            values = pd.DataFrame(json.loads(getattr(match, 'Values')))
            data = process_data(values)
            try:
                zone_data = data[str(zone)]
            except:
                traceback.print_exc()
            fig.add_trace(go.Scatter(x=bins, y=zone_data, mode='lines', name=f'{labware_name} {labware_num} {test}'))
    fig.update_layout(
    title=f"TOF Baseline Test: {axis} (False {ptest})",
    xaxis_title="Bins",
    yaxis_title="Photon Count",
    legend_title=f'Zone: {zone}',
    template="plotly_white",
    ) 
        
    # plot baseline
    try:
        file = open(baseline, 'r')
    except:
        raise
    baseline_dict = json.load(file)
    # Create line traces for each zone
    zone_data = baseline_dict[str(zone)]
    fig.add_trace(go.Scatter(x=bins, y=zone_data, mode='lines', name=f'Zone {zone}', line=dict(dash='dash')))
    # Customize layout
    fig.show()


def test_baseline(baseline, df_path):
    df = pd.read_csv(df_path)
    print(df.shape)
    if baseline == 'x':
        axis = 'X-Axis'
    elif baseline == 'z':
        axis = 'Z-Axis'

    no_lab_failed_count = 0
    lab_failed_count = 0
    # For no labware
    print('Testing No Labware')
    filtered_rows_no_lab = df[(df['Labware Stacked'] == 0) & (df['Axis'] == axis)]
    # if baseline == 'z':
    #     filtered_rows_no_lab = df[(df['Labware Stacked'] == 0) & (df['Axis'] == axis) & (df['Test'] == 'Gripper')]
    no_lab_expected = False
    hashes_no_lab = []
    for sample in filtered_rows_no_lab.itertuples():
        hash = getattr(sample, 'Hash_id')
        stacker = getattr(sample, '_2')
        serial = getattr(sample, 'Serial')
        labware = getattr(sample, '_6')
        values = getattr(sample, 'Values')
        values_json = json.loads(values)
        values_df = pd.DataFrame(values_json)
        result = sense_labware(axis, values_df)
        print(f'RESULT: {result}, EXPECTED: {no_lab_expected}')
        if(result != no_lab_expected):
            print(hash, stacker, serial, labware)
            no_lab_failed_count += 1
            hashes_no_lab.append(hash)
    plot_tests(hashes_no_lab, 0, axis)
    # For labware
    print('Testing For Labware')
    filtered_rows_lab = df[(df['Labware Stacked'] == 1) & (df['Axis'] == axis)]
    # if baseline == 'z':
    #     filtered_rows_lab = df[(df['Labware Stacked'] == 1) & (df['Axis'] == axis) & (df['Test'] == 'Gripper')]
    lab_expected = True
    hashes_lab = []
    for sample in filtered_rows_lab.itertuples():
        hash = getattr(sample, 'Hash_id')
        stacker = getattr(sample, '_2')
        serial = getattr(sample, 'Serial')
        labware = getattr(sample, '_6')
        values = getattr(sample, 'Values')
        values_json = json.loads(values)
        values_df = pd.DataFrame(values_json)
        result = sense_labware(axis, values_df)
        print(f'OUT: {stacker}, {labware}, {result}')
        if(result != lab_expected):
            print(hash, stacker, serial, labware)
            lab_failed_count += 1
            hashes_lab.append(hash)
    plot_tests(hashes_lab, 1, axis)


def menu():
    for i, option in enumerate(options):
        print(f'{i}) {option}')
    selection_int = int(input('What do you want to do?\n'))
    if options[selection_int] == 'Make Baseline':
        df_path = input("Enter path to df: ")
        z_baseline_df, z_labware, z_stacker, z_sensor = create_baseline(df_path, 'Z-Axis')
        x_baseline_df, x_labware, x_stacker, x_sensor = create_baseline(df_path, 'X-Axis')

        data = [
            z_baseline_df,
            x_baseline_df,

            z_labware,
            x_labware,

            z_stacker,
            x_stacker,

            z_sensor,
            x_sensor
        ]
        directory = os.curdir
        try:
            baseline_path_z = os.path.join(directory, baseline_z)
            labware_comp_z = os.path.join(directory, baseline_labware.format(axis ='z'))
            stacker_comp_z = os.path.join(directory, baseline_stacker.format(axis = 'z'))
            sensor_comp_z = os.path.join(directory, baseline_sensor.format(axis = 'z'))

            baseline_path_x = os.path.join(directory, baseline_x)
            labware_comp_x = os.path.join(directory, baseline_labware.format(axis ='x'))
            stacker_comp_x = os.path.join(directory, baseline_stacker.format(axis = 'x'))
            sensor_comp_x = os.path.join(directory, baseline_sensor.format(axis = 'x'))

            files = [
                baseline_path_z,
                baseline_path_x,

                labware_comp_z,
                labware_comp_x,

                stacker_comp_z,
                stacker_comp_x,

                sensor_comp_z,
                sensor_comp_x,
            ]
            
            for file_name, file_data in zip(files, data):
                with open(file_name, 'w+')as file:
                    json.dump(file_data, file)
                file.close()
        except:
            traceback.print_exc()

    elif options[selection_int] == 'Validate Labware':
        file_location = input('Enter csv file: (type all to validate entire df): ')
        print('x')
        print('z')
        axis = input('Which axis?: ')
        if axis == 'x':
            axis = 'X-Axis'
        elif axis == 'z':
            axis = 'Z-Axis'
        if file_location.lower() == 'all':
            df = pd.read_csv('TOF_raw_data_df.csv', header=None)
            for i, entry in enumerate(df.itertuples()):
                if i == 0: continue
                # print(f'ROW: {i}')
                # print(entry)
                stacker = getattr(entry, '_2')
                serial = getattr(entry, '_4')
                labware = getattr(entry, '_6')
                labware_stacked = getattr(entry, '_9')
                values = getattr(entry, '_10')
                values_json = json.loads(values)
                values_df = pd.DataFrame(values_json)
                result = sense_labware(axis, values_df)
                print(f'Labware: {labware}\n\nStacked: {labware_stacked}\n\nStacker\n\n{stacker}\n\nSerial: {serial}\n\nRESULT: {result}\n\n')
        else: 
            df = pd.read_csv(file_location, header=None)
            print(sense_labware(axis, df))
    elif options[selection_int] == 'Validation Checks':
        baseline_checks = [
            'z',
            'x',
        ]

        for i, check in enumerate(baseline_checks):
            print(f'{i}) Validate Baseline {check}')
        check_choice = int(input("Make a selection: "))

        try:
            test_baseline(baseline_checks[check_choice], 'TOF_raw_data_df.csv')
        except:
            pass

    elif options[selection_int] == 'Plot':
        plots = [
            'Baseline',
            'Labware Data',
            'Labware Comparison',
            'Stacker Comparison',
            'Sensor Comparison',
        ]
        for i, plot in enumerate(plots):
            print(f'{i}) {plot}')
        plot_choice = int(input("What to plot? "))
        try:
            plot_baseline(plots[plot_choice])
        except:
            print('No baseline data, run \'Make Baseline\' first')
            traceback.print_exc()
            sys.exit(1)
if __name__ == '__main__':
    menu()

    