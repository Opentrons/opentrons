""" Utilities for the legacy wrapper """
import functools
import inspect
import logging
from typing import Callable


def log_call(
        logger: logging.Logger) -> Callable[[Callable], Callable]:

    @functools.wraps(log_call)
    def _decorator(f: Callable) -> Callable:

        @functools.wraps(f)
        def _wrapper(*args, **kwargs):
            call_args = inspect.Signature.from_callable(f).bind(
                *args, **kwargs)
            logger.info(str(call_args))
            return f(*args, **kwargs)

        return _wrapper

    return _decorator


def decorator_maker(f):
    # @functools.wraps(f)
    # def dec_func(f):
    #     def wrapper(self, *args, **kwargs):
    #         print(f"Args: {args}\nKwargs: {kwargs}")
    #         if args:
    #             return f(*args, **kwargs)
    #         else:
    #             return property(f)
    #             # return sub_wrapper
    #     return wrapper
    # return dec_func

    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        print("made it here")
        if args:
            return f(args, kwargs)
        else:
            return property(f)

    return wrapper
    # print(f'args: {*args}, kwargs: {**kwargs}')
    # sig = inspect.signature(f)
    # getargs = inspect.getcallargs(f, *args, **kwargs)
    #     print("made it to wrapper")
    #     partial_obj = functools.partial(f)
    #     print(partial_obj.args)
    #     return f(*args, **kwargs)
    # return wrapper
    # sig = False
    # if sig:
    #     @functools.wraps(f)
    #     def wrapper(*args, **kwargs):
    #         return f(args, kwargs)
    # else:
    #     @functools.wraps(f)
    #     def sub_wrapper():
    #         return f
    #     wrapper = property(sub_wrapper())
    # return wrapper
