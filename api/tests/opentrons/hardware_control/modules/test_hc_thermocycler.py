from opentrons.hardware_control import modules


def test_sim_initialization():
    temp = modules.build('', 'thermocycler', True, lambda x: None)
    assert isinstance(temp, modules.AbstractModule)


def test_lid():
    temp = modules.build('', 'thermocycler', True, lambda x: None)
    assert temp.lid_status == 'open'

    temp.open()
    assert temp.lid_status == 'open'

    temp.close()
    assert temp.lid_status == 'closed'

    temp.close()
    assert temp.lid_status == 'closed'

    temp.open()
    assert temp.lid_status == 'open'
