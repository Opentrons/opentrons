"""Snippet discovery, rendering, classification, and execution for docs CI.

See docs/tests/README.md for the design. The public entry point is
``discover_snippets()`` in ``extract`` combined with ``classify`` and
``execute``; ``conftest.py`` wires these into parametrized pytest cases.
"""
