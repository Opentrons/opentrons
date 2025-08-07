from opentrons_shared_data.labware import list_definitions


def test_list_definitions() -> None:
    """A very basic test on list_definitions to make sure it's returning _something_,
    i.e. it doesn't use a wrong hard-coded path or something like that.
    """
    assert len(list_definitions()) > 0
