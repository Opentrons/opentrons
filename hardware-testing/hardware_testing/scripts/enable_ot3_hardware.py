"""Enable OT3 hardware on this machine."""
import argparse
import asyncio
from typing import Optional

from opentrons import should_use_ot3
from opentrons.config.advanced_settings import set_adv_setting


async def _enable_ot3_hardware_controller(enable: Optional[bool] = True) -> None:
    print(f"Setting to {enable}")
    await set_adv_setting("enableOT3HardwareController", enable)
    print(f"should_use_ot3() -> {should_use_ot3()}")
    print("done!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--disable", action="store_true")
    args = parser.parse_args()
    asyncio.run(_enable_ot3_hardware_controller(not args.disable))
