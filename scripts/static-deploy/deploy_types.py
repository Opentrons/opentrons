"""Shared type definitions for deployment scripts."""

from typing import Literal

Environment = Literal["sandbox", "staging", "production"]
Application = Literal["labware_library", "protocol_designer", "docs", "mkdocs"]
