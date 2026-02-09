"""Backward-compatible re-export of BasePage.

BasePage now lives in ``automation.base_page`` so it can be shared across
PD, LL, and any future page-object packages without creating cross-suite
dependencies.  Existing ``from .base_page import BasePage`` imports inside
``pd_pages`` continue to work.
"""

from automation.base_page import BasePage

__all__ = ["BasePage"]
