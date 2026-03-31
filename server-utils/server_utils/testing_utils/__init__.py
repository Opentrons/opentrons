"""Shared utilities for servers to use in their automated tests.

Not to be confused with the automated tests covering `server_utils` itself,
which are in the local `tests/` directory.

These should not be used in any production code.

For packaging simplicity, these utils are unfortunately still shipped to robots as part
of the `server_utils` package, despite not being used on robots. These utils should
therefore be careful not to import any dev-only dependencies such as pytest.
"""
