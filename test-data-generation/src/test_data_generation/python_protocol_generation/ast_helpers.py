"""Abstract layer for generating AST nodes.

Provide primitive data structures that can be used to generate AST nodes.
"""

import ast
import typing
from dataclasses import dataclass

from test_data_generation.constants import (
    PROTOCOL_CONTEXT_VAR_NAME,
    ModuleInfo,
    ProtocolContextMethod,
    AllSlotName,
)

ExplicitLoadStorage = typing.Dict[AllSlotName, "AssignStatement"]


class CanGenerateAST(typing.Protocol):
    """Protocol for objects that can generate an AST node."""

    def generate_ast(self) -> ast.AST:
        """Generate an AST node."""
        ...


class CanGenerateASTStatement(CanGenerateAST, typing.Protocol):
    """Protocol for objects that can generate an AST statement."""

    def generate_ast(self) -> ast.stmt:
        """Generate an AST statement."""
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
    what_to_call: ProtocolContextMethod | str

    def generate_ast(self) -> ast.AST:
        """Generate an AST node for the call."""
        raise NotImplementedError


@dataclass
class CallFunction(BaseCall):
    """Class to represent a method or function call."""

    args: typing.List[str]

    def generate_ast(self) -> ast.Call:
        """Generate an AST node for the call."""
        return ast.Call(
            func=ast.Attribute(
                value=ast.Name(id=self.call_on, ctx=ast.Load()),
                attr=self.what_to_call,
                ctx=ast.Load(),
            ),
            args=[ast.Constant(str_arg) for str_arg in self.args],
            keywords=[],
        )

    @classmethod
    def load_labware(cls, labware_name: str, labware_location: str) -> "CallFunction":
        """Create a CallFunction for loading labware."""
        return cls(
            call_on=PROTOCOL_CONTEXT_VAR_NAME,
            what_to_call="load_labware",
            args=[labware_name, labware_location],
        )

    @classmethod
    def load_waste_chute(cls) -> "CallFunction":
        """Create a CallFunction for loading a waste chute."""
        return cls(
            call_on=PROTOCOL_CONTEXT_VAR_NAME,
            what_to_call="load_waste_chute",
            args=[],
        )

    @classmethod
    def load_trash_bin(cls, location: str) -> "CallFunction":
        """Create a CallFunction for loading a trash bin."""
        return cls(
            call_on=PROTOCOL_CONTEXT_VAR_NAME,
            what_to_call="load_trash_bin",
            args=[location],
        )

    @classmethod
    def load_module(
        cls, module_info: ModuleInfo, module_location: str | None
    ) -> "CallFunction":
        """Create a CallFunction for loading a module."""
        module_args = [module_info.load_name]
        if module_location:
            module_args.append(module_location)

        return cls(
            call_on=PROTOCOL_CONTEXT_VAR_NAME,
            what_to_call="load_module",
            args=module_args,
        )

    @classmethod
    def load_instrument(
        cls, instrument_name: str, mount: typing.Literal["left", "right"]
    ) -> "CallFunction":
        """Create a CallFunction for loading an instrument."""
        return cls(
            call_on=PROTOCOL_CONTEXT_VAR_NAME,
            what_to_call="load_instrument",
            args=[instrument_name, mount],
        )


@dataclass
class CallAttribute(BaseCall):
    """Class to represent a method or function call."""

    def generate_ast(self) -> ast.Expr:
        """Generate an AST node for the call."""
        return ast.Expr(
            value=ast.Attribute(
                value=ast.Name(id=self.call_on, ctx=ast.Load()),
                attr=self.what_to_call,
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

    @classmethod
    def load_labware(
        cls, var_name: str, labware_name: str, labware_location: str
    ) -> "AssignStatement":
        """Create an AssignStatement for loading labware."""
        return cls(
            var_name=var_name,
            value=CallFunction.load_labware(labware_name, labware_location),
        )

    @classmethod
    def load_waste_chute(cls) -> "AssignStatement":
        """Create an AssignStatement for loading a waste chute."""
        return cls(
            var_name="waste_chute",
            value=CallFunction.load_waste_chute(),
        )

    @classmethod
    def load_trash_bin(cls, location: str) -> "AssignStatement":
        """Create an AssignStatement for loading a trash bin."""
        return cls(
            var_name=f"trash_bin_{location}",
            value=CallFunction.load_trash_bin(location.upper()),
        )

    @classmethod
    def load_module(
        cls, module_info: ModuleInfo, module_location: str | None
    ) -> "AssignStatement":
        """Create an AssignStatement for loading a module."""
        if module_location is None:
            module_location = ""
        return cls(
            var_name=module_info.variable_name(module_location),
            value=CallFunction.load_module(module_info, module_location),
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
