import json
import uuid
import inspect
from functools import partial
from typing import Callable, Any, Optional, Dict
from enum import Enum


class Method(object):
    """Object representing an rpc method."""

    def __init__(self, method: Callable, context: Any = None) -> None:
        """Constructor"""
        self.method = method
        self.context = context
        self.name = method.__name__

    def __repr__(self) -> str:
        """String representation of a methof object."""
        return f"<{self.__class__.__name__}: method={self.name}>"


class JSONRPCDispatcher():
    """This class is responsible for keeping track of rpc methods and context objects."""

    def __init__(
        self,
        *args: str,
        context: Optional[Dict[str, Any]] = None,
        **kwargs: int
    ) -> None:
        """Constructor"""
        self._context: Dict[str, Any] = dict()
        self._methods: Dict[str, Method] = dict()

    @property
    def context(self) -> Dict[str, Any]:
        """Registered context args and their objects"""
        return self._context

    @property
    def methods(self) -> Dict[str, Callable]:
        """Registered method names and their functions."""
        return self._methods

    def register(
        self,
        method: Callable = None,
        name: str = None,
        context: Any = None
    ) -> Method:
        """Add this method to the dict of registered methods."""
        if (name or context) and not method:
            return partial(self.add_method, name=name, context=context)
        name = name or method.__name__
        method_obj = Method(method, context=context)
        self._methods[name] = method_obj
        if context:
            self._context[name] = context
        return method_obj


class ObjectType(Enum):
    CLASS = 'class'
    METHOD = 'method'
    PROPERTY = 'property'


class _Object(object):
    def __init__(self, uid, obj, path):
        self.path = path
        self.uuid = uid
        self.object = obj
        self.type = type(obj)

        self._properties = None
        self._methods = None

    @property
    def data(self):
        data = {
            "path": self.path,
            "uuid": self.uuid.hex,
            "type": str(self.type),
        }
        # check if this is a class instance
        #if isinstance(self.object, object) and
        #not inspect.isclass(self.object):
        #    print("This is a class object")
        #for 
        #    data[""]



class Dispatcher:
    def __init__(self):
        self._registered = {}

    def register(self, obj, path):
        print(f"Im registering {obj}")
        #if not hasattr(obj, '__expose'):
        #    raise RuntimeError("Attempting to register an unexposed object.")

        uid = uuid.uuid4()
        if inspect.isfunction(obj):
            print(f"Im a function: {obj}")
            name = obj.__name__
        # todo: only accept class instances
        elif isinstance(obj, type):
            name = obj.__class.__name__
            print(f"Im a class: {obj}")
            for attr in obj.__dict__:
                item = getattr(obj, attr)
                if inspect.isfunction(item) or inspect.ismethoddescriptor(item):
                    item.__expose = True
                elif inspect.isdatadescriptor(item):
                    if getattr(item, "fset", None):
                        item.fset.__expose = True
                    if getattr(item, "fget", None):
                        item.fget.__expose = True
                    if getattr(item, "fdel", None):
                        item.fdel.__expose = True

                print(attr)

        object = _Object(uid, obj, path)
        self._registered[path] = object

    @property
    def registered(self):
        return self._registered

    @property
    def data(self):
        print(self._registered)
        return {obj.path: obj.data for obj in self._registered.values()}

    @property
    def json(self):
        return json.dumps(self.data)


def ipc_expose(cls):
    """Decorator function to mark a class or method so its exposed."""

    skeleton = {
        "obj_name": cls.__name__,
        "obj_items": [],
    }
    print(f"Exposing {cls}")
    if hasattr(cls, '__expose__'):
        print("already exposed!")
        # already exposed
        return cls

    if inspect.isfunction(cls):
        skeleton['obj_items'].append({
            "name": cls.__name__,
            "type": ObjectType.METHOD.value,
            "args": (),
            "kwargs": {},
            })
        cls.__expose = True
    elif inspect.isclass(cls):
        print("exposing class!")
        print(inspect.getmembers(cls))
        print("CLASS", skeleton)
        for name, attr in cls.__dict__.items():
            print(name, attr)
            if name.startswith("__") and name.endswith("__"):
                # skip special functions
                continue
            print(name, attr)
            item = getattr(cls, name)
            if inspect.isfunction(item) or inspect.ismethoddescriptor(item):
                item.__expose = True
                skeleton['obj_items'].append({
                    "name": name,
                    "type": ObjectType.METHOD.value,
                    "args": (),
                    "kwargs": {},
                })
            elif inspect.isdatadescriptor(item):
                skeleton['obj_items'].append({
                    "name": name,
                    "type": ObjectType.PROPERTY.value,
                })
                if getattr(item, "fset", None):
                    item.fset.__expose = True
                if getattr(item, "fget", None):
                    item.fget.__expose = True
                if getattr(item, "fdel", None):
                    item.fdel.__expose = True
            elif inspect.isclass(item):
                # this is an inner object, check if we want it exposed
                # then expose it by providing the path to the object.
                # this will be returned to the caller
                skeleton['obj_items'].append({
                    "name": name,
                    "type": ObjectType.CLASS.value,
                    "path": "something",
                })
    setattr(cls, '__skeleton__', skeleton)
    print(cls.__skeleton__)
    return cls


def is_exposed(obj):
    """Helper function to determine if this object should be exposed or not"""
    return hasattr(obj, "__expose")


