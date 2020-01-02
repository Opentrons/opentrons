from opentrons.types import Mount
from opentrons.hardware_control import adapters, API


def test_synch_adapter(loop):
    api = API.build_hardware_simulator(loop=loop)
    synch = adapters.SynchronousAdapter(api)
    synch.cache_instruments({Mount.LEFT: 'p10_single'})
    assert synch.attached_instruments[Mount.LEFT]['name']\
                .startswith('p10_single')
    # synch.join()
