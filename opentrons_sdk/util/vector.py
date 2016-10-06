from collections import OrderedDict
import math


class Vector(object):
    @classmethod
    def zero_coordinates(cls):
        return OrderedDict({
            'x': 0.0,
            'y': 0.0,
            'z': 0.0
        })

    @classmethod
    def coordinates_from_dict(cls, dictionary):
        coordinates = cls.zero_coordinates()
        for axis in 'xyz':
            if axis in dictionary:
                coordinates[axis] = float(dictionary[axis])
        return coordinates

    @classmethod
    def coordinates_from_iterable(cls, iterable):
        coordinates = cls.zero_coordinates()
        axis_iterator = 'xyz'.__iter__()
        for value in iterable:
            axis = next(axis_iterator)
            coordinates[axis] = float(value)
        return coordinates

    def to_iterable(self):
        return [
            self.coordinates['x'],
            self.coordinates['y'],
            self.coordinates['z']
        ]

    def to_tuple(self):
        return tuple(self.to_iterable())

    def to_dictionary(self):
        return OrderedDict(self.coordinates)

    def is_iterable(self, arg):
        return hasattr(arg, "__iter__") or hasattr(arg, "__getitem__")

    def __init__(self, *args, **kwargs):
        self.coordinates = self.zero_coordinates()

        if len(args) == 1:
            arg = args[0]
            if isinstance(arg, dict):
                self.coordinates = Vector.coordinates_from_dict(arg)
            elif isinstance(arg, Vector):
                self.coordinates = arg.to_dictionary()
            elif self.is_iterable(arg):
                self.coordinates = Vector.coordinates_from_iterable(arg)
            else:
                raise ValueError(
                    ("One argument supplied "
                     "expected to be dict or iterable, received {}")
                    .format(type(arg)))
        elif len(args) == 3:
            self.coordinates = Vector.coordinates_from_iterable(
                tuple(args[:3]))
        else:
            raise ValueError("Expected either a dict/iterable or x, y, z")

    def __eq__(self, other):
        if isinstance(other, Vector):
            return all(
                [math.isclose(a, b, rel_tol=1e-5)
                 for a, b in zip(self, other)]
            )
        elif isinstance(other, dict):
            return self == Vector(other)
        elif self.is_iterable(other):
            return self == Vector(other)
        else:
            raise ValueError("Expected operand to be dict, iterable or vector")

    def __add__(self, other):
        other = Vector(other)
        return Vector(
            [a + b for a, b in zip(self, other)])

    def __sub__(self, other):
        other = Vector(other)
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
        return "Vector{}".format(self.__repr__())

    def __repr__(self):
        return str(self.to_tuple())

    def __getitem__(self, index):
        res = None
        if isinstance(index, slice):
            res = self.to_tuple()
        elif isinstance(index, str):
            res = self.to_dictionary()
        elif isinstance(index, int):
            res = self.to_tuple()
        else:
            raise IndexError('Expected slice or string as an index')
        return res[index]

    def __iter__(self):
        return iter(self.to_tuple())
