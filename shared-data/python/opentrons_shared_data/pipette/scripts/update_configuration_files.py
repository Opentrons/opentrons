import argparse



def main() -> None:
    """Entry point."""
    parser = argparse.ArgumentParser(
        description="96 channel tip handling testing script."
    )


if __name__ == "__main__":
    """
    A script to automate building a pipette configuration definition.

    This script can either perform migrations from a v1 -> v2 schema format
    or build a brand new script from scratch.

    When building a new pipette configuration model, you will either need
    to provide CSVs or use command line inputs.

    If you choose CSVs you will need one CSV for the general pipette configuration
    data (such as pipette model or number of channels) and one for every tip
    type that this pipette model can support.
    """
    main()
