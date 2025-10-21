# noqa: D100

import typing


def get_union_elements(type_alias: typing.Any) -> tuple[typing.Any, ...]:
    """Return the elements comprising a `typing.Union`.

    e.g. `get_union_elements(Union[int, str, float])` returns `(int, str, float)`.

    If the union itself is wrapped with `typing.Annotated`, it's discarded.
    If an individual element is wrapped with `typing.Annotated`, it's returned as-is.

    Ideally, we would use `typing.get_type_hints(..., include_extras=False)` for this,
    but that only works for getting the annotations of a function, method, module, or
    class, and sometimes we want to unpack an individual union type alias.
    """
    origin, args = typing.get_origin(type_alias), typing.get_args(type_alias)
    if origin is typing.Annotated:
        # Unwrap Annotated[Union[A, B, C]] to Union[A, B, C].
        union_annotation = args[0]
        return get_union_elements(union_annotation)
    elif origin is typing.Union:
        return args
    else:
        raise TypeError(f"get_union_elements() got unrecognized type {type_alias}")
