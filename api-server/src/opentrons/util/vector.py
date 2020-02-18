import math

import json


from builtins import property as _property, tuple as _tuple
from operator import itemgetter as _itemgetter
from collections import OrderedDict


class VectorValue(tuple):
    """
    # from collections import namedtuple
    # value_type = namedtuple('VectorValue', ['x', 'y', 'z'])
    """
    'VectorValue(x, y, z)'

    __slots__ = ()

    _fields = ('x', 'y', 'z')

    def __new__(_cls, x, y, z):
        'Create new instance of VectorValue(x, y, z)'
        return _tuple.__new__(_cls, (x, y, z))

    @classmethod
    def _make(cls, iterable, new=tuple.__new__, len=len):
        'Make a new VectorValue object from a sequence or iterable'
        result = new(cls, iterable)
        if len(result) != 3:
            raise TypeError('Expected 3 arguments, got %d' % len(result))
        return result

    def _replace(_self, **kwds):
        """Return a new VectorValue object replacing specified fields with
        new values
        """
        result = _self._make(map(kwds.pop, ('x', 'y', 'z'), _self))
        if kwds:
            raise ValueError('Got unexpected field names: %r' % list(kwds))
        return result

    def __repr__(self):
        'Return a nicely formatted representation string'
        return self.__class__.__name__ + '(x=%r, y=%r, z=%r)' % self

    def _asdict(self):
        'Return a new OrderedDict which maps field names to their values.'
        return OrderedDict(zip(self._fields, self))

    def __getnewargs__(self):
        'Return self as a plain tuple.  Used by copy and pickle.'
        return tuple(self)

    x = _property(_itemgetter(0), doc='Alias for field number 0')

    y = _property(_itemgetter(1), doc='Alias for field number 1')

    z = _property(_itemgetter(2), doc='Alias for field number 2')


value_type = VectorValue


class VectorEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Vector):
            return dict(zip('xyz', obj))
        try:
            return json.JSONEncoder.default(self, obj)
        except Exception:
            return str(obj)


class Vector(object):
    zero_vector = None

    @classmethod
    def zero_coordinates(cls):

        if not cls.zero_vector:
            cls.zero_vector = value_type(0, 0, 0)

        return cls.zero_vector

    @classmethod
    def coordinates_from_dict(cls, dictionary):
        kwargs = {}
        for axis in 'xyz':
            kwargs[axis] = dictionary.get(axis, 0)
        return value_type(**kwargs)

    @classmethod
    def coordinates_from_iterable(cls, iterable):
        return value_type(
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
            self.coordinates = value_type(*args)
        else:
            raise ValueError("Expected either a dict/iterable or x, y, z")

    def __eq__(self, other):
        if isinstance(other, Vector):
            return all(
                [math.isclose(a, b, rel_tol=1e-05, abs_tol=1e-08)
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
