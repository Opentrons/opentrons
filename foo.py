from opentrons_sdk.labware import containers

plate = containers.load('microplate.96', 'A1')

print(
    plate.well((0,0)),
    plate._children
)



# point = containers.load('point', 'A1')

