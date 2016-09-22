from opentrons_sdk.labware import containers

plate = containers.load('microplate.96', 'A1')

plate.well((0,0))
x = plate.well((0,1))

print(
    plate._children
)

print(dir(x))

print(x.parent == plate)

class Foo(object):
    def __next__(self):
        print('hey ')

    def __getattr__(self, ftn_name):
        def wrapper(*args, **kwargs):
            ftn = getattr(self, ftn_name, None)
            import pdb; pdb.set_trace()
            ftn(*args, **kwargs)
        return wrapper


f = Foo()
next(f)




# point = containers.load('point', 'A1')


