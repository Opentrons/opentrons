import pytest

from opentrons.protocol_api import execute, ProtocolContext


def test_api2_runfunc():
    def noargs():
        pass

    with pytest.raises(SyntaxError):
        execute._runfunc_ok(noargs)

    def twoargs(a, b):
        pass

    with pytest.raises(SyntaxError):
        execute._runfunc_ok(twoargs)

    def two_with_default(a, b=2):
        pass

    assert execute._runfunc_ok(two_with_default) == two_with_default

    def one_with_default(a=2):
        pass

    assert execute._runfunc_ok(one_with_default) == one_with_default

    def starargs(*args):
        pass

    assert execute._runfunc_ok(starargs) == starargs


@pytest.mark.parametrize('protocol_file', ['testosaur_v2.py'])
def test_execute_ok(protocol, protocol_file, ensure_api2, loop):
    proto = compile(protocol.text, protocol.filename, 'exec')
    ctx = ProtocolContext(loop)
    execute.run_protocol(protocol_code=proto, context=ctx)


def test_bad_protocol(ensure_api2, loop):
    ctx = ProtocolContext(loop)
    with pytest.raises(SyntaxError):
        execute.run_protocol(protocol_code='print hi', context=ctx)
    with pytest.raises(SyntaxError):
        execute.run_protocol(protocol_code='print("hi"")', context=ctx)
