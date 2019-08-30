from opentrons import robot, labware, instruments
from opentrons.legacy_api.protocols import execute_v3
# TODO: Modify all calls to get a Well to use the `wells` method


def test_load_pipettes():
    data = {
        "pipettes": {
            "leftPipetteHere": {
                "mount": "left",
                "name": "p10_single"
            }
        }
    }

    robot.reset()

    loaded_pipettes = execute_v3.load_pipettes(data)
    robot_instruments = robot.get_instruments()

    assert len(robot_instruments) == 1
    mount, pipette = robot_instruments[0]
    assert mount == 'left'
    # loaded pipette in result dict should match that in robot_instruments
    assert pipette == loaded_pipettes['leftPipetteHere']


def test_get_location():
    robot.reset()

    command_type = 'aspirate'
    plate = labware.load("96-flat", 1)
    well = "B2"

    loaded_labware = {
        "someLabwareId": plate
    }

    # test with nonzero and with zero command-specific offset
    for offset in [5, 0]:
        command_params = {
            "labware": "someLabwareId",
            "well": well,
            "offsetFromBottomMm": offset
        }
        result = execute_v3._get_location(
            loaded_labware, command_type, command_params)
        assert result == plate.well(well).bottom(offset)


def test_load_labware(get_labware_fixture):
    robot.reset()
    fixture_96_plate = get_labware_fixture('fixture_96_plate')
    data = {
        "labwareDefinitions": {
            "someDefId": fixture_96_plate
        },
        "labware": {
            "sourcePlateId": {
              "slot": "10",
              "definitionId": "someDefId",
              "displayName": "Source (Buffer)"
            },
            "destPlateId": {
              "slot": "11",
              "definitionId": "someDefId",
              "displayName": "Destination Plate"
            },
        }
    }
    loaded_labware = execute_v3.load_labware(data)

    # objects in loaded_labware should be same objs as labware objs in the deck
    assert loaded_labware['sourcePlateId'] in robot.deck['10']
    assert loaded_labware['destPlateId'] in robot.deck['11']


def test_load_labware_trash():
    robot.reset()
    data = {
        "labwareDefinitions": {
            "someTrashLabwareId": {
                "parameters": {
                    "quirks": ["fixedTrash"]
                }
            }
        },
        "labware": {
            "someTrashId": {
                "slot": "12",
                "definitionId": "someTrashLabwareId"
            }
        }
    }
    result = execute_v3.load_labware(data)

    assert result['someTrashId'] == robot.fixed_trash


def test_dispatch_commands(monkeypatch):
    robot.reset()
    cmd = []
    flow_rates = []

    def mock_sleep(seconds):
        cmd.append(("sleep", seconds))

    def mock_aspirate(volume, location):
        cmd.append(("aspirate", volume, location))

    def mock_dispense(volume, location):
        cmd.append(("dispense", volume, location))

    def mock_blowout(location):
        cmd.append(("blowout", location))

    def mock_set_flow_rate(aspirate, dispense, blow_out):
        flow_rates.append((aspirate, dispense, blow_out))

    pipette = instruments.P10_Single('left')

    loaded_pipettes = {
        'pipetteId': pipette
    }

    source_plate = labware.load('96-flat', '1')
    dest_plate = labware.load('96-flat', '2')

    loaded_labware = {
        'sourcePlateId': source_plate,
        'destPlateId': dest_plate
    }

    monkeypatch.setattr(pipette, 'aspirate', mock_aspirate)
    monkeypatch.setattr(pipette, 'dispense', mock_dispense)
    monkeypatch.setattr(pipette, 'blow_out', mock_blowout)
    monkeypatch.setattr(pipette, 'set_flow_rate', mock_set_flow_rate)
    monkeypatch.setattr(execute_v3, '_sleep', mock_sleep)

    aspirateOffset = 12.1
    dispenseOffset = 12.2
    blowoutOffset = 15

    protocol_data = {
        "defaultValues": {
            "aspirateFlowRate": {
                "p300_single": 101
            },
            "dispenseFlowRate": {
                "p300_single": 102
            }
        },
        "pipettes": {
            "pipetteId": {
                "mount": "left",
                "name": "p300_single"
            }
        },
        "commands": [
            {
                "command": "aspirate",
                "params": {
                    "pipette": "pipetteId",
                    "labware": "sourcePlateId",
                    "well": "A1",
                    "volume": 5,
                    "flowRate": 123,
                    "offsetFromBottomMm": aspirateOffset
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
                    "flowRate": 3.5,
                    "offsetFromBottomMm": dispenseOffset
                }
            },
            {
                "command": "blowout",
                "params": {
                    "pipette": "pipetteId",
                    "labware": "destPlateId",
                    "well": "C1",
                    "flowRate": 7,
                    "offsetFromBottomMm": blowoutOffset
                }
            },
        ]
    }

    execute_v3.dispatch_commands(
        protocol_data, loaded_pipettes, loaded_labware)

    assert cmd == [
        ("aspirate", 5, source_plate['A1'].bottom(aspirateOffset)),
        ("sleep", 42),
        ("dispense", 4.5, dest_plate['B1'].bottom(dispenseOffset)),
        ("blowout", dest_plate['C1'].bottom(blowoutOffset))
    ]

    assert flow_rates == [
        (123, 123, 123),
        (3.5, 3.5, 3.5),
        (7, 7, 7)
    ]
