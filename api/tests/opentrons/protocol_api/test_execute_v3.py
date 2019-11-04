from opentrons.types import Point
from opentrons.protocol_api import execute_v3, ProtocolContext, execute
from opentrons.protocols.parse import parse


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

    def _make_operation_setter(self, name):
        class Setter:
            def __init__(self, name, log):
                self._name = name
                self._log = log
                self._aspirate = 0
                self._blow_out = 0
                self._dispense = 0

            @property
            def aspirate(self):
                return self._aspirate

            @aspirate.setter
            def aspirate(self, new_val):
                self._log.append(('set: ' + name + '.aspirate', (new_val,)))
                self._aspirate = new_val

            @property
            def dispense(self):
                return self._dispense

            @dispense.setter
            def dispense(self, new_val):
                self._log.append(('set: ' + name + '.dispense', (new_val,)))
                self._dispense = new_val

            @property
            def blow_out(self):
                return self._blow_out

            @blow_out.setter
            def blow_out(self, new_val):
                self._log.append(('set: ' + name + '.blow_out', (new_val,)))
                self._blow_out = new_val
        return Setter(name, self.log)

    def __getattr__(self, name):
        if name == 'log':
            return self.log
        elif name == 'flow_rate':
            return self._make_operation_setter(name)
        else:
            return self._make_logger(name)

    def __setattr__(self, name, value):
        if name == 'log':
            super(MockPipette, self).__setattr__(name, value)
        else:
            self.log.append(("set: {}".format(name), value))


def test_dispatch_commands(monkeypatch, loop, get_json_protocol_fixture):
    protocol_data = get_json_protocol_fixture('3', 'simple')
    command_log = []
    mock_pipette = MockPipette(command_log)
    insts = {"pipetteId": mock_pipette}

    ctx = ProtocolContext(loop=loop)

    def mock_delay(seconds=0, minutes=0, msg=None):
        command_log.append(("delay", seconds + minutes * 60))

    monkeypatch.setattr(ctx, 'delay', mock_delay)

    source_plate = ctx.load_labware(
        'corning_96_wellplate_360ul_flat', '1')
    dest_plate = ctx.load_labware(
        'corning_96_wellplate_360ul_flat', '2')
    tiprack = ctx.load_labware('opentrons_96_tiprack_10ul', '3')

    loaded_labware = {
        'sourcePlateId': source_plate,
        'destPlateId': dest_plate,
        'tiprackId': tiprack,
        'trashId': ctx.fixed_trash
    }

    execute_v3.dispatch_json(
        ctx, protocol_data, insts, loaded_labware)

    assert command_log == [
        ("pick_up_tip", (tiprack['B1'],)),
        ("set: flow_rate.aspirate", (3,)),
        ("set: flow_rate.dispense", (3,)),
        ("set: flow_rate.blow_out", (3,)),
        ("aspirate", (5, source_plate['A1'].bottom(2),)),
        ("delay", 42),
        ("set: flow_rate.aspirate", (2.5,)),
        ("set: flow_rate.dispense", (2.5,)),
        ("set: flow_rate.blow_out", (2.5,)),
        ("dispense", (4.5, dest_plate['B1'].bottom(1),)),
        ("touch_tip", (dest_plate['B1'],),
            {"v_offset": 0.33000000000000007}),
        ("set: flow_rate.aspirate", (2,)),
        ("set: flow_rate.dispense", (2,)),
        ("set: flow_rate.blow_out", (2,)),
        ("blow_out", (dest_plate['B1'],)),
        ("move_to", (ctx.deck.position_for('5').move(Point(1, 2, 3)),),
            {"force_direct": None, "minimum_z_height": None}),
        ("drop_tip", (ctx.fixed_trash['A1'],))
    ]


def test_papi_execute_json_v3(monkeypatch, loop, get_json_protocol_fixture):
    protocol_data = get_json_protocol_fixture(
        '3', 'testAllAtomicSingleV3', False)
    protocol = parse(protocol_data, None)
    ctx = ProtocolContext(loop=loop)
    ctx.home()
    # Check that we end up executing the protocol ok
    execute.run_protocol(protocol, ctx)
