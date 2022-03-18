import click

from .analyze import analyze


@click.group()
def main() -> None:
    """Welcome to the `opentrons` command-line application."""


main.add_command(analyze)


if __name__ == "__main__":
    main()
