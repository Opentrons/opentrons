from enum import Enum


# TODO(isk: 3/24/20): remove this enum and replace with typing.Literal
#  after migration to python 3.8
class ResourceTypes(str, Enum):
    """Resource object types"""
    item = "item"
    a = "a"
    session = "session"
