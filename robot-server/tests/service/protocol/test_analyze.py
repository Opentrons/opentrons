from pathlib import Path
from unittest.mock import patch

from robot_server.service.legacy.models.control import Mount
from robot_server.service.protocol import contents, models
from robot_server.service.protocol.analyze import _analyze
from robot_server.util import FileMeta


def test_():
    """"""
    proto = """
metadata = {
    'protocolName': 'Zymo Extraction',
    'author': 'Opentrons <protocols@opentrons.com>',
    'apiLevel': '2.4'
}

def run(ctx):
    magdeck = ctx.load_module('magnetic module gen2', '6')
    magplate = magdeck.load_labware('nest_96_wellplate_2ml_deep',
                                    'deepwell plate')
    tempdeck = ctx.load_module('Temperature Module Gen2', '1')
    elutionplate = tempdeck.load_labware(
                'opentrons_96_aluminumblock_nest_wellplate_100ul',
                'elution plate')
    ctx.load_labware('nest_1_reservoir_195ml', '9', 'Liquid Waste')
    ctx.load_labware('nest_12_reservoir_15ml', '3', 'reagent reservoir 2')
    ctx.load_labware('nest_12_reservoir_15ml', '2', 'reagent reservoir 1')
    [ctx.load_labware('opentrons_96_tiprack_300ul',
                      slot, '200µl filtertiprack') for slot in
                      ['4', '7', '8', '10', '11']]
    ctx.load_labware('opentrons_96_tiprack_300ul', '5', 'tiprack for parking')
    ctx.load_instrument('p300_multi_gen2', 'left')
    ctx.load_instrument('p20_single_gen2', 'right')
"""
    c = contents.Contents(
        protocol_file=FileMeta(path=Path("abc.py"), content_hash=""),
        support_files=[],
        directory=None)
    with patch.object(contents,
                      "get_protocol_contents", return_value=proto):
        r = _analyze(c)
        assert r.meta == models.Meta(
            name="Zymo Extraction",
            author="Opentrons <protocols@opentrons.com>",
            apiLevel="2.4"
        )
        assert sorted(r.required_equipment.labware, key=lambda x: x.slot) == [
            models.LoadedLabware(
                name='elution plate',
                type="opentrons_96_aluminumblock_nest_wellplate_100ul",
                slot=1
            ),
            models.LoadedLabware(
                type='nest_12_reservoir_15ml',
                slot=2,
                name='reagent reservoir 1'
            ),
            models.LoadedLabware(
                type='nest_12_reservoir_15ml',
                slot=3,
                name='reagent reservoir 2'),
            models.LoadedLabware(
                type='opentrons_96_tiprack_300ul',
                slot=4,
                name='200µl filtertiprack'),
            models.LoadedLabware(
                type='opentrons_96_tiprack_300ul',
                slot=5,
                name='tiprack for parking'),
            models.LoadedLabware(
                type='nest_96_wellplate_2ml_deep',
                slot=6,
                name='deepwell plate'),
            models.LoadedLabware(
                type='opentrons_96_tiprack_300ul',
                slot=7,
                name='200µl filtertiprack'),
            models.LoadedLabware(
                type='opentrons_96_tiprack_300ul',
                slot=8,
                name='200µl filtertiprack'),
            models.LoadedLabware(
                type='nest_1_reservoir_195ml',
                slot=9,
                name='Liquid Waste'),
            models.LoadedLabware(
                type='opentrons_96_tiprack_300ul',
                slot=10,
                name='200µl filtertiprack'),
            models.LoadedLabware(
                type='opentrons_96_tiprack_300ul',
                slot=11,
                name='200µl filtertiprack'),
            models.LoadedLabware(
                type="opentrons_1_trash_1100ml_fixed",
                slot=12,
                name="opentrons_1_trash_1100ml_fixed"
            )
        ]

        assert len(r.required_equipment.pipettes) == 2
        assert models.LoadedPipette(mount=Mount.left,
                                    name="p300_multi_gen2",
                                    pipetteName="p300_multi_gen2",
                                    channels=8) \
               in r.required_equipment.pipettes
        assert models.LoadedPipette(mount=Mount.right,
                                    name="p20_single_gen2",
                                    pipetteName="p20_single_gen2",
                                    channels=1) \
               in r.required_equipment.pipettes
        assert len(r.required_equipment.modules) == 2
        assert models.LoadedModule(name='temperatureModuleV2',
                                   slot=1,
                                   model="TEMPERATURE_V2") \
               in r.required_equipment.modules
        assert models.LoadedModule(name="magneticModuleV2",
                                   slot=6,
                                   model="MAGNETIC_V2") \
               in r.required_equipment.modules
