"""Opentrons command-line interface.

This CLI application is not yet public-facing.
It is currently used by the Opentrons App to analyze protocols.
"""

import click

from .analyze import analyze


@click.group()
def main() -> None:
    """Welcome to the `opentrons` command-line application.

    This application is not yet public facing.
    Please check back in a future software version.
    """


main.add_command(analyze)
