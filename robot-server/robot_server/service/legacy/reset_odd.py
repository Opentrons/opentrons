from typing_extensions import Final

from anyio import Path as AsyncPath


# The on-device display process knows to look for this file here.
_RESET_MARKER_PATH: Final = AsyncPath("/data/ODD/_CONFIG_TO_BE_DELETED_ON_REBOOT")

_RESET_MARKER_FILE_CONTENTS: Final = """\
This file was placed here by robot-server.
It tells the on-device display process to clear its configuration on the next boot.
"""


async def mark_odd_for_reset_next_boot() -> None:
    """Mark the configuration of the Flex's on-device display so it gets reset on the next boot.

    This assumes you're running on a real Flex, as opposed to an OT-2 or a local dev machine.
    """
    await _RESET_MARKER_PATH.write_text(
        encoding="utf-8", data=_RESET_MARKER_FILE_CONTENTS
    )
