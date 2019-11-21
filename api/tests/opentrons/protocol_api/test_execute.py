import pytest
from opentrons.protocol_api import execute, ProtocolContext
from opentrons.protocols.parse import parse


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
def test_execute_ok(protocol, protocol_file, loop):
    proto = parse(protocol.text, protocol.filename)
    ctx = ProtocolContext(loop)
    execute.run_protocol(proto, context=ctx)


def test_bad_protocol(loop):
    ctx = ProtocolContext(loop)
    no_run = parse('''
metadata={"apiLevel": "2.0"}
print("hi")
''')
    with pytest.raises(execute.MalformedProtocolError) as e:
        execute.run_protocol(no_run, context=ctx)
        assert "No function 'run" in str(e.value)

    no_args = parse('''
metadata={"apiLevel": "2.0"}
def run():
    pass
''')
    with pytest.raises(execute.MalformedProtocolError) as e:
        execute.run_protocol(no_args, context=ctx)
        assert "Function 'run()' does not take any parameters" in str(e.value)

    many_args = parse('''
metadata={"apiLevel": "2.0"}
def run(a, b):
    pass
''')
    with pytest.raises(execute.MalformedProtocolError) as e:
        execute.run_protocol(many_args, context=ctx)
        assert "must be called with more than one argument" in str(e.value)


def test_proto_with_exception(loop):
    ctx = ProtocolContext(loop)
    exc_in_root = '''metadata={"apiLevel": "2.0"}

def run(ctx):
    raise Exception("hi")
'''
    protocol = parse(exc_in_root)
    with pytest.raises(execute.ExceptionInProtocolError) as e:
        execute.run_protocol(
            protocol,
            context=ctx)
    assert 'Exception [line 4]: hi' in str(e.value)

    nested_exc = '''
import ast

def this_throws():
    raise Exception("hi")

def run(ctx):
    this_throws()

metadata={"apiLevel": "2.0"};
'''
    protocol = parse(nested_exc)
    with pytest.raises(execute.ExceptionInProtocolError) as e:
        execute.run_protocol(
            protocol,
            context=ctx)
    assert '[line 5]' in str(e.value)
    assert 'Exception [line 5]: hi' in str(e.value)
