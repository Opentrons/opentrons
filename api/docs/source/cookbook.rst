.. _cookbook:

#################
Protocol Cookbook
#################

384 Plate Well Filling with 8-channel pipette
=============================================

In the Opentrons API, the clearest way to direct an 8-channel pipette to a location
is to use ``myContainer.rows(row_number)``, which returns a ``WellSeries`` object
representing all the wells in a row.

For a 96-well plate, you can simply specify ``my96Plate.rows(row_number)``, which will
represent all 8 wells in that row.

However, for a 384-well plate, an 8-channel pipette will fit into **every other well** in a row.
The 8-channel can fit into A1 C1 E1 G1 I1 K1 M1 O1 of a 384-well plate, not A1 B1 C1 etc.

``my384Plate.rows(row_number)`` will represent all 16 wells in a row.
To get every other well starting from the A column, we can do ``row.wells('A', length=8, step=2)``.
And to get every other well starting from the B column, do ``row.wells('B', length=8, step=2)``.


.. testcode:: 384filling

  from opentrons import containers, instruments

  plate = containers.load('384-plate', 'B1')
  trough = containers.load('trough-12row', 'C1')

  tiprack_1 = containers.load('tiprack-200ul', 'A1')
  trash = containers.load('trash-box', 'E1')

  p200 = instruments.Pipette(
      axis="b",
      max_volume=200,
      tip_racks=[tiprack_1],
      trash_container=trash)

  # create a list of alternating wells for each row,
  # first starting from A then starting from B:
  # [A1-O1, B1-P1, A2-O2, B2-P2, A3-O3, B3-P3, ...]

  alternating_wells = []
  for row in plate.rows():
      alternating_wells.append(row.wells('A', length=8, step=2))
      alternating_wells.append(row.wells('B', length=8, step=2))

  # to transfer from the trough to every well in the 384 plate:
  p200.transfer(50, trough.wells('A1'), alternating_wells)

Dispensing at the bottom while filling a 384 plate
--------------------------------------------------

To dispense at the **bottom** of every well in the 384 plate,
we can take the first well from each row and use the ``Well.bottom()`` method
to specify the bottom of the well.

In the Opentrons API, when you give an 8-channel pipette a single well
instead of a WellSeries row, the pipette will place its **leftmost** channel
in the well you specify.

For a 384 plate, you should specify all the A and B wells. Since we already have
alternating rows, we will take the first well in each row and specify to use that well's
bottom with ``.bottom()``:

.. testcode:: 384filling

  alternating_well_bottoms = [row[0].bottom() for row in alternating_wells]

  p200.transfer(50, trough.wells('A1'), alternating_well_bottoms)
