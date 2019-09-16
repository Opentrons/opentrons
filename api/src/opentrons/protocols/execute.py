""" one stop shop for running protocols """

from .types import JsonProtocol, PythonProtocol


def execute_protocol(
    protocol: Union[JsonProtocol, PythonProtocol],
    hardware_instance: Union[HardwareAPILike, Robot],
):
    if isinstance(protocol, JsonProtocol) and isinstance(
        hardware_instance, HardwareAPILike
    ):
        pass
    elif isinstance(protocol, ...):
        pass
    elif isinstance(protocol, PythonProtocol) and isinstance(
        hardware_instance, Robot
    ):
        global_instances = opentrons.build_globals()
        global_instances["robot"] = hardware_instance
        exec(protocol.contents, globals=global_instances)
    elif isinstance(protocol, JsonProtocol) and isinstance(
        hardware_instance, Robot
    ):
        global_instances = opentrons.build_globals()
        execute_v1(protocol.contents, hardware_instance)
