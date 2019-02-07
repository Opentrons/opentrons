import json
import pkgutil

import pytest

from opentrons.config import pipette_config, feature_flags as ff


defs = json.loads(
    pkgutil.get_data(
        'opentrons', 'shared_data/robot-data/pipetteModelSpecs.json'))


@pytest.mark.parametrize('pipette_model',
                         [c for c in pipette_config.configs if not
                          (c.startswith('p1000')
                           or c.startswith('p300_multi'))])
def test_versioned_aspiration(pipette_model, monkeypatch):

    monkeypatch.setattr(ff, 'use_old_aspiration_functions',
                        lambda: True)
    was = pipette_config.load(pipette_model)
    assert was.ul_per_mm['aspirate']\
        == pytest.approx(defs[pipette_model]['ulPerMm'][0]['aspirate'])
    assert was.ul_per_mm['dispense']\
        == pytest.approx(defs[pipette_model]['ulPerMm'][0]['dispense'])

    monkeypatch.setattr(ff, 'use_old_aspiration_functions',
                        lambda: False)
    now = pipette_config.load(pipette_model)
    assert now.ul_per_mm['aspirate']\
        == pytest.approx(defs[pipette_model]['ulPerMm'][-1]['aspirate'])
    assert now.ul_per_mm['dispense']\
        == pytest.approx(defs[pipette_model]['ulPerMm'][-1]['dispense'])

    assert now.ul_per_mm['aspirate'] != was.ul_per_mm['aspirate']


# TODO: make sure the mm of movement for max volume aspirate and max volume
# TODO: dispense agree
@pytest.mark.parametrize('pipette_model', pipette_config.configs)
def test_ul_per_mm_continuous(pipette_model):
    """
    For each model of pipette, for each boundary between pieces of the
    piecewise function describing the ul/mm relationship, test that the
    function is continuous by checking the boundary volume on the curves of
    the pieces immediately above and below the boundary
    """
    config = pipette_config.load(pipette_model)
    sequence = config.ul_per_mm['aspirate']

    for lno in range(len(sequence) - 1):
        line = sequence[lno]
        volume = line[0]
        ul_per_mm_top = line[1]*volume + line[2]
        ul_per_mm_bottom = sequence[lno+1][1]*volume + sequence[lno+1][2]

        diff_mm = abs(ul_per_mm_top - ul_per_mm_bottom) / volume

        assert diff_mm < 1e-2
