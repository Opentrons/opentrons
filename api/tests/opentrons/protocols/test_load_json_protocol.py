from opentrons import robot, protocols


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
