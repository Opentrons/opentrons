import builtins
import sys


def patch_import(module_name, attribute_name, instance):
    """
    On every import of module_name set it's attribute value
    to instance
    """
    def __patched_import__(*args, **kwargs):
        # Call system import first:
        # 1) it will validate signature
        # 2) use system's means to resolve and load
        module = __import__(*args, **kwargs)

        # name is the only mandatory argument
        # so there is a chance it will be in args
        # instead of kwargs if called like __import__('foo')
        # instead of __import__(name='foo')
        name = kwargs.get('name', args[0])

        # if we are not patching this module name
        # we're just pass-through
        if name != module_name:
            return module

        # TODO (artyom, 08/22/2017): i am contemplating
        # reloading the module, but that could have negative
        # impacts in case the module creates singletons
        # like opentrons.trace.EventBroker
        # module = importlib.reload(module)
        module.__dict__[attribute_name] = instance
        return module
    return __patched_import__


def make_globals(overrides):
    """
    :param:overrids is a dictionary where the key is
    the builtin's name and the value is the function overriding it
    """
    return {
        '__builtins__': {
            **builtins.__dict__,
            **overrides
        }
    }


def get_frozen_root():
    """
    :return: Returns app path when app is packaged by pyInstaller
    """
    return sys._MEIPASS if getattr(sys, 'frozen', False) else None
