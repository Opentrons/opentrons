# /// script
# requires-python = "==3.13.*"
# dependencies = [
#     "rich"
# ]
# ///


# =============================================================================
# Loadnames for Tip Racks and Adapter
# =============================================================================
opentrons_flex_96_tiprack_50ul = "opentrons_flex_96_tiprack_50ul"
opentrons_flex_96_filtertiprack_50ul = "opentrons_flex_96_filtertiprack_50ul"
opentrons_flex_96_tiprack_200ul = "opentrons_flex_96_tiprack_200ul"
opentrons_flex_96_filtertiprack_200ul = "opentrons_flex_96_filtertiprack_200ul"
opentrons_flex_96_tiprack_1000ul = "opentrons_flex_96_tiprack_1000ul"
opentrons_flex_96_filtertiprack_1000ul = "opentrons_flex_96_filtertiprack_1000ul"

# Flex pipette adapter for 96 channel loadname (currently not used as a tip rack)
opentrons_flex_96_tiprack_adapter = "opentrons_flex_96_tiprack_adapter"

# =============================================================================
# Loadnames for Flex Pipettes
# =============================================================================
flex_96channel_1000 = "flex_96channel_1000"
flex_1channel_50 = "flex_1channel_50"
flex_1channel_1000 = "flex_1channel_1000"
flex_8channel_1000 = "flex_8channel_1000"
flex_8channel_50 = "flex_8channel_50"

# =============================================================================
# Parameter Definitions
# =============================================================================
FUNCTIONS = ["transfer_with_liquid_class", "consolidate_with_liquid_class", "distribute_with_liquid_class"]
LIQUID_CLASSES = ["water", "ethanol_80", "glycerol_50"]

# Updated tip strategies list
TIP_STRATEGIES = ["never", "once", "always", "per source"]

VOLUMES = ["below max tip", "above tip capacity (chunking required)"]

# Pipette loadnames list
PIPETTES = [flex_96channel_1000, flex_1channel_50, flex_1channel_1000, flex_8channel_1000, flex_8channel_50]

# Define Tip Racks (using provided loadnames)
TIP_RACKS = [
    opentrons_flex_96_tiprack_50ul,
    opentrons_flex_96_filtertiprack_50ul,
    opentrons_flex_96_tiprack_200ul,
    opentrons_flex_96_filtertiprack_200ul,
    opentrons_flex_96_tiprack_1000ul,
    opentrons_flex_96_filtertiprack_1000ul,
]

# Pipettes that require low volume mode and are limited to tip racks with "50ul"
LOW_VOLUME_PIPETTES = {flex_1channel_50, flex_8channel_50}

# ANSI Colors for Functions (for colored terminal output)
FUNCTION_COLORS = {
    "transfer_with_liquid_class": "\033[94m",  # Blue
    "consolidate_with_liquid_class": "\033[92m",  # Green
    "distribute_with_liquid_class": "\033[91m",  # Red
}
RESET_COLOR = "\033[0m"

# -----------------------------------------------------------------------------
# Create a global Rich console with recording enabled to capture output.
# -----------------------------------------------------------------------------
from rich.console import Console

console = Console(record=True)


def allowed_tip_racks(pipette: str) -> list:
    """Return allowed tip racks based on the pipette loadname."""
    if pipette in LOW_VOLUME_PIPETTES:
        return [rack for rack in TIP_RACKS if "50ul" in rack]
    return TIP_RACKS


def generate_combinations() -> list:
    """Generate all valid combinations of parameters."""
    combinations = []
    for pipette in PIPETTES:
        racks = allowed_tip_racks(pipette)
        if pipette in LOW_VOLUME_PIPETTES:
            for low_volume_mode in [True, False]:
                for tip_rack in racks:
                    for function in FUNCTIONS:
                        for liquid in LIQUID_CLASSES:
                            for tip_strategy in TIP_STRATEGIES:
                                for volume in VOLUMES:
                                    combo = {
                                        "function": function,
                                        "liquid": liquid,
                                        "tip_strategy": tip_strategy,
                                        "volume": volume,
                                        "pipette": pipette,
                                        "low_volume_mode": low_volume_mode,
                                        "tip_rack": tip_rack,
                                    }
                                    combinations.append(combo)
        else:
            for tip_rack in racks:
                for function in FUNCTIONS:
                    for liquid in LIQUID_CLASSES:
                        for tip_strategy in TIP_STRATEGIES:
                            for volume in VOLUMES:
                                combo = {
                                    "function": function,
                                    "liquid": liquid,
                                    "tip_strategy": tip_strategy,
                                    "volume": volume,
                                    "pipette": pipette,
                                    "low_volume_mode": None,
                                    "tip_rack": tip_rack,
                                }
                                combinations.append(combo)
    return combinations


