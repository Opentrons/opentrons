import plotly.express as px
import pandas as pd


def create_boxplots():
    df = pd.read_csv(r"C:\Users\Rhyann Clarke\Downloads\inner-labware-creator-data - Summary.csv")
    
    # Melt low, middle, high into a new 'Region' column
    df_melted = pd.melt(
        df,
        id_vars=["Labware", "Plate Number", "Method"],
        value_vars=["Low", "Middle", "High"],
        var_name="Region",
        value_name="Error (mm)"
    )
    
    labware_types = df_melted["Labware"].unique()
    
    for labware in labware_types:
        df_labware = df_melted[df_melted["Labware"] == labware].copy()
        df_labware["Error (mm)"] = df_labware["Error (mm)"].abs()
        
        iwg_avg = df_labware[df_labware["Method"] == "IWG"]["Error (mm)"].mean().round(2)
        udv_avg = df_labware[df_labware["Method"] == "UDV"]["Error (mm)"].mean().round(2)
        
        title = f"Labware: {labware} | IWG Avg Error: {iwg_avg} | UDV Avg Error: {udv_avg}"
        
        fig = px.box(
            df_labware,
            x="Region",
            y="Error (mm)",
            points="all",
            facet_col="Plate Number",
            title=title,
            color = "Method"
        )
        fig.update_yaxes(range=[0, 3.2])
        fig.write_html(f"{labware}.html")
        fig.show()


if __name__ == "__main__":
    create_boxplots()
