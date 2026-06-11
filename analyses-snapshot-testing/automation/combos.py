# /// script
# requires-python = "==3.12.*"
# dependencies = [
#     "rich"
# ]
# ///

from typing import Any, Dict, List

from rich.console import Console

console = Console(record=True)

# =============================================================================
# Loadnames for Tip Racks
# =============================================================================
opentrons_flex_96_tiprack_50ul = "opentrons_flex_96_tiprack_50ul"
opentrons_flex_96_filtertiprack_50ul = "opentrons_flex_96_filtertiprack_50ul"
opentrons_flex_96_tiprack_200ul = "opentrons_flex_96_tiprack_200ul"
opentrons_flex_96_filtertiprack_200ul = "opentrons_flex_96_filtertiprack_200ul"
opentrons_flex_96_tiprack_1000ul = "opentrons_flex_96_tiprack_1000ul"
opentrons_flex_96_filtertiprack_1000ul = "opentrons_flex_96_filtertiprack_1000ul"

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
FUNCTIONS: List[str] = [
    "transfer_with_liquid_class",
    "consolidate_with_liquid_class",
    "distribute_with_liquid_class",
]
LIQUID_CLASSES: List[str] = ["water", "ethanol_80", "glycerol_50"]
TRANSFER_TIP_STRATEGIES: List[str] = ["never", "once", "always", "per source"]
C_AND_D_TIP_STRATEGIES: List[str] = ["never", "once"]
VOLUMES: List[str] = ["chunking", "NO chunking"]
PIPETTES: List[str] = [
    flex_96channel_1000,
    flex_1channel_50,
    flex_1channel_1000,
    flex_8channel_1000,
    flex_8channel_50,
]
TIP_RACKS: List[str] = [
    opentrons_flex_96_tiprack_50ul,
    opentrons_flex_96_filtertiprack_50ul,
    opentrons_flex_96_tiprack_200ul,
    opentrons_flex_96_filtertiprack_200ul,
    opentrons_flex_96_tiprack_1000ul,
    opentrons_flex_96_filtertiprack_1000ul,
]
LOW_VOLUME_PIPETTES: set[str] = {flex_1channel_50, flex_8channel_50}


def allowed_tip_racks(pipette: str) -> List[str]:
    """Return allowed tip racks based on the pipette loadname."""
    if pipette in LOW_VOLUME_PIPETTES:
        return [rack for rack in TIP_RACKS if "50ul" in rack]
    return TIP_RACKS


def allowed_tip_strategies(function: str) -> List[str]:
    """Return allowed tip strategies based on the function."""
    if function == "transfer_with_liquid_class":
        return TRANSFER_TIP_STRATEGIES
    return C_AND_D_TIP_STRATEGIES


def generate_combinations() -> List[Dict[str, Any]]:  # noqa
    """Generate all valid combinations of parameters."""
    combinations: List[Dict[str, Any]] = []
    for pipette in PIPETTES:
        racks: List[str] = allowed_tip_racks(pipette)
        if pipette in LOW_VOLUME_PIPETTES:
            for low_volume_mode in [True, False]:
                for tip_rack in racks:
                    for function in FUNCTIONS:
                        for liquid in LIQUID_CLASSES:
                            for tip_strategy in allowed_tip_strategies(function):
                                for volume in VOLUMES:
                                    combo: Dict[str, Any] = {
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
                        for tip_strategy in allowed_tip_strategies(function):
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


def print_overall_total(combos: List[Dict[str, Any]]) -> None:
    """Print a panel with the overall total combinations count using rich."""
    from rich.panel import Panel

    total_count: int = len(combos)
    panel = Panel(
        f"[bold yellow]{total_count}[/bold yellow]",
        title="Overall Total Combinations",
        subtitle="Generated from all parameters",
    )
    console.print(panel)


def print_generation_order_info() -> None:
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
        "      - For each tip strategy in allowed_tip_strategies\n"
        "      - For each volume in VOLUMES\n\n"
        "  • Otherwise (non-low-volume pipettes):\n"
        "      - For each tip rack in allowed_tip_racks(pipette)\n"
        "      - For each function in FUNCTIONS\n"
        "      - For each liquid in LIQUID_CLASSES\n"
        "      - For each tip strategy in allowed_tip_strategies\n"
        "      - For each volume in VOLUMES\n"
    )
    panel = Panel(order_text, title="Generation Order Info", subtitle="Nested Loop Order")
    console.print(panel)


def export_combinations_csv(combos: List[Dict[str, Any]], filename: str = "combinations.csv") -> None:
    """Export all parameter combinations to a CSV file.

    Args:
        combos (List[Dict[str, Any]]): List of dictionaries representing the parameter combinations.
        filename (str, optional): The filename for the CSV file. Defaults to "combinations.csv".
    """
    import csv

    # Determine fieldnames from the first combination.
    if combos:
        fieldnames: List[str] = list(combos[0].keys())
    else:
        fieldnames = []

    with open(filename, "w", newline="") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for combo in combos:
            writer.writerow(combo)


def main() -> None:
    """Main entry point for generating and displaying parameter combinations."""
    print_generation_order_info()
    combos: List[Dict[str, Any]] = generate_combinations()
    print_overall_total(combos)
    export_combinations_csv(combos)


if __name__ == "__main__":
    main()