def print_parameter_tables():
    """Print little tables for each parameter used to generate combinations using rich."""
    from rich.table import Table

    parameters = {
        "Functions": FUNCTIONS,
        "Liquid Classes": LIQUID_CLASSES,
        "Tip Strategies": TIP_STRATEGIES,
        "Volumes": VOLUMES,
        "Pipettes": PIPETTES,
        "Tip Racks": TIP_RACKS,
    }

    for param_name, items in parameters.items():
        table = Table(title=param_name)
        table.add_column("Index", justify="right", style="cyan", no_wrap=True)
        table.add_column("Value", style="magenta")
        for idx, item in enumerate(items, start=1):
            table.add_row(str(idx), item)
        console.print(table)

    # Print overall static parameter counts.
    from rich.table import Table as SummaryTable

    summary = SummaryTable(title="Parameters Summary")
    summary.add_column("Parameter", style="green")
    summary.add_column("Count", justify="right", style="yellow")
    for param_name, items in parameters.items():
        summary.add_row(param_name, str(len(items)))
    console.print(summary)


def print_overall_total(combos: list):
    """Print a panel with the overall total combinations count using rich."""
    from rich.panel import Panel

    total_count = len(combos)
    panel = Panel(f"[bold yellow]{total_count}[/bold yellow]", title="Overall Total Combinations", subtitle="Generated from all parameters")
    console.print(panel)


def print_generation_order_info():
    """Print the order in which combinations are generated, using rich."""
    from rich.panel import Panel

    order_text = (
        "[bold]Combination Generation Order:[/bold]\n\n"
        "[underline]For each pipette in PIPETTES:[/underline]\n"
        "  • If pipette requires low volume mode:\n"
        "      - For each low_volume_mode in [True, False]\n"
        "      - For each tip rack in allowed_tip_racks(pipette)\n"
        "      - For each function in FUNCTIONS\n"
        "      - For each liquid in LIQUID_CLASSES\n"
        "      - For each tip strategy in TIP_STRATEGIES\n"
        "      - For each volume in VOLUMES\n\n"
        "  • Otherwise (non-low-volume pipettes):\n"
        "      - For each tip rack in allowed_tip_racks(pipette)\n"
        "      - For each function in FUNCTIONS\n"
        "      - For each liquid in LIQUID_CLASSES\n"
        "      - For each tip strategy in TIP_STRATEGIES\n"
        "      - For each volume in VOLUMES\n"
    )
    panel = Panel(order_text, title="Generation Order Info", subtitle="Nested Loop Order")
    console.print(panel)


def print_combinations_matrix(combos: list):
    """Print an aggregated matrix of combination counts using rich.

    This table aggregates the counts of valid combinations for each pipette (rows)
    and volume scenario (columns) and adds a column showing the total count per pipette.
    """
    from rich.table import Table

    # Build a matrix (dictionary) for counts indexed by pipette and volume.
    matrix = {pip: {vol: 0 for vol in VOLUMES} for pip in PIPETTES}
    for combo in combos:
        pip = combo["pipette"]
        vol = combo["volume"]
        matrix[pip][vol] += 1

    table = Table(title="Aggregated Combinations Matrix")
    table.add_column("Pipette", style="cyan", no_wrap=True)
    for vol in VOLUMES:
        table.add_column(vol, justify="right", style="magenta")
    table.add_column("Total", justify="right", style="green")

    for pip in sorted(PIPETTES):
        counts = [matrix[pip][vol] for vol in VOLUMES]
        total = sum(counts)
        row = [str(count) for count in counts] + [str(total)]
        table.add_row(pip, *row)

    console.print(table)


def main():
    """Main entry point for generating and displaying parameter combinations."""
    combos = generate_combinations()
    print_parameter_tables()
    print_generation_order_info()
    print_combinations_matrix(combos)
    print_overall_total(combos)

    # Export the entire recorded console output to HTML.
    # You can then use an external tool to convert this HTML to an image.
    console.save_html("rich_output.html", inline_styles=True)
    # Instruct the user:
    console.print(
        "\n[bold green]HTML output has been saved to 'rich_output.html'.\n"
        "You can open this file in a browser and use a screenshot tool or an HTML-to-image converter "
        "(e.g. wkhtmltoimage) to create a shareable image.[/bold green]"
    )


if __name__ == "__main__":
    main()
