.. _cookbook:

#################
Protocol Cookbook
#################

384 Plate Well Filling with 8-channel pipette
=============================================

An 8-channel pipette will fit into every other well on a 384 well plate:
it can fit into A1 A3 A5 A7 A9 A11 A13, but not A1 A2.

In the Opentrons API, the clearest way to direct an 8-channel pipette to a location
is to pass it a ``WellSeries`` returned by ``myContainer.rows(row_number)``.

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

  # create a list of staggered wells for each row,
  # first starting from A then starting from B:
  # [A1-O1, B1-P1, A2-O2, B2-P2, A3-O3, B3-P3, ...]

  alternating_wells = []
  for row in plate.rows():
      alternating_wells.append(row.wells('A', length=8, step=2))
      alternating_wells.append(row.wells('B', length=8, step=2))

  # to transfer from the trough to every well in the 384 plate:
  p200.transfer(50, trough.wells('A1'), alternating_wells)

To dispense at the **bottom** of every well in the 384 plate,
we can take the first well from each row.

In the Opentrons API, when you give an 8-channel pipette a single well
instead of a WellSeries row, the pipette will place its **leftmost** channel
in the well you specify.

So for a 384 plate, you should specify all the A and B wells.

.. testcode:: 384filling

  alternating_well_bottoms = [row[0].bottom() for row in alternating_wells]

  p200.transfer(50, trough.wells('A1'), alternating_well_bottoms)
