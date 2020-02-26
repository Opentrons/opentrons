from opentrons.types import Mount
from opentrons.hardware_control import adapters, API, ThreadManager


async def test_synch_adapter():
    synch = ThreadManager(API.build_hardware_simulator).sync
    synch.cache_instruments({Mount.LEFT: 'p10_single'})
    assert synch.attached_instruments[Mount.LEFT]['name']\
                .startswith('p10_single')
