class Singleton(type):
    """ A meta-class to implement singleton pattern on a given class

    Examples
    --------
    >>> class Foo(object, metaclass=Singleton): pass
    >>> a = Foo()
    >>> b = Foo()
    >>> a == b
    True
    """
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls]\
                = super(Singleton, cls).__call__(*args, **kwargs)
        return cls._instances[cls]
