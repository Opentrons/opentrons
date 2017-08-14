from opentrons import csv


def test_csv_module_imported():
    import csv as pycsv
    assert csv == pycsv
