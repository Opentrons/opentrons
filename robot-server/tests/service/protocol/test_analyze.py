from pathlib import Path
from unittest.mock import patch

from robot_server.service.legacy.models.control import Mount
from robot_server.service.protocol import contents, models
from robot_server.service.protocol.analyze import _analyze
from robot_server.util import FileMeta


def test_analyze():
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
                label='elution plate',
                uri=
                "opentrons/opentrons_96_aluminumblock_nest_wellplate_100ul/1",
                slot=1
            ),
            models.LoadedLabware(
                uri="opentrons/nest_12_reservoir_15ml/1",
                slot=2,
                label='reagent reservoir 1'
            ),
            models.LoadedLabware(
                uri="opentrons/nest_12_reservoir_15ml/1",
                slot=3,
                label='reagent reservoir 2'),
            models.LoadedLabware(
                uri="opentrons/opentrons_96_tiprack_300ul/1",
                slot=4,
                label='200µl filtertiprack'),
            models.LoadedLabware(
                uri="opentrons/opentrons_96_tiprack_300ul/1",
                slot=5,
                label='tiprack for parking'),
            models.LoadedLabware(
                uri="opentrons/nest_96_wellplate_2ml_deep/1",
                slot=6,
                label='deepwell plate'),
            models.LoadedLabware(
                uri="opentrons/opentrons_96_tiprack_300ul/1",
                slot=7,
                label='200µl filtertiprack'),
            models.LoadedLabware(
                uri="opentrons/opentrons_96_tiprack_300ul/1",
                slot=8,
                label='200µl filtertiprack'),
            models.LoadedLabware(
                uri="opentrons/nest_1_reservoir_195ml/1",
                slot=9,
                label='Liquid Waste'),
            models.LoadedLabware(
                uri="opentrons/opentrons_96_tiprack_300ul/1",
                slot=10,
                label='200µl filtertiprack'),
            models.LoadedLabware(
                uri="opentrons/opentrons_96_tiprack_300ul/1",
                slot=11,
                label='200µl filtertiprack'),
            models.LoadedLabware(
                uri="opentrons/opentrons_1_trash_1100ml_fixed/1",
                slot=12,
                label="opentrons_1_trash_1100ml_fixed"
            )
        ]

        assert len(r.required_equipment.pipettes) == 2
        assert models.LoadedPipette(mount=Mount.left,
                                    requestedAs="p300_multi_gen2",
                                    pipetteName="p300_multi_gen2",
                                    channels=8) \
               in r.required_equipment.pipettes
        assert models.LoadedPipette(mount=Mount.right,
                                    requestedAs="p20_single_gen2",
                                    pipetteName="p20_single_gen2",
                                    channels=1) \
               in r.required_equipment.pipettes
        assert len(r.required_equipment.modules) == 2
        assert models.LoadedModule(type='temperatureModuleType',
                                   slot=1,
                                   model="temperatureModuleV2") \
               in r.required_equipment.modules
        assert models.LoadedModule(type="magneticModuleType",
                                   slot=6,
                                   model="magneticModuleV2") \
               in r.required_equipment.modules
