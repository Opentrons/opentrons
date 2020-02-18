import pytest
from opentrons.commands import stringify_location


@pytest.fixture
def containers(singletons):
    containers = singletons['labware']
    return {
        '1': containers.load('96-flat', '1'),
        '11': containers.load('96-flat', '11')
    }


@pytest.mark.api1_only
def test_all(containers):
    assert stringify_location(containers['1'][0]) == 'well A1 in "1"'
    assert stringify_location(containers['1'].rows(0)) == \
        'wells A1...A12 in "1"'
    assert stringify_location(containers['11'][95]) == 'well H12 in "11"'
    assert stringify_location(containers['11'].cols(0)) == \
        'wells A1...H1 in "11"'
    assert stringify_location(containers['11'].rows('A', 'B')) == \
        'wells A1...B12 in "11"'
