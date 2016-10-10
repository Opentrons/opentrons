# Quick Examples
The following examples assume the containers and pipettes:
```python
robot = Robot.get_instance()

tiprack = containers.load('tiprack-200ul', 'A1')
plate = containers.load('96-flat', 'B1')
trough = containers.load('trough-12row', 'C1')
trash = containers.load('point', 'C2')
    
p200 = instruments.Pipette(
    min_volume=2,
    axis="b",
    channels=1
)
```
## Robot Commands
####Run the virtual-smoothie
```python
robot.connect() # creates a virtual-smoothie
```

####Run on a physical robot
List your serial ports
```python
my_ports = robot.list_serial_ports()
print(my_ports)
```
will print...
```
[ '/dev/tty.usbmodem1421' ]
```
Pass the port name into `.connect()` to connect to a physical robot
```
robot.connect('/dev/tty.usbmodem1421')
```

####Home the robot
```python
robot.home() # homes Z first, then all other axis
robot.home('ab') # you can also specify the axis
```

####Clear, create, then run commands
```python
robot.clear()        # delets all previously created commands

p200.aspirate(100)   # new commands
p200.dispense()

robot.run()          # run all commands
```

## Pipette Commands
####Aspirate then dispense in a single well

```python
p200.aspirate(100, plate['A1']).dispense()
```

####Transfer from one well to another

 ```python
p200.aspirate(100, plate['A1']).dispense(plate['B1'])
```

####Pick up then drop tip at a single location

```python
p200.pick_up_tip(tiprack['A1']).drop_tip()
```

####Pick up then drop tip somewhere else

```python
p200.pick_up_tip(tiprack['A1']).drop_tip('B1')
p200.pick_up_tip(tiprack['B1']).drop_tip(trash)
```

####Mixing at a well

 ```python
p200.aspirate(100, plate['A1']).mix(3)
```

####Iterating through wells

```python
for i in range(96):
  p200.aspirate(100, plate[i]).mix(3)
```

####Distribute to multiple wells

```python
p200.aspirate(100, plate['A1'])
p200.dispense(30, plate['B1']).dispense(35, plate['B2']).dispense(45, plate['B3'])
```

####Delay

```python
p200.aspirate(110, plate['A1']).delay(2).dispense(10)
p200.dispense(plate['B2'])
```

## Use Cases

####Distribute to entire plate

```python
robot.clear()

p200.pick_up_tip(tiprack['A1'])

dispense_volume = 13
for i in range(95):
  # refill the tip if it's empty
  if p200.current_volume < dispense_volume:
    p200.aspirate(trough['A1])
  p200.dispense(dispense_volume, plate[i]).touch_tip()

p200.drop_tip(trash)

robot.run()
```
####Plate mapping

```python
sources = {
  'A1': 'water',
  'A2': 'sugar',
  'A3': 'purple'
}
destinations = {
  'A1': {'water': 35, 'sugar': 10, 'purple': 12},
  'B1': {'water': 35, 'sugar': 20, 'purple': 12},
  'C1': {'water': 35, 'sugar': 30, 'purple': 12},
  'D1': {'water': 35, 'sugar': 40, 'purple': 12},
  'E1': {'water': 55, 'sugar': 10, 'purple': 14},
  'F1': {'water': 55, 'sugar': 20, 'purple': 14},
  'G1': {'water': 55, 'sugar': 30, 'purple': 14},
  'H1': {'water': 55, 'sugar': 40, 'purple': 14}
}

robot.clear()

for source_well, ingredient in sources.items():
  # each ingredient has it's own tip
  p200.pick_up_tip(tiprack[source_well])
  # loop through all destination wells
  for destination_well, mapping in destinations.items():
    dispense_volume = mapping[ingredient]
    # refill this tip if it's empty
    if p200.current_volume < dispense_volume:
     p200.aspirate(trough[source_well])
    p200.dispense(dispense_volume, plate[destination_well])
  # blow out the extra liquid, then save the tip
  p200.blow_out(trash).drop_tip(tiprack[source_well])
  
robot.run()
```

####Precision pipetting within a well

```python
robot.clear()

p200.pick_up_tip(tiprack[3])

# aspirate from 3mm above the bottom of the well
well_bottom = plate[0].from_center(x=0, y=0, z=-1)
well_bottom_3mm = well_bottom + (0, 0, 3)
source = (plate[0], well_bottom_3mm)
p200.aspirate(source)

# rotate around the edge of the well
# dropping 10ul at a time
theta = 0.0
while p200.current_volume > 0:
    # we can move around a circle with radius (r) and theta (degrees)
    well_edge = plate[1].from_center(r=1.0, theta=theta, h=0.9)
    destination = (plate[1], well_edge)
    p200.dispense(10, destination)
    theta += 0.314

p200.drop_tip(tiprack[3])

robot.run()
```
