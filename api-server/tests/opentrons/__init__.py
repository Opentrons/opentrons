def generate_plate(wells, cols, spacing, offset, radius, height=0):
    from opentrons.legacy_api.containers.placeable import Container, Well
    c = Container()
    c.ordering = []
    n_rows = int(wells / cols)
    for i in range(n_rows):
        c.ordering.append([])
    for i in range(0, wells):
        well = Well(properties={'radius': radius, 'height': height})
        row, col = divmod(i, cols)
        name = chr(col + ord('A')) + str(1 + row)
        c.ordering[row].append(name)
        coordinates = (col * spacing[0] + offset[0],
                       row * spacing[1] + offset[1],
                       0)
        c.add(well, name, coordinates)
    return c
