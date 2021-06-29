"""Python file reading and parsing."""


class PythonProtocol:
    pass


class PythonFileReader:
    """A reader for Python protocol files

    Gets a Python protocol's metadata and run method.
    """

    def read(self) -> PythonProtocol:
        raise NotImplementedError("PythonFileReader not yet implemented.")
