from opentrons.hardware_control import modules


def test_sim_initialization():
    temp = modules.build('', 'thermocycler', True)
    assert isinstance(temp, modules.AbstractModule)
