from opentrons import robot, protocols, labware, instruments


def test_load_pipettes():
    robot.reset()
    data = {
        "pipettes": {
            "leftPipetteHere": {
                "mount": "left",
                "model": "p10_single_v1"
            }
        }
    }
    loaded_pipettes = protocols.load_pipettes(data)
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

    default_values = {
        'aspirate-mm-from-bottom': 2
    }

    loaded_labware = {
        "someLabwareId": plate
    }

    # test with nonzero and with zero command-specific offset
    for offset in [5, 0]:
        command_params = {
            "labware": "someLabwareId",
            "well": well,
            "offset-from-bottom-mm": offset
        }
        result = protocols.get_location(
            loaded_labware, command_type, command_params, default_values)
        assert result == plate.well(well).bottom(offset)

    command_params = {
        "labware": "someLabwareId",
        "well": well
    }

    # no command-specific offset, use default
    result = protocols.get_location(
        loaded_labware, command_type, command_params, default_values)
    assert result == plate.well(well).bottom(
        default_values['aspirate-mm-from-bottom'])


def test_load_labware():
    robot.reset()
    data = {
        "labware": {
            "sourcePlateId": {
              "slot": "10",
              "model": "trough-12row",
              "display-name": "Source (Buffer)"
            },
            "destPlateId": {
              "slot": "11",
              "model": "96-flat",
              "display-name": "Destination Plate"
            },
        }
    }
    loaded_labware = protocols.load_labware(data)

    # objects in loaded_labware should be same objs as labware objs in the deck
    assert loaded_labware['sourcePlateId'] in robot.deck['10']
    assert loaded_labware['destPlateId'] in robot.deck['11']


def test_load_labware_trash():
    robot.reset()
    data = {
        "labware": {
            "someTrashId": {
                "slot": "12",
                "model": "fixed-trash"
            }
        }
    }
    result = protocols.load_labware(data)

    assert result['someTrashId'] == robot.fixed_trash


def test_blank_protocol():
    result = protocols.execute_protocol({})
    assert result == {
        'pipettes': {},
        'labware': {}
    }


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

    def mock_set_flow_rate(aspirate, dispense):
        flow_rates.append((aspirate, dispense))

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
    monkeypatch.setattr(pipette, 'set_flow_rate', mock_set_flow_rate)
    monkeypatch.setattr(protocols, '_sleep', mock_sleep)

    protocol_data = {
        "default-values": {
            "aspirate-flow-rate": {
                "p300_single_v1": 101
            },
            "dispense-flow-rate": {
                "p300_single_v1": 102
            }
        },
        "pipettes": {
            "pipetteId": {
                "mount": "left",
                "model": "p300_single_v1"
            }
        },
        "procedure": [
            {
                "subprocedure": [
                    {
                        "command": "aspirate",
                        "params": {
                            "pipette": "pipetteId",
                            "labware": "sourcePlateId",
                            "well": "A1",
                            "volume": 5,
                            "flow-rate": 123
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
                            "volume": 4.5
                        }
                    },
                ]
            }
        ]
    }

    protocols.dispatch_commands(
        protocol_data, loaded_pipettes, loaded_labware)

    assert cmd == [
        ("aspirate", 5, source_plate['A1']),
        ("sleep", 42),
        ("dispense", 4.5, dest_plate['B1'])
    ]

    assert flow_rates == [
        (123, 102),
        (101, 102)
    ]
