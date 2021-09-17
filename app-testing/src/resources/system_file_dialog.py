"""Cross platform automation for system file dialog."""
import platform
from pathlib import Path
import time


if platform.system() == "Darwin":
    # seems to have to be here on 3.7.10 ?
    import AppKit  # noqa: F401
if platform.system() in ["Darwin", "Windows"]:
    # Have not got working on Linux yet.
    import pyautogui


def input_file_source(file_path: Path) -> None:
    """Input into a system file dialog the path to the file."""
    if platform.system() == "Darwin":
        pyautogui.hotkey("command", "shift", "g")
        pyautogui.press("delete")
        pyautogui.write(str(file_path.parent.resolve()))
        pyautogui.press("enter")
        time.sleep(0.3)
        pyautogui.press("right")
        time.sleep(0.3)
        pyautogui.press("down")
        pyautogui.press("enter")
    elif platform.system() == "Windows":
        # need TODO
        pass
    elif platform.system() == "Linux":
        # need TODO
        pass
    else:
        assert False, f"Platform {platform.system()} not supported."
