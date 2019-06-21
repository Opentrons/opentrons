from pathlib import Path
import json
from opentrons.types import Point
from opentrons.protocol_api import execute_v3, ProtocolContext


def test_load_labware_v2(loop, get_labware_fixture):
    ctx = ProtocolContext(loop=loop)
    custom_trough_def = get_labware_fixture('fixture_12_trough')
    data = {
        "labwareDefinitions": {
            "someTroughDef": custom_trough_def
        },
        "labware": {
            "sourcePlateId": {
                "slot": "10",
                "definitionId": "someTroughDef",
                "displayName": "Source (Buffer)"
            },
            "destPlateId": {
                "slot": "11",
                "definitionId": "someTroughDef"
            },
        }
    }
    loaded_labware = execute_v3.load_labware_from_json_defs(ctx, data)

    # objects in loaded_labware should be same objs as labware objs in the deck
    assert loaded_labware['sourcePlateId'] == ctx.loaded_labwares[10]
    # use the displayName from protocol's labware.labwareId.displayName
    assert 'Source (Buffer)' in str(loaded_labware['sourcePlateId'])
    assert loaded_labware['destPlateId'] == ctx.loaded_labwares[11]
    # use the metadata.displayName from embedded def
    assert (custom_trough_def['metadata']['displayName'] in
            str(loaded_labware['destPlateId']))


class MockPipette(object):
    def __init__(self, command_log):
        self.log = command_log

    def _make_logger(self, name):
        def log_fn(*args, **kwargs):
            if kwargs:
                self.log.append((name, args, kwargs))
            else:
                self.log.append((name, args))
        return log_fn

    def __getattr__(self, name):
        if name == 'log':
            return self.log
        else:
            return self._make_logger(name)

    def __setattr__(self, name, value):
        if name == 'log':
            super(MockPipette, self).__setattr__(name, value)
        else:
            self.log.append(("set: {}".format(name), value))


def test_dispatch_commands(monkeypatch, loop):
    with open(Path(__file__).parent/'data'/'v3_json_dispatch.json',
              'r') as f:
        protocol_data = json.load(f)

    command_log = []
    mock_pipette = MockPipette(command_log)
    insts = {"pipetteId": mock_pipette}

    ctx = ProtocolContext(loop=loop)

    def mock_delay(seconds=0, minutes=0, msg=None):
        command_log.append(("delay", seconds + minutes * 60))

    monkeypatch.setattr(ctx, 'delay', mock_delay)

    source_plate = ctx.load_labware_by_name(
        'generic_96_wellplate_340ul_flat', '1')
    dest_plate = ctx.load_labware_by_name(
        'generic_96_wellplate_340ul_flat', '2')
    tiprack = ctx.load_labware_by_name('opentrons_96_tiprack_10ul', '3')

    loaded_labware = {
        'sourcePlateId': source_plate,
        'destPlateId': dest_plate,
        'tiprackId': tiprack,
        'trashId': ctx.fixed_trash
    }

    execute_v3.dispatch_json(
        ctx, protocol_data, insts, loaded_labware)

    assert command_log == [
        ("pick_up_tip", (tiprack.wells_by_index()['B1'],)),
        ("set: flow_rate", {"aspirate": 3, "dispense": 3}),
        ("aspirate", (5, source_plate.wells_by_index()['A1'].bottom(2),)),
        ("delay", 42),
        ("set: flow_rate", {"aspirate": 2.5, "dispense": 2.5}),
        ("dispense", (4.5, dest_plate.wells_by_index()['B1'].bottom(1),)),
        ("touch_tip", (dest_plate.wells_by_index()['B1'],),
            {"v_offset": 0.46000000000000085}),
        ("set: flow_rate", {"aspirate": 2, "dispense": 2}),
        ("blow_out", (dest_plate.wells_by_index()['B1'],)),
        ("move_to", (ctx.deck.position_for('5').move(Point(1, 2, 3)),),
            {"force_direct": None, "minimum_z_height": None}),
        ("drop_tip", (ctx.fixed_trash.wells_by_index()['A1'],))
    ]
