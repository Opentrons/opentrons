"""Abstract layer for generating AST nodes.

Provide primitive data structures that can be used to generate AST nodes.
"""

import typing
import ast
from dataclasses import dataclass
from test_data_generation.python_protocol_generation.util import ProtocolContextMethods


class CanGenerateAST(typing.Protocol):
    """Protocol for objects that can generate an AST node."""

    def generate_ast(self) -> ast.AST:
        """Generate an AST node."""
        ...


@dataclass
class ImportStatement:
    """Class to represent from some.module import a_thing statement."""

    module: str
    names: typing.List[str]

    def generate_ast(self) -> ast.ImportFrom:
        """Generate an AST node for the import statement."""
        return ast.ImportFrom(
            module=self.module,
            names=[ast.alias(name=name, asname=None) for name in self.names],
            level=0,
        )


@dataclass
class BaseCall:
    """Class to represent a method or function call."""

    call_on: str
    what_to_call: ProtocolContextMethods | str

    def _evaluate_what_to_call(self) -> str:
        """Evaluate the value of what_to_call."""
        if isinstance(self.what_to_call, ProtocolContextMethods):
            return self.what_to_call.value
        else:
            return self.what_to_call

    def generate_ast(self) -> ast.Call:
        """Generate an AST node for the call."""
        what_to_call = (
            self.what_to_call.value
            if isinstance(self.what_to_call, ProtocolContextMethods)
            else self.what_to_call
        )
        return ast.Call(
            func=ast.Attribute(
                value=ast.Name(id=self.call_on, ctx=ast.Load()),
                attr=what_to_call,
                ctx=ast.Load(),
            ),
            args=[ast.Constant(str_arg) for str_arg in self.args],
            keywords=[],
        )


@dataclass
class CallFunction(BaseCall):
    """Class to represent a method or function call."""

    args: typing.List[str]

    def generate_ast(self) -> ast.Call:
        """Generate an AST node for the call."""
        return ast.Call(
            func=ast.Attribute(
                value=ast.Name(id=self.call_on, ctx=ast.Load()),
                attr=self._evaluate_what_to_call(),
                ctx=ast.Load(),
            ),
            args=[ast.Constant(str_arg) for str_arg in self.args],
            keywords=[],
        )


@dataclass
class CallAttribute(BaseCall):
    """Class to represent a method or function call."""

    def generate_ast(self) -> ast.Call:
        """Generate an AST node for the call."""
        return ast.Expr(
            value=ast.Attribute(
                value=ast.Name(id=self.call_on, ctx=ast.Load()),
                attr=self._evaluate_what_to_call(),
                ctx=ast.Load(),
            )
        )


@dataclass
class AssignStatement:
    """Class to represent an assignment statement."""

    var_name: str
    value: CallFunction | str | ast.AST

    def generate_ast(self) -> ast.Assign:
        """Generate an AST node for the assignment statement."""
        if isinstance(self.value, CallFunction):
            return ast.Assign(
                targets=[ast.Name(id=self.var_name, ctx=ast.Store())],
                value=self.value.generate_ast(),
            )
        else:
            return ast.Assign(
                targets=[ast.Name(id=self.var_name, ctx=ast.Store())],
                value=self.value,
            )


@dataclass
class FunctionDefinition:
    """Class to represent a function definition."""

    name: str
    args: typing.List[str]

    def generate_ast(self) -> ast.FunctionDef:
        """Generate an AST node for the function definition."""
        return ast.FunctionDef(
            name=self.name,
            args=ast.arguments(
                posonlyargs=[],
                args=[
                    ast.arg(
                        arg=arg,
                    )
                    for arg in self.args
                ],
                vararg=None,
                kwonlyargs=[],
                kw_defaults=[],
                kwarg=None,
                defaults=[],
            ),
            body=[],
            decorator_list=[],
        )
