from typing import Any

import pytest

from tests.opentrons.conftest import Protocol

from opentrons.protocol_api import ParameterContext
from opentrons.protocol_api.protocol_context import ProtocolContext
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.execution import execute, execute_python
from opentrons.protocols.execution.errors import ExceptionInProtocolError
from opentrons.protocols.parse import parse
from opentrons.protocols.types import MalformedPythonProtocolError, PythonProtocol


def test_api2_runfunc() -> None:
    def noargs() -> None:
        pass

    with pytest.raises(SyntaxError):
        execute_python._runfunc_ok(noargs)

    def twoargs(a: Any, b: Any) -> None:
        pass

    with pytest.raises(SyntaxError):
        execute_python._runfunc_ok(twoargs)

    def two_with_default(a: Any, b: Any = 2) -> None:
        pass

    # making sure this doesn't raise
    execute_python._runfunc_ok(two_with_default)

    def one_with_default(a: Any = 2) -> None:
        pass

    # shouldn't raise
    execute_python._runfunc_ok(one_with_default)

    def starargs(*args: Any) -> None:
        pass

    # shouldn't raise
    execute_python._runfunc_ok(starargs)


@pytest.mark.ot2_only
@pytest.mark.parametrize("protocol_file", ["testosaur_v2.py"])
def test_execute_ok(
    protocol: Protocol, protocol_file: str, ctx: ProtocolContext
) -> None:
    proto = parse(protocol.text, protocol.filename)
    execute.run_protocol(proto, context=ctx)


def test_bad_protocol(ctx: ProtocolContext) -> None:
    no_args = parse(
        """
metadata={"apiLevel": "2.0"}
def run():
    pass
"""
    )
    with pytest.raises(MalformedPythonProtocolError) as e:
        execute.run_protocol(no_args, context=ctx)
        assert "Function 'run()' does not take any parameters" in str(e.value)

    many_args = parse(
        """
metadata={"apiLevel": "2.0"}
def run(a, b):
    pass
"""
    )
    with pytest.raises(MalformedPythonProtocolError) as e:
        execute.run_protocol(many_args, context=ctx)
        assert "must be called with more than one argument" in str(e.value)


def test_proto_with_exception(ctx: ProtocolContext) -> None:
    exc_in_root = """metadata={"apiLevel": "2.0"}

def run(ctx):
    raise Exception("hi")
"""
    protocol = parse(exc_in_root)
    with pytest.raises(ExceptionInProtocolError) as e:
        execute.run_protocol(protocol, context=ctx)
    assert "Exception [line 4]: hi" in str(e.value)

    nested_exc = """
import ast

def this_throws():
    raise Exception("hi")

def run(ctx):
    this_throws()

metadata={"apiLevel": "2.0"};
"""
    protocol = parse(nested_exc)
    with pytest.raises(ExceptionInProtocolError) as e:
        execute.run_protocol(protocol, context=ctx)
    assert "[line 5]" in str(e.value)
    assert "Exception [line 5]: hi" in str(e.value)


# TODO (spp, 2024-7-16): add a test for CSV rtp extraction
@pytest.mark.ot2_only
@pytest.mark.parametrize("protocol_file", ["testosaur_with_rtp.py"])
def test_rtp_extraction(protocol: Protocol, protocol_file: str) -> None:
    """It should set the RTP definitions in protocol with override values from run."""
    proto = parse(protocol.text, protocol.filename)
    parameter_context = ParameterContext(api_version=APIVersion(2, 18))
    run_time_param_overrides = {"sample_count": 2}
    assert isinstance(proto, PythonProtocol)
    val = execute_python.exec_add_parameters(
        protocol=proto,
        parameter_context=parameter_context,
        run_time_param_overrides=run_time_param_overrides,
        run_time_param_file_overrides={},
    )
    assert val is not None
    assert val.get_all() == {"sample_count": 2, "mount": "left"}
