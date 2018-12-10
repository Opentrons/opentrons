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
    with pytest.raises(execute.MalformedProtocolError) as e:
        execute.run_protocol(protocol_code='print("hi")', context=ctx)
        assert "No function 'run" in str(e)
    with pytest.raises(execute.MalformedProtocolError) as e:
        execute.run_protocol(protocol_code='def run(): pass', context=ctx)
        assert "Function 'run()' does not take any parameters" in str(e)
    with pytest.raises(execute.MalformedProtocolError) as e:
        execute.run_protocol(protocol_code='def run(a, b): pass', context=ctx)
        assert "must be called with more than one argument" in str(e)


def test_proto_with_exception(ensure_api2, loop):
    ctx = ProtocolContext(loop)
    exc_in_root = '''
def run(ctx):
    raise Exception("hi")
'''
    comped = compile(exc_in_root, 'test_file.py', 'exec')
    with pytest.raises(execute.ExceptionInProtocolError) as e:
        execute.run_protocol(
            protocol_code=comped,
            context=ctx)
    assert 'Exception [line 3]: hi' in str(e)

    nested_exc = '''
import ast

def this_throws():
    raise Exception("hi")

def run(ctx):
    this_throws()
'''
    comped = compile(nested_exc, 'nested.py', 'exec')
    with pytest.raises(execute.ExceptionInProtocolError) as e:
        execute.run_protocol(
            protocol_code=comped,
            context=ctx)
    assert '[line 5]' in str(e)
    assert 'Exception [line 5]: hi' in str(e)
