import json
from opentrons.types import Point
from opentrons.protocol_api import execute_v3, ProtocolContext


def test_load_labware_v2(loop):
    ctx = ProtocolContext(loop=loop)
    # trough def with arbitrary ID
    data = {
        "labwareDefinitions": {
            "someTroughDef": json.loads("""{"ordering":[["A1"],["A2"],["A3"],["A4"],["A5"],["A6"],["A7"],["A8"],["A9"],["A10"],["A11"],["A12"]],"otId":"THIS IS A CUSTOM ID","deprecated":false,"metadata":{"displayName":"CUSTOM 12 Channel Trough","displayVolumeUnits":"mL","displayCategory":"trough"},"cornerOffsetFromSlot":{"x":0,"y":0.32,"z":0},"dimensions":{"overallLength":127.76,"overallWidth":85.8,"overallHeight":44.45},"parameters":{"format":"trough","isTiprack":false,"isMagneticModuleCompatible":false,"loadName":"usa_scientific_12_trough_22_ml","quirks":["centerMultichannelOnWells"]},"wells":{"A1":{"shape":"rectangular","depth":42.16,"length":8.33,"width":71.88,"totalLiquidVolume":22000,"x":13.94,"y":42.9,"z":2.29},"A2":{"shape":"rectangular","depth":42.16,"length":8.33,"width":71.88,"totalLiquidVolume":22000,"x":23.03,"y":42.9,"z":2.29},"A3":{"shape":"rectangular","depth":42.16,"length":8.33,"width":71.88,"totalLiquidVolume":22000,"x":32.12,"y":42.9,"z":2.29},"A4":{"shape":"rectangular","depth":42.16,"length":8.33,"width":71.88,"totalLiquidVolume":22000,"x":41.21,"y":42.9,"z":2.29},"A5":{"shape":"rectangular","depth":42.16,"length":8.33,"width":71.88,"totalLiquidVolume":22000,"x":50.3,"y":42.9,"z":2.29},"A6":{"shape":"rectangular","depth":42.16,"length":8.33,"width":71.88,"totalLiquidVolume":22000,"x":59.39,"y":42.9,"z":2.29},"A7":{"shape":"rectangular","depth":42.16,"length":8.33,"width":71.88,"totalLiquidVolume":22000,"x":68.48,"y":42.9,"z":2.29},"A8":{"shape":"rectangular","depth":42.16,"length":8.33,"width":71.88,"totalLiquidVolume":22000,"x":77.57,"y":42.9,"z":2.29},"A9":{"shape":"rectangular","depth":42.16,"length":8.33,"width":71.88,"totalLiquidVolume":22000,"x":86.66,"y":42.9,"z":2.29},"A10":{"shape":"rectangular","depth":42.16,"length":8.33,"width":71.88,"totalLiquidVolume":22000,"x":95.75,"y":42.9,"z":2.29},"A11":{"shape":"rectangular","depth":42.16,"length":8.33,"width":71.88,"totalLiquidVolume":22000,"x":104.84,"y":42.9,"z":2.29},"A12":{"shape":"rectangular","depth":42.16,"length":8.33,"width":71.88,"totalLiquidVolume":22000,"x":113.93,"y":42.9,"z":2.29}},"brand":{"brand":"USA Scientific","brandId":["1061-8150"]}}""")  # noqa
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
    assert 'CUSTOM 12 Channel Trough' in str(loaded_labware['destPlateId'])


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
    protocol_data = {
        "schemaVersion": "3",
        "commands": [
            {
                "command": "pickUpTip",
                "params": {
                    "pipette": "pipetteId",
                    "labware": "tiprackId",
                    "well": "B1"
                }
            },
            {
                "command": "aspirate",
                "params": {
                    "pipette": "pipetteId",
                    "labware": "sourcePlateId",
                    "well": "A1",
                    "volume": 5,
                    "flowRate": 3,
                    "offsetFromBottomMm": 2
                }
            },
            {
                "command": "delay",
                "params": {
                    "wait": 42
                }
            },
            {
                "command": "dispense",
                "params": {
                    "pipette": "pipetteId",
                    "labware": "destPlateId",
                    "well": "B1",
                    "volume": 4.5,
                    "flowRate": 2.5,
                    "offsetFromBottomMm": 1
                }
            },
            {
                "command": "touchTip",
                "params": {
                    "pipette": "pipetteId",
                    "labware": "destPlateId",
                    "well": "B1",
                    "offsetFromBottomMm": 11
                }
            },
            {
                "command": "blowout",
                "params": {
                    "pipette": "pipetteId",
                    "labware": "destPlateId",
                    "well": "B1",
                    "flowRate": 2,
                    "offsetFromBottomMm": 12
                }
            },
            {
                "command": "moveToSlot",
                "params": {
                    "pipette": "pipetteId",
                    "slot": "5",
                    "offset": {
                        "x": 1,
                        "y": 2,
                        "z": 3
                    }
                }
            },
            {
                "command": "dropTip",
                "params": {
                    "pipette": "pipetteId",
                    "labware": "trashId",
                    "well": "A1"
                }
            }
        ]
    }

    command_log = []
    mock_pipette = MockPipette(command_log)
    insts = {"pipetteId": mock_pipette}

    ctx = ProtocolContext(loop=loop)

    def mock_delay(seconds=0, minutes=0):
        command_log.append(("delay", seconds + minutes * 60))

    monkeypatch.setattr(ctx, 'delay', mock_delay)

    source_plate = ctx.load_labware_by_name('generic_96_wellplate_380_ul', '1')
    dest_plate = ctx.load_labware_by_name('generic_96_wellplate_380_ul', '2')
    tiprack = ctx.load_labware_by_name('opentrons_96_tiprack_10_ul', '3')

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
