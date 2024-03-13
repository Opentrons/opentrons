# Pulled from: https://github.com/Opentrons/opentrons/pull/14491


requirements = {
    "robotType": "OT-2",
    "apiLevel": "2.15",
}


def run(protocol):
    thermocycler = protocol.load_module("thermocycler module gen2")

    assert protocol.loaded_modules == {7: thermocycler}
    assert protocol.deck["7"] == thermocycler
    assert protocol.deck["8"] == thermocycler
    assert protocol.deck["10"] == thermocycler
    assert protocol.deck["11"] == thermocycler
