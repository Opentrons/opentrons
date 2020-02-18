from opentrons.commands import tree


def test_command_tree():
    commands = tree.from_list([
        {'level': 0, 'description': 'A', 'id': 0},
        {'level': 0, 'description': 'B', 'id': 1},
        {'level': 0, 'description': 'C', 'id': 2}
    ])

    assert commands == [
        {
            'description': 'A',
            'id': 0,
            'children': []
        },
        {
            'description': 'B',
            'id': 1,
            'children': []
        },
        {
            'description': 'C',
            'id': 2,
            'children': []
        },
    ]

    commands = tree.from_list([
        {'level': 0, 'description': 'A', 'id': 0},
        {'level': 1, 'description': 'B', 'id': 1},
        {'level': 2, 'description': 'C', 'id': 2},
        {'level': 0, 'description': 'D', 'id': 3},
    ])

    assert commands == [
        {
            'description': 'A',
            'id': 0,
            'children': [{
                    'description': 'B',
                    'id': 1,
                    'children': [{
                                'description': 'C',
                                'id': 2,
                                'children': []
                            }]
                    }]
        },
        {
            'description': 'D',
            'id': 3,
            'children': []
        }
    ]
