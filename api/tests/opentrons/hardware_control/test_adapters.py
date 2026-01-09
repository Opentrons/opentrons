from opentrons.hardware_control import API, ThreadManager
from opentrons.types import Mount


async def test_synch_adapter() -> None:
    thread_manager = ThreadManager(API.build_hardware_simulator)
    synch = thread_manager.sync
    synch.cache_instruments({Mount.LEFT: "p10_single"})
    assert synch.attached_instruments[Mount.LEFT]["name"].startswith("p10_single")
    thread_manager.clean_up()
