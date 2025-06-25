import os
import pandas as pd
import plotly.graph_objs as go
import webbrowser
import dash
import plotly.express as px
import plotly.colors as pc
from scipy.stats.mstats import rankdata  # Import for quantile normalization

app = dash.Dash()
web_port = 8082

def open_browser():
    webbrowser.open_new(f"http://localhost:{web_port}")

def graph_curves(data, heading):
    fig = go.Figure()

#... (other parts of the function)
    # colorscale = pc.sequential.Plasma  # Or try other color scales
    colorscale = [
    '#FF0000', '#FF1400', '#FF2800', '#FF3c00', '#FF5000',  # Red to Orange
    '#FF6400', '#FF7800', '#FF8c00', '#FFa000', '#FFb400',
    '#FFc800', '#FFdc00', '#FFf000', '#FFFF00', '#e6ff00',  # Orange to Yellow
    '#ccff00', '#b3ff00', '#99ff00', '#80ff00', '#66ff00',
    '#4dff00', '#33ff00', '#1aff00', '#00ff00', '#00ff1a',  # Yellow to Green
    '#00ff33', '#00ff4d', '#00ff66', '#00ff80', '#00ff99',
    '#00ffb3', '#00ffcc', '#00ffe6', '#00ffff', '#00e6ff',  # Green to Cyan
    '#00ccff', '#00b3ff', '#0099ff', '#0080ff', '#0066ff',
    '#004dff', '#0033ff', '#001aff', '#0000ff', '#1a00ff',  # Cyan to Blue
    '#3300ff', '#4d00ff', '#6600ff', '#8000ff', '#9900ff',
    '#b300ff', '#cc00ff', '#e600ff', '#ff00ff', '#ff00e6',  # Blue to Magenta
    '#ff00cc', '#ff00b3', '#ff0099', '#ff0080', '#ff0066',
    '#ff004d', '#ff0033', '#ff001a', '#ff0000',          # Magenta to Red
    #... add more colors to complete the 120-color scale
]
    # Quantile normalization
    sg_values_array = data['SG Value'].astype(int).to_numpy()
    ranks = rankdata(sg_values_array)
    normalized_sg_values = (ranks - 1) / (len(ranks) - 1)
    unique_sg_values = sorted(list(set(data['SG Value'].astype(int).tolist())))
    # Create a dictionary mapping SG values to normalized values
    sg_value_to_normalized = dict(zip(sg_values_array, normalized_sg_values))
    print(f"colorscale: {len(colorscale)}")
    for sg_value in unique_sg_values:
        normalized_sg = sg_value_to_normalized[sg_value]  # Use normalized value from dictionary
        color_index = int(normalized_sg * (len(colorscale) - 1))
        color_index = max(0, min(len(colorscale) - 1, color_index))

        color = colorscale[color_index]

        for t in trials:
            mask = (data['Trials'].astype(int) == t) & (data['SG Value'].astype(int) == sg_value)
            d = data.loc[mask]

            fig.add_trace(go.Scatter(
                x=d['Time(s)'].astype(float),
                y=d['Force(N)'].astype(float),
                mode='lines',
                name=f'SG-{sg_value}-trial-{t}',
                line=dict(color=color),
                hoverinfo='x+y+name'
            ))

    fig.update_layout(title=heading, xaxis_title='Time(s)', yaxis_title='Force(N)')
    return fig # Return the figure


if __name__ == '__main__':
    working_dir = os.getcwd()
    detail_rows = 0
    trials = [x for x in range(1,100+1)]  # Define trials only once
    dir = '/Users/cfern/OneDrive/Desktop/stallguard/stallguard/'
    name = r'Homing Repeatability Unit 3/'
    print(name)
    name = dir + name + 'X_SG_val_2.csv'
    print(name)
    files = {  # Store file names and headings in a dictionary
        name: name,
        # 'X stallguard no load.csv': 'X stallguard no load.csv',
        # 'Z stallguard one tiprack.csv': 'Z stallguard one tiprack.csv',
        # 'Z stallguard no load just platform.csv': 'Z stallguard no load just platform.csv',
        # 'Homing Z Stallguard no load.csv': 'Homing Z Stallguard no load.csv',
        # 'Repeatablity_Z_SG_val_2_Speed_150.0_1.5_Amps.csv': 'Repeatablity_Z_SG_val_2_Speed_150.0_1.5_Amps.csv',
    }
    data = pd.read_csv(name, skiprows=detail_rows)
    peak_forces = data.groupby('Trials')['Force(N)'].max().reset_index()
    for x in peak_forces['Trials']:
        print(f'{peak_forces[peak_forces["Trials"] == x]["Force(N)"].values[0]}')
    # figures = []

    # for file_name, heading in files.items():
    #     data = pd.read_csv(file_name, skiprows=detail_rows)
    #     fig = graph_curves(data, heading)
    #     figures.append(fig)

    # # Batch HTML writing
    # for i, fig in enumerate(figures):
    #     print(i)
    #     html_name = list(files.values())[i].replace('.csv', '')
    #     fig.write_html(f'{html_name}.html')

    # Optional: Open the browser (only once if needed)
    # open_browser()
