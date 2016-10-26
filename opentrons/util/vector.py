import math

from collections import namedtuple
import json


# To keep Python 3.4 compatibility
def isclose(a, b, rel_tol):
    return abs(a - b) < rel_tol


class VectorEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Vector):
            return dict(zip('xyz', obj))
        try:
            return json.JSONEncoder.default(self, obj)
        except:
            return str(obj)


class Vector(object):
    zero_vector = None
    value_type = namedtuple('VectorValue', ['x', 'y', 'z'])

    @classmethod
    def zero_coordinates(cls):

        if not cls.zero_vector:
            cls.zero_vector = cls.value_type(0, 0, 0)

        return cls.zero_vector

    @classmethod
    def coordinates_from_dict(cls, dictionary):
        kwargs = {}
        for axis in 'xyz':
            kwargs[axis] = dictionary.get(axis, 0)
        return cls.value_type(**kwargs)

    @classmethod
    def coordinates_from_iterable(cls, iterable):
        return cls.value_type(
            iterable[0],
            iterable[1],
            iterable[2])

    def to_iterable(self):
        return self.coordinates

    def to_tuple(self):
        return self.coordinates

    def is_iterable(self, arg):
        return hasattr(arg, "__iter__") or hasattr(arg, "__getitem__")

    def length(self):
        return math.sqrt(
            pow(self.coordinates.x, 2) +
            pow(self.coordinates.y, 2) +
            pow(self.coordinates.z, 2)
        )

    def __init__(self, *args, **kwargs):
        # self.coordinates = self.zero_coordinates()

        args_len = len(args)
        if args_len == 1:
            arg = args[0]
            if isinstance(arg, dict):
                self.coordinates = Vector.coordinates_from_dict(arg)
            elif isinstance(arg, Vector):
                self.coordinates = arg.coordinates
            elif self.is_iterable(arg):
                self.coordinates = Vector.coordinates_from_iterable(arg)
            else:
                raise ValueError(
                    ("One argument supplied "
                     "expected to be dict or iterable, received {}")
                    .format(type(arg)))
        elif args_len == 3:
            self.coordinates = Vector.value_type(*args)
        else:
            raise ValueError("Expected either a dict/iterable or x, y, z")

    def __eq__(self, other):
        if isinstance(other, Vector):
            return all(
                [isclose(a, b, rel_tol=1e-5)
                 for a, b in zip(self, other)]
            )
        elif isinstance(other, dict):
            return self == Vector(other)
        elif self.is_iterable(other):
            return self == Vector(other)
        else:
            raise ValueError("Expected operand to be dict, iterable or vector")

    def __add__(self, other):
        other = other
        return Vector(
            self.coordinates.x + other[0],
            self.coordinates.y + other[1],
            self.coordinates.z + other[2]
        )

    def __sub__(self, other):
        other = other
        return Vector(
            [a - b for a, b in zip(self, other)])

    def __truediv__(self, other):
        if isinstance(other, Vector):
            return Vector(
                [a / b for a, b in zip(self, other)])

        scalar = float(other)
        return self / Vector(scalar, scalar, scalar)

    def __mul__(self, other):
        if isinstance(other, Vector):
            return Vector(
                [a * b for a, b in zip(self, other)])

        scalar = float(other)
        return self * Vector(scalar, scalar, scalar)

    def __str__(self):
        return "(x={:.2f}, y={:.2f}, z={:.2f})".format(
            self.coordinates.x,
            self.coordinates.y,
            self.coordinates.z,
        )

    def __repr__(self):
        return str(self)

    def __getitem__(self, index):
        res = None
        if isinstance(index, int):
            res = self.coordinates[index]
        elif isinstance(index, str):
            res = getattr(self.coordinates, index)
        elif isinstance(index, slice):
            res = self.coordinates[index]
        else:
            raise IndexError('Expected slice or string as an index')

        return res

    def __iter__(self):
        return iter(self.to_tuple())
