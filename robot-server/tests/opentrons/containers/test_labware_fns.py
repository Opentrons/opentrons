# TODO: Revise to match new schemas and use json-schema validation in test


def test_labware_create(labware, config_tempdir):
    n_cols = 6
    n_rows = 4
    x_dist = 19.6
    y_dist = 19.6
    radius = 5.65
    depth = 84

    lw = labware.create(
        'testing-lw',
        grid=(n_cols, n_rows),
        spacing=(x_dist, y_dist),  # distances (mm) between each (column, row)
        diameter=radius * 2,
        depth=depth)

    row_a_center = ((n_rows - 1) * y_dist) + radius
    col_1_center = radius
    row_d_center = radius
    col_6_center = ((n_cols - 1) * x_dist) + radius

    expected = {
        'A1': (col_1_center, row_a_center, depth),
        'D1': (col_1_center, row_d_center, depth),
        'A6': (col_6_center, row_a_center, depth),
        'D6': (col_6_center, row_d_center, depth)
    }

    labware_coords = lw.coordinates()  # currently (0, 0, 0)

    def top(well):
        wc = well.coordinates()
        wt = well.top()[1]
        return labware_coords + wc + wt

    actual = {key: top(lw[key]) for key in expected.keys()}

    for key in expected.keys():
        assert expected[key] == actual[key]
