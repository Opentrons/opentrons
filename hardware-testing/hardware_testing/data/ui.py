"""Production QC User Interface."""
from opentrons.hardware_control import SyncHardwareAPI
from opentrons.hardware_control.types import StatusBarState

PRINT_HEADER_NUM_SPACES = 4
PRINT_HEADER_DASHES = "-" * PRINT_HEADER_NUM_SPACES
PRINT_TITLE_POUNDS = "#" * PRINT_HEADER_NUM_SPACES
PRINT_HEADER_SPACES = " " * (PRINT_HEADER_NUM_SPACES - 1)
PRINT_HEADER_ASTERISK = "*"


def get_user_answer(question: str) -> bool:
    """Get user answer."""
    while True:
        inp = input(f"QUESTION: {question}? (y/n): ").strip().lower()
        if not inp:
            continue
        elif inp[0] == "y":
            return True
        elif inp[0] == "n":
            return False


def get_user_ready(message: str) -> None:
    """Get user ready."""
    input(f"WAIT: {message}, press ENTER when ready: ")


def alert_user_ready(message: str, hw: SyncHardwareAPI) -> None:
    """Flash the ui lights on the ot3 and then use the get_user_ready."""
    hw.set_status_bar_state(StatusBarState.PAUSED)
    get_user_ready(message)
    hw.set_status_bar_state(StatusBarState.CONFIRMATION)


def print_title(title: str) -> None:
    """Print title."""
    """
    #####################
    #   Example Title   #
    #####################
    """
    length = len(title)
    pounds = PRINT_TITLE_POUNDS + ("#" * length) + PRINT_TITLE_POUNDS
    middle = f"#{PRINT_HEADER_SPACES}" f"{title}" f"{PRINT_HEADER_SPACES}#"
    print(f"\n{pounds}\n{middle}\n{pounds}\n")


def print_header(header: str) -> None:
    """Print header."""
    """
    ----------------------
    |   Example Header   |
    ----------------------
    """
    length = len(header)
    dashes = PRINT_HEADER_DASHES + ("-" * length) + PRINT_HEADER_DASHES
    middle = f"|{PRINT_HEADER_SPACES}{header}{PRINT_HEADER_SPACES}|"
    print(f"\n{dashes}\n{middle}\n{dashes}\n")


def print_error(message: str) -> None:
    """Print error."""
    print(f"ERROR: {message}")


def print_info(message: str) -> None:
    """Print information."""
    print(message)
