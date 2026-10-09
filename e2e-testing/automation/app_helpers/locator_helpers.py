"""Shared Playwright locator resolution with ordered fallbacks."""

from __future__ import annotations

from collections.abc import Callable, Iterable

from playwright.sync_api import Locator, Page


def first_resolved(
    candidates: Iterable[Callable[[], Locator]],
    *,
    require_visible: bool = False,
) -> Locator:
    """Return the first locator factory that matches at least one element."""
    last: Locator | None = None
    for candidate in candidates:
        locator = candidate()
        last = locator
        if locator.count() == 0:
            continue
        target = locator.first
        if require_visible and not target.is_visible():
            continue
        return target
    if last is not None and last.count() > 0:
        return last.first
    if last is not None:
        return last.first
    raise RuntimeError("No locator candidates matched any elements.")


def menu_item(
    scope: Locator,
    name: str,
    *,
    exact: bool = True,
) -> Locator:
    """Locate a visible menu row by accessible name (menuitem, then button)."""
    for role in ("menuitem", "button"):
        item = scope.get_by_role(role, name=name, exact=exact)
        if item.count() > 0 and item.first.is_visible():
            return item.first
    raise RuntimeError(f"Menu item {name!r} not found in scope.")


def sidebar_nav_link(page: Page, *, href_fragment: str, label: str) -> Locator:
    """Resolve a left-sidebar nav link without matching breadcrumb links."""
    href = href_fragment.lstrip("#")
    hash_href = f"#/{href}"
    slash_href = f"/{href}"

    def _sidebar_by_container() -> Locator:
        return page.locator('[class*="nav_container"]').locator(f'a[href="{hash_href}"], a[href="{slash_href}"]')

    def _sidebar_by_navbar_class() -> Locator:
        return page.locator(f'[class*="navbar_link"][href="{hash_href}"], [class*="navbar_link"][href="{slash_href}"]')

    def _sidebar_by_role() -> Locator:
        return page.get_by_role("link", name=label, exact=True).filter(
            has=page.locator('[class*="nav_container"], [class*="navbar"]')
        )

    def _non_breadcrumb_link() -> Locator:
        return page.get_by_role("link", name=label, exact=True).filter(has_not=page.locator('[class*="crumb_link"]'))

    def _any_matching_link() -> Locator:
        return page.locator(f'a[href="{hash_href}"], a[href="{slash_href}"]').filter(
            has_not=page.locator('[class*="crumb_link"]')
        )

    return first_resolved(
        (
            _sidebar_by_container,
            _sidebar_by_navbar_class,
            _sidebar_by_role,
            _non_breadcrumb_link,
            _any_matching_link,
        )
    )
