import pytest

from opentrons.protocol_api import ParameterContext
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.execution import execute, execute_python
from opentrons.protocols.parse import parse


def test_api2_runfunc():
    def noargs():
        pass

    with pytest.raises(SyntaxError):
        execute_python._runfunc_ok(noargs)

    def twoargs(a, b):
        pass

    with pytest.raises(SyntaxError):
        execute_python._runfunc_ok(twoargs)

    def two_with_default(a, b=2):
        pass

    # making sure this doesn't raise
    execute_python._runfunc_ok(two_with_default)

    def one_with_default(a=2):
        pass

    # shouldn't raise
    execute_python._runfunc_ok(one_with_default)

    def starargs(*args):
        pass

    # shouldn't raise
    execute_python._runfunc_ok(starargs)


@pytest.mark.ot2_only
@pytest.mark.parametrize("protocol_file", ["testosaur_v2.py"])
def test_execute_ok(protocol, protocol_file, ctx):
    proto = parse(protocol.text, protocol.filename)
    execute.run_protocol(proto, context=ctx)


def test_bad_protocol(ctx):
    no_args = parse(
        """
metadata={"apiLevel": "2.0"}
def run():
    pass
"""
    )
    with pytest.raises(execute_python.MalformedPythonProtocolError) as e:
        execute.run_protocol(no_args, context=ctx)
        assert "Function 'run()' does not take any parameters" in str(e.value)

    many_args = parse(
        """
metadata={"apiLevel": "2.0"}
def run(a, b):
    pass
"""
    )
    with pytest.raises(execute_python.MalformedPythonProtocolError) as e:
        execute.run_protocol(many_args, context=ctx)
        assert "must be called with more than one argument" in str(e.value)


def test_proto_with_exception(ctx):
    exc_in_root = """metadata={"apiLevel": "2.0"}

def run(ctx):
    raise Exception("hi")
"""
    protocol = parse(exc_in_root)
    with pytest.raises(execute_python.ExceptionInProtocolError) as e:
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
    with pytest.raises(execute_python.ExceptionInProtocolError) as e:
        execute.run_protocol(protocol, context=ctx)
    assert "[line 5]" in str(e.value)
    assert "Exception [line 5]: hi" in str(e.value)


@pytest.mark.ot2_only
@pytest.mark.parametrize("protocol_file", ["testosaur_with_rtp.py"])
def test_rtp_extraction(protocol, protocol_file) -> None:
    """It should set the RTP definitions in protocol with override values from run."""
    proto = parse(protocol.text, protocol.filename)
    parameter_context = ParameterContext(api_version=APIVersion(2, 18))
    run_time_param_overrides = {"sample_count": 2}
    assert execute_python.exec_add_parameters(  # type: ignore
        protocol=proto,
        parameter_context=parameter_context,
        run_time_param_overrides=run_time_param_overrides,
    ).get_all() == {"sample_count": 2, "mount": "left"}
