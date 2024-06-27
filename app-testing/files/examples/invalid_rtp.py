from dataclasses import dataclass, fields
from typing import Union

from typing import Union, Type, List


def not_my_type(the_type: Type) -> List[Union[str, float, int, bool, dict, list, tuple, set, frozenset]]:
    """
    Returns a list of values of all local variables that do not match the type specified by 'the_type'.

    Args:
        the_type: The type (e.g., int, str, list) to be excluded from the return value.

    Returns:
        A list of values of local variables not matching 'the_type'.
    """
    none: None = None
    string: str = "string"
    integer: int = 1
    the_float: float = 1.0
    the_dict: dict = {}
    the_list: list = []
    the_tuple: tuple = ()
    the_set: set = set()
    the_frozenset: frozenset = frozenset()

    # Collect values that are not of 'the_type'.
    return [value for value in locals().values() if not isinstance(value, the_type)]


@dataclass
class ErrorVariableNames:
    dunder: str = "__dunder"
    leading_underscore: str = "_leading_underscore"  # maybe
    leading_space: str = " space"
    trailing_space: str = "space "
    middle_space: str = "middle space"
    asterisk: str = "*asterisk"
    period: str = ".period"
    the_def: str = "def"
    the_class: str = "class"
    the_return: str = "return"
    the_yield: str = "yield"
    the_raise: str = "raise"
    the_except: str = "except"
    the_import: str = "import"
    the_from: str = "from"
    the_as: str = "as"
    the_with: str = "with"
    the_if: str = "if"
    the_else: str = "else"
    the_elif: str = "elif"
    the_while: str = "while"
    the_for: str = "for"
    the_in: str = "in"
    the_is: str = "is"
    the_not: str = "not"
    the_and: str = "and"
    the_or: str = "or"
    the_lambda: str = "lambda"
    the_global: str = "global"
    the_nonlocal: str = "nonlocal"
    the_del: str = "del"
    the_pass: str = "pass"
    the_break: str = "break"
    the_continue: str = "continue"
    the_try: str = "try"
    the_and: str = "and"
    the_none: str = "None"
    the_true: str = "True"
    the_false: str = "False"
    the_as: str = "as"
    the_assert: str = "assert"
    the_async: str = "async"
    the_await: str = "await"

    def get_values(self):
        return [getattr(self, field.name) for field in fields(self)]
