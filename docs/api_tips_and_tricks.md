# Quick Examples

## Basic Commands
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

####Delay

 ```python
p200.aspirate(110, plate['A1']).delay(2).dispense(10).dispense(100, plate['B2']
```

####Iterating through wells

```python
for i in range(96):
  p200.aspirate(100, source[i]).dispense(destination[i])
```

####Distribute to multiple wells

```python
p200.aspirate(100, plate['A1'])
p200.dispense(30, plate['B1']).dispense(35, plate['B2']).dispense(45, plate['B3'])
```

## Use Cases

####Plate mapping

```python
plate_map = {
  plate['A1']: {'water': 35, 'sugar': 10},
  plate['B1']: {'water': 35, 'sugar': 20},
  plate['C1']: {'water': 35, 'sugar': 30},
  plate['D1']: {'water': 35, 'sugar': 40},
  plate['A2']: {'water': 55, 'sugar': 10},
  plate['B2']: {'water': 55, 'sugar': 20},
  plate['C2']: {'water': 55, 'sugar': 30},
  plate['D2']: {'water': 55, 'sugar': 40}
}

sources = {'water': trough['A1'], 'sugar': trough['A2']}

for ingredient in ['water', 'sugar']:
  source_well = sources[ingredient]
  for well, volumes in plate_map.items():
    volume = volumes[ingredient]
    p200.aspirate(volume, source_well).dispense(well)


```

####Distribute to entire plate

```python
dispense_vol = 13
dispenses_per_tip = int(p200.max_volume / dispense_vol)
aspirate_vol = dispense_vol * dispenses_per_tip

p200.pick_up_tip(tiprack['A1'])

for i in range(95):
  if p200.current_volume < dispense_vol:
    p200.blow_out(trash).aspirate(aspirate_vol, trough['A1])
  p200.dispense(dispense_vol, plate[i]).touch_tip()

p200.drop_tip(trash)
```

####Precision pipetting within a well

```python
# 
```
