"""Tests to enforce serialization for dataclasses from the hardware api layer."""

import asyncio
import inspect
import socket
import threading
import types
from dataclasses import is_dataclass
from typing import Any, Union, get_args, get_origin

import pytest
from decoy import Decoy
from Pyro5 import api as pyro
from Pyro5 import nameserver

from opentrons_shared_data.robot.types import RobotTypeEnum

from opentrons.config import feature_flags
from opentrons.config.types import RobotConfig
from opentrons.hardware_control.modules import ModuleModel
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.pyro_utils.serpent_type_registry import (
    register_hardware_types,
)
from opentrons.hardware_control.types import DoorState, HardwareFeatureFlags
from opentrons.util.pyro.pyro_client_async_adapter import AsyncClientPyroObject
from opentrons.util.pyro.pyro_daemon_utility import create_pyro_daemon

TEST_PYRO_TIMEOUT = 5

# List of types to not validate, ususally these are OT-2 Types that are in a union or something thats handled through a special pyro-behavior decorator
_TYPES_TO_SKIP = [RobotConfig, HardwareFeatureFlags]


@pytest.fixture
def mock_feature_flags(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Get a mocked feature flags."""
    for name, func in inspect.getmembers(feature_flags, inspect.isfunction):
        params = inspect.getfullargspec(func)
        mock_get_ff = decoy.mock(func=func)
        if any("robot_type" in p for p in params.args):
            decoy.when(mock_get_ff(RobotTypeEnum.FLEX)).then_return(False)
        else:
            decoy.when(mock_get_ff()).then_return(False)
        monkeypatch.setattr(feature_flags, name, mock_get_ff)


@pytest.fixture
def ot3_hardware_api(request: pytest.FixtureRequest) -> OT3API:
    """Real OT3API backed by the software simulator, bound to a dedicated event loop.

    Pyro serves OT3API by binding class methods to the core object
    (``MethodType(OT3API.method, core_obj)``), so ``decoy.when`` stubs on a mock
    instance do not replace method bodies. A simulator-backed API provides the
    ``_backend``, pipette/gripper handlers, and positions those methods expect.
    """
    request.node.add_marker("ot3_only")
    try:
        from opentrons.hardware_control.ot3api import OT3API

        loop = asyncio.new_event_loop()

        def _event_loop() -> None:
            asyncio.set_event_loop(loop)
            loop.run_forever()

        loop_thread = threading.Thread(target=_event_loop, daemon=True)
        loop_thread.start()

        fut = asyncio.run_coroutine_threadsafe(
            OT3API.build_hardware_simulator(
                loop=loop,
                strict_attached_instruments=False,
            ),
            loop,
        )
        api = fut.result(timeout=120)
        api._door_state = DoorState.CLOSED
        return api
    except ImportError:
        return None  # type: ignore[return-value]


async def _setup_namerserver(name_server_ready: threading.Event) -> None:
    """Set up a thread running the Pyro Nameserver."""
    sock = socket.socket()
    sock.bind(("localhost", 0))
    host, port = sock.getsockname()
    sock.close()

    pyro.config.NS_HOST = host
    pyro.config.NS_PORT = port

    def _nameserver_loop() -> None:
        # start_ns returns (nameserver, daemon, uri)
        _, ns_daemon, _ = nameserver.start_ns(host=host, port=port)  # type: ignore
        name_server_ready.set()
        # Run until the test process exits; thread is marked daemon=True.
        ns_daemon.requestLoop()

    ns_thread = threading.Thread(target=_nameserver_loop, daemon=True)
    ns_thread.start()


async def _setup_OT3API_pyro_resource(
    hw_api: OT3API, name_server_ready: threading.Event
) -> OT3API:
    """Set up a thread running an OT3API pyro resource and publish it on the nameserver."""

    def _ot3api_pyro_daemon() -> None:
        # Wait for the nameserver to be ready so locate_ns can succeed.
        name_server_ready.wait(timeout=TEST_PYRO_TIMEOUT)
        create_pyro_daemon("OT3API", hw_api, register_hardware_types)

    ot3api_thread = threading.Thread(target=_ot3api_pyro_daemon, daemon=True)
    ot3api_thread.start()

    ns = pyro.locate_ns()
    retries_counter = 0
    uri = None
    while retries_counter <= 10:
        # Wait and try again, the resource isnt registered yet
        try:
            uri = ns.lookup("OT3API")
            break
        except Exception:
            await asyncio.sleep(0.01)
            retries_counter += 1

    # Stop waiting for the nameserver, will fail on pyro.resolve (something is wrong with nameserver and/or daemon)
    if uri is None:
        raise TimeoutError("TEST FAILURE ON PYRO NAMESERVER IN OT3API SETUP.")

    uri = pyro.resolve(uri="PYRONAME:OT3API")
    ot3_proxy = pyro.Proxy(uri)  # type: ignore
    ot3_async = AsyncClientPyroObject(ot3_proxy, force_synchronous=False)
    return ot3_async  # type: ignore


def _is_optional(hint: Any) -> bool:
    origin = get_origin(hint)

    if origin is Union or (hasattr(types, "UnionType") and origin is types.UnionType):
        # Return True if type(None) is one of the allowed types in the union
        return type(None) in get_args(hint)

    return False


def _test_proxy_serialization_coverage(  # noqa: C901
    original_class: type, acpo_instance: Any
) -> None:
    """Scrape over the provided proxy to gather as much information on parameters, mock errors and serialization as possible."""
    proxy: pyro.Proxy = acpo_instance._proxy
    proxy._pyroBind()  # type: ignore
    pyro_methods: list[str] = getattr(proxy, "get_pyro_attributes_with_proxy_result")
    pyro_methods.append("get_pyro_async_methods")
    pyro_methods.append("get_pyro_attributes_with_proxy_result")
    # After grabing the inner proxies for all these safely wrapped results, we'll use these to troll through the metadata

    def _validate_serialization_coverage(value: Any, attr: Any, key: str) -> None:
        if value not in _TYPES_TO_SKIP:
            if hasattr(value, "to_pyro_dict") and hasattr(value, "from_pyro_dict"):
                for (
                    serializer_key,
                    serializer_val,
                ) in value.from_pyro_dict.__annotations__.items():
                    if serializer_key == "return":
                        # Assert that the return type of the "from_pyro_dict" is the same type as the dataclass itself
                        try:
                            assert serializer_val == value.__qualname__
                        except Exception as e:
                            raise ValueError(
                                f"Exception: {e} - type missmatch for 'from_pyro_dict' of attribute {attr}, expected value: {value} return value: {serializer_val}"
                            )
            elif is_dataclass(value):
                raise ValueError(
                    f"Pyro Serialization missing for {value} of attribute call {attr} on parameter '{key}' in class {original_class}."
                )

    dataclasses_log = []
    # For each Method exposed by this pyro object, check the parameters and return values of the original class for dataclass usage
    for method in proxy._pyroMethods:
        # Check all methods that are not decorated to expose proxies
        if method not in pyro_methods:
            original_class_method = getattr(original_class, method)
            for key, value in original_class_method.__annotations__.items():
                testing_value = value
                if _is_optional(value):
                    testing_value = get_args(value)
                try:
                    iter(testing_value)
                    is_iterable = True
                except TypeError:
                    is_iterable = False
                if is_iterable:
                    for item in testing_value:
                        if is_dataclass(item):
                            dataclasses_log.append(item)
                            _validate_serialization_coverage(
                                value=item, attr=method, key=key
                            )
                else:
                    if is_dataclass(testing_value):
                        _validate_serialization_coverage(
                            value=testing_value, attr=method, key=key
                        )

    for attribute in proxy._pyroAttrs:
        if attribute not in pyro_methods:
            original_class_attribute = getattr(original_class, attribute)
            return_annotation = inspect.signature(
                original_class_attribute.fget
            ).return_annotation
            testing_value = return_annotation
            if _is_optional(return_annotation):
                testing_value = get_args(return_annotation)
            try:
                iter(testing_value)
                is_iterable = True
            except TypeError:
                is_iterable = False
            if is_iterable:
                for item in testing_value:
                    if is_dataclass(item):
                        dataclasses_log.append(item)
                        _validate_serialization_coverage(
                            value=item, attr=method, key=key
                        )
            else:
                if is_dataclass(testing_value):
                    _validate_serialization_coverage(
                        value=testing_value, attr=method, key=key
                    )


async def test_serialization_coverage(
    decoy: Decoy,
    ot3_hardware_api: OT3API,
    mock_feature_flags: None,
) -> None:
    """Test will check for serialization coverage of dataclasses exposed by the OT3API and subsequent Module APIs."""
    decoy.when(feature_flags.hardware_subprocess_enabled()).then_return(True)
    decoy.when(feature_flags.protocol_subprocess_enabled()).then_return(True)

    name_server_ready = threading.Event()

    await _setup_namerserver(name_server_ready=name_server_ready)
    ot3api_async_instance = await _setup_OT3API_pyro_resource(
        hw_api=ot3_hardware_api, name_server_ready=name_server_ready
    )

    # Assert that there are as many testable proxy modules as there are actual modules for integration coverage
    # DEVELOPER NOTE: if this part is failing, you need to add a missing module to `_setup_OT3API_pyro_resource`
    # assert len(ot3api_async_instance.attached_modules) == len(get_args(ModuleModel))

    # Run tests for the OT3API
    _test_proxy_serialization_coverage(
        original_class=OT3API, acpo_instance=ot3api_async_instance
    )

    # CASEY TODO: run tests for the modules:
