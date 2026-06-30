"""Page object for pipette, gripper, module, and lights cards on robot detail."""

from __future__ import annotations

import os
import re
import time
from dataclasses import dataclass

from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import Locator, Page, expect

from automation.helpers.locator_helpers import first_resolved, menu_item

TC_INPUT = re.compile(r"^ThermocyclerSlideout_input_field_")
TC_SUBMIT = re.compile(r"^ThermocyclerSlideout_btn_")
TEMP_INPUT = re.compile(r"^TemperatureSlideout_input_field_")
TEMP_SUBMIT = re.compile(r"^TemperatureSlideout_btn_")
HS_INPUT = re.compile(r"^HeaterShakerSlideout_input_field_")
HS_SUBMIT = re.compile(r"^HeaterShakerSlideout_btn_")
TEST_SHAKE_INPUT = "TestShakeSlideout_shake_input"
TEST_SHAKE_START = "TestShakeSlideout_start_btn"
TEST_SHAKE_LATCH_STATUS = "TestShake_Slideout_latch_status"
HS_ATTACHMENT_CONFIRM = "ConfirmAttachmentModal_primary_btn_on_set_shake"
ABOUT_MODULE_CLOSE = re.compile(r"^AboutModuleSlideout_btn_")
ABOUT_PIPETTE_SERIAL = re.compile(r"^AboutPipetteSlideout_serial_")

ModuleInventory = dict[str, tuple[str, str | None]]

# InstrumentCard labels vary by hardware (96-channel vs single-mount Flex pipettes).
_INSTRUMENT_LABEL_ALIASES: dict[str, tuple[str, ...]] = {
    "left Mount": ("left Mount", "Left Mount"),
    "right Mount": ("right Mount", "Right Mount"),
    "left+right Mount": (
        "Left+Right Mounts",
        "Left + Right Mounts",
        "Both Mounts",
    ),
    "extension mount": ("extension mount", "Extension Mount"),
}


@dataclass(frozen=True)
class ModuleCardSpec:
    label: str
    model: str
    prefix_env: str
    default_prefix: str
    exercise: str | None = None


THERMOCYCLER = ModuleCardSpec(
    "Thermocycler",
    "thermocyclerModuleV2",
    "THERMOCYCLER_PREFIX",
    "TC2",
    "exercise_thermocycler_card",
)
HEATER_SHAKER = ModuleCardSpec(
    "Heater-Shaker",
    "heaterShakerModuleV1",
    "HEATER_SHAKER_PREFIX",
    "HSV0",
    "exercise_heater_shaker_card",
)
HS_LATCH_MENU = re.compile(rf"^hs_labware_latch_{re.escape(HEATER_SHAKER.model)}$")
HS_TEST_SHAKE_MENU = re.compile(
    rf"^hs_test_shake_btn_{re.escape(HEATER_SHAKER.model)}$"
)
TEMPERATURE = ModuleCardSpec(
    "Temperature module",
    "temperatureModuleV2",
    "TEMPERATURE_MODULE_PREFIX",
    "TD2",
    "exercise_temperature_module_card",
)
PLATE_READER = ModuleCardSpec(
    "Plate reader", "absorbanceReaderV1", "PLATE_READER_PREFIX", "OPTMAA"
)

MODULE_CARD_SPECS: tuple[ModuleCardSpec, ...] = (
    THERMOCYCLER,
    HEATER_SHAKER,
    TEMPERATURE,
    PLATE_READER,
)


class DeviceCardHelper:
    """Page object for exercising pipette, gripper, and module cards on a robot detail page."""

    def __init__(self, page: Page):
        """Bind the robot detail page and initialize empty module inventory cache."""
        self.page = page
        self._module_inventory: ModuleInventory = {}

    @staticmethod
    def module_prefix(spec: ModuleCardSpec) -> str:
        """Return the configured serial prefix for a module card spec."""
        return os.environ.get(spec.prefix_env, spec.default_prefix)

    def _dismiss_blocking_overlays(self) -> None:
        """Close slideouts and overflow-menu overlays that block later card clicks."""
        for _ in range(4):
            had_blocking_ui = False
            for index in range(
                self.page.locator('[data-testid^="Slideout_icon_close_"]').count()
            ):
                close = self.page.locator('[data-testid^="Slideout_icon_close_"]').nth(
                    index
                )
                if close.is_visible():
                    had_blocking_ui = True
                    try:
                        close.click(force=True, timeout=1_000)
                    except Exception:
                        pass
            about_close = self.page.get_by_test_id(ABOUT_MODULE_CLOSE)
            if about_close.count() > 0 and about_close.first.is_visible():
                had_blocking_ui = True
                try:
                    about_close.first.click(force=True, timeout=1_000)
                except Exception:
                    pass
            pipette_close = self.page.get_by_test_id("AboutPipette_slideout_close")
            if pipette_close.count() > 0 and pipette_close.first.is_visible():
                had_blocking_ui = True
                try:
                    pipette_close.first.click(force=True, timeout=1_000)
                except Exception:
                    pass
            overlays = self.page.locator('[data-sentry-component="Overlay"]')
            for index in range(overlays.count()):
                overlay = overlays.nth(index)
                if overlay.is_visible():
                    had_blocking_ui = True
                    try:
                        overlay.click(
                            force=True, position={"x": 8, "y": 8}, timeout=1_000
                        )
                    except Exception:
                        pass
            if not had_blocking_ui:
                break
            self.page.wait_for_timeout(250)
        self.page.keyboard.press("Escape")
        self.page.wait_for_timeout(200)

    def read_about_module(
        self, serial_prefix: str, module_model: str
    ) -> tuple[str, str | None]:
        """Open overflow → About module, return (serial, firmware)."""
        if not self._open_module_overflow(serial_prefix):
            return "", None
        self._click_about_module(serial_prefix, module_model)
        serial, firmware = self._read_module_about_serial(module_model)
        self._close_module_about()
        self._dismiss_blocking_overlays()
        return serial, firmware

    def print_module_inventory(
        self,
        *,
        prefix_overrides: dict[str, str | None] | None = None,
    ) -> ModuleInventory:
        """Read About for every configured module card; print and cache serial + firmware."""
        overrides = prefix_overrides or {}
        inventory: ModuleInventory = {}
        print("\n--- Module inventory ---")
        for spec in MODULE_CARD_SPECS:
            prefix = overrides.get(spec.model) or self.module_prefix(spec)
            if not self.has_module_card(prefix):
                print(f"  {spec.label}: not found (prefix '{prefix}')")
                continue
            serial, firmware = self.read_about_module(prefix, spec.model)
            if not serial:
                print(f"  {spec.label}: present but serial unreadable")
                continue
            inventory[spec.model] = (serial, firmware)
            version = firmware or "unknown"
            print(f"  {spec.label}: serial {serial}, version {version}")
        self._module_inventory = inventory
        return inventory

    def _begin_module_exercise(self, spec: ModuleCardSpec, prefix: str) -> bool:
        """Print module header and ensure serial/firmware are cached before exercising."""
        print(f"\n--- {spec.label} card (prefix: {prefix}) ---")
        cached = self._module_inventory.get(spec.model)
        if cached is not None:
            return bool(cached[0])
        serial, firmware = self.read_about_module(prefix, spec.model)
        if not serial:
            return False
        print(f"  Module serial: {serial}")
        if firmware:
            print(f"  Module firmware: {firmware}")
        self._module_inventory[spec.model] = (serial, firmware)
        return True

    def _module_card(self, serial_prefix: str) -> Locator:
        """Return the module card locator matching ``serial_prefix``."""
        return self.page.get_by_test_id(
            re.compile(rf"^ModuleCard_{re.escape(serial_prefix)}")
        )

    def _module_overflow_button(self, serial_prefix: str) -> Locator:
        """Overflow control lives on ``ModuleCard_overflow_btn_<serial>``."""
        return self._module_card(serial_prefix).first.get_by_test_id(
            re.compile(rf"^ModuleCard_overflow_btn_{re.escape(serial_prefix)}")
        ).get_by_role("button", name="overflow")

    def _module_overflow_menu(self, serial_prefix: str) -> Locator:
        """Return the overflow menu container for a module card."""
        return self._module_card(serial_prefix).first.get_by_test_id(
            re.compile(rf"^ModuleCard_overflow_menu_{re.escape(serial_prefix)}")
        )

    def _instrument_card(self, label: str) -> Locator:
        """Return the instrument card ancestor for a mount or gripper label."""
        labels = _INSTRUMENT_LABEL_ALIASES.get(label, (label,))
        label_pattern = re.compile(
            rf"^({'|'.join(re.escape(candidate) for candidate in labels)})$"
        )
        return self.page.get_by_text(label_pattern).first.locator(
            "xpath=ancestor::*[.//button[@aria-label='InstrumentCard_overflowMenu']][1]"
        )

    def _instrument_overflow_button(self, label: str) -> Locator:
        """Return the overflow menu button on an instrument card."""
        return self._instrument_card(label).get_by_role(
            "button", name=re.compile("InstrumentCard_overflowMenu")
        ).first

    def has_module_card(self, serial_prefix: str) -> bool:
        """Return True when a module card exists and its overflow menu is enabled."""
        if self._module_card(serial_prefix).count() == 0:
            return False
        overflow = self._module_overflow_button(serial_prefix)
        return overflow.count() > 0 and not overflow.is_disabled()

    def wait_for_module_cards(self, *, timeout: float = 60_000) -> None:
        """Wait until at least one module card overflow menu is enabled."""
        module_cards = self.page.get_by_test_id(re.compile(r"^ModuleCard_"))
        expect(module_cards.first).to_be_visible(timeout=timeout)
        deadline = time.time() + timeout / 1000
        while time.time() < deadline:
            for index in range(module_cards.count()):
                card = module_cards.nth(index)
                overflow = card.get_by_role("button", name="overflow")
                if overflow.count() > 0 and overflow.is_visible() and not overflow.is_disabled():
                    return
            self.page.wait_for_timeout(500)
        raise TimeoutError("Timed out waiting for module cards to become ready.")

    def has_instrument_card(self, label: str) -> bool:
        """Return True when an instrument card exists and its overflow menu is enabled."""
        card = self._instrument_card(label)
        if card.count() == 0:
            return False
        overflow = self._instrument_overflow_button(label)
        return overflow.count() > 0 and not overflow.is_disabled()

    def has_dual_mount_pipette_card(self) -> bool:
        """True when a 96-channel (left+right) pipette card is shown instead of separate mounts."""
        return self.has_instrument_card("left+right Mount")

    def _open_module_overflow(self, serial_prefix: str) -> bool:
        """Open a module card overflow menu and wait for About module to appear."""
        self._dismiss_blocking_overlays()
        card = self._module_card(serial_prefix)
        if card.count() == 0:
            print(f"  Skipping module with prefix '{serial_prefix}' — card not found.")
            return False
        card.first.scroll_into_view_if_needed()
        overflow = self._module_overflow_button(serial_prefix)
        if overflow.count() == 0:
            print(f"  Skipping module with prefix '{serial_prefix}' — overflow button not found.")
            return False
        if overflow.is_disabled():
            print(
                f"  Skipping module with prefix '{serial_prefix}' — overflow menu disabled."
            )
            return False
        overflow.click()
        about_button = self._module_about_button(serial_prefix).first
        try:
            expect(about_button).to_be_visible(timeout=2_000)
        except AssertionError:
            overflow.click()
            expect(about_button).to_be_visible()
        return True

    def _click_module_menu_button(
        self, serial_prefix: str, *names: str
    ) -> bool:
        """Click the first visible overflow-menu item matching one of ``names``."""
        scope = self._overflow_menu_scope(serial_prefix)
        for name in names:
            try:
                item = menu_item(scope, name)
            except RuntimeError:
                continue
            item.scroll_into_view_if_needed()
            item.click()
            return True
        return False

    def _open_module_temp_slideout(
        self,
        serial_prefix: str,
        input_pattern: re.Pattern[str],
        *menu_names: str,
    ) -> bool:
        """Open a module temperature slideout, deactivating first if already heating."""
        set_names = tuple(
            name for name in menu_names if not name.lower().startswith("deactivate")
        )
        deactivate_names = tuple(
            name for name in menu_names if name.lower().startswith("deactivate")
        )
        if not set_names:
            return False

        if not self._open_module_overflow(serial_prefix):
            return False
        if self._click_module_menu_button(serial_prefix, *set_names):
            if self.page.get_by_test_id(input_pattern).count() > 0:
                return True

        if not deactivate_names or not self._click_module_menu_button(
            serial_prefix, *deactivate_names
        ):
            return False

        self._dismiss_blocking_overlays()
        deadline = time.time() + 8
        while time.time() < deadline:
            self.page.wait_for_timeout(500)
            if not self._open_module_overflow(serial_prefix):
                continue
            if self._click_module_menu_button(serial_prefix, *set_names):
                if self.page.get_by_test_id(input_pattern).count() > 0:
                    return True
            self._dismiss_blocking_overlays()
        return False

    def _module_menu(self, serial_prefix: str) -> Locator:
        """Return the module card root used to scope overflow menu actions."""
        return self._module_card(serial_prefix).first

    def _module_about_button(self, serial_prefix: str) -> Locator:
        """Return the About module button in a module overflow menu."""
        card = self._module_card(serial_prefix).first
        return card.get_by_test_id(re.compile(r"^about_module_")).or_(
            card.get_by_role("button", name="About module", exact=True)
        )

    def _click_about_module(self, serial_prefix: str, module_model: str) -> None:
        """Open the About module slideout for the given module model."""
        card = self._module_card(serial_prefix).first
        about_test_id = card.get_by_test_id(f"about_module_{module_model}")
        if about_test_id.count() > 0:
            about_test_id.click()
        else:
            card.get_by_role("button", name="About module", exact=True).click()

    def _click_module_menu_item(
        self, serial_prefix: str, *, test_id: str | None = None, name: str | None = None
    ) -> None:
        """Click a module overflow menu item by test id or visible name."""
        menu = self._module_menu(serial_prefix)
        if test_id is not None:
            menu.get_by_test_id(test_id).click()
        elif name is not None:
            menu.get_by_role("button", name=name, exact=True).click()
        else:
            raise ValueError("Provide test_id or name for module menu item.")

    def _overflow_menu_scope(self, serial_prefix: str) -> Locator:
        """Return the overflow menu container, falling back to the module card root."""
        menu = self._module_overflow_menu(serial_prefix)
        if menu.count() > 0:
            return menu.first
        return self._module_card(serial_prefix).first

    def _find_overflow_menu_item(
        self,
        serial_prefix: str,
        *,
        test_id: str | re.Pattern[str] | None = None,
        fallback_names: tuple[str, ...] = (),
    ) -> Locator | None:
        """Locate a module overflow item by test id, then visible button labels."""
        scope = self._overflow_menu_scope(serial_prefix)
        if test_id is not None:
            item = scope.get_by_test_id(test_id)
            if item.count() > 0 and item.first.is_visible():
                return item.first
        for name in fallback_names:
            try:
                return menu_item(scope, name)
            except RuntimeError:
                continue
        return None

    def _click_module_overflow_item_by_test_id(
        self,
        serial_prefix: str,
        test_id: str | re.Pattern[str],
        *,
        fallback_names: tuple[str, ...] = (),
    ) -> bool:
        """Open overflow menu and click a menu item located by test id or label."""
        if not self._open_module_overflow(serial_prefix):
            return False
        item = self._find_overflow_menu_item(
            serial_prefix,
            test_id=test_id,
            fallback_names=fallback_names,
        )
        if item is None:
            return False
        item.scroll_into_view_if_needed()
        item.click()
        return True

    def _test_shake_start_button(self) -> Locator:
        """Return the test-shake Start/Stop control (test id, scoped to slideout)."""
        by_test_id = self.page.get_by_test_id(TEST_SHAKE_START)
        if by_test_id.count() > 0:
            return by_test_id

        latch_row = self.page.get_by_test_id(TEST_SHAKE_LATCH_STATUS)
        slideout = latch_row.locator(
            "xpath=ancestor::*[.//input[@type='number']][1]"
        )
        for pattern in (r"^Start$", r"^Stop$"):
            btn = slideout.get_by_role(
                "button", name=re.compile(pattern, re.IGNORECASE)
            )
            if btn.count() > 0:
                return btn.first

        return self.page.get_by_role(
            "button", name=re.compile(r"^(Start|Stop)$", re.IGNORECASE)
        ).first

    def _confirm_heater_shaker_attachment_if_needed(self) -> None:
        """Confirm attachment when the test-shake safety modal appears."""
        confirm = self.page.get_by_test_id(HS_ATTACHMENT_CONFIRM)
        try:
            expect(confirm).to_be_visible(timeout=3_000)
        except AssertionError:
            return
        confirm.click()

    def _close_heater_shaker_latch_via_overflow(self, prefix: str) -> bool:
        """Close the latch from the overflow menu when it is currently open."""
        if not self._open_module_overflow(prefix):
            return False
        item = self._find_overflow_menu_item(
            prefix,
            test_id=HS_LATCH_MENU,
            fallback_names=("Close labware latch",),
        )
        if item is None:
            self._dismiss_blocking_overlays()
            return False
        item.scroll_into_view_if_needed()
        item.click()
        print("  close labware latch (overflow menu)")
        self._dismiss_blocking_overlays()
        return True

    def _wait_for_test_shake_slideout(self) -> bool:
        """Return True when the test-shake slideout latch row is visible."""
        latch_status = self.page.get_by_test_id(TEST_SHAKE_LATCH_STATUS)
        try:
            expect(latch_status).to_be_visible(timeout=15_000)
            return True
        except AssertionError:
            return False

    def _ensure_test_shake_latch_closed(self) -> None:
        """Click Close latch in the test-shake slideout when the latch is open."""
        status = self.page.get_by_test_id(TEST_SHAKE_LATCH_STATUS)
        expect(status).to_be_visible(timeout=5_000)
        if re.search(r"closed", status.inner_text(), re.IGNORECASE):
            return

        close_btn = self.page.get_by_role("button", name="Close latch", exact=True)
        expect(close_btn).to_be_visible(timeout=5_000)
        close_btn.click()
        expect(status).to_have_text(re.compile(r"closed", re.IGNORECASE), timeout=20_000)
        print("  closed labware latch (test shake slideout)")

    def _fill_test_shake_rpm(self, rpm: str) -> None:
        """Fill the test-shake RPM field (test id with spinbutton fallback)."""
        by_test_id = self.page.get_by_test_id(TEST_SHAKE_INPUT)
        if by_test_id.count() > 0:
            try:
                self._fill_input_by_test_id(TEST_SHAKE_INPUT, rpm, timeout=5_000)
                return
            except AssertionError:
                pass

        latch_row = self.page.get_by_test_id(TEST_SHAKE_LATCH_STATUS)
        slideout = latch_row.locator(
            "xpath=ancestor::*[.//input[@type='number']][1]"
        )
        spinbutton = slideout.get_by_role("spinbutton")
        if spinbutton.count() == 0:
            spinbutton = self.page.get_by_role("spinbutton")
        expect(spinbutton.first).to_be_visible(timeout=10_000)
        spinbutton.first.click()
        spinbutton.first.fill("")
        spinbutton.first.fill(rpm)
        spinbutton.first.press("Tab")

    def _ensure_heater_shaker_idle(self, prefix: str) -> None:
        """Deactivate shaker/heater so overflow menus return to idle labels."""
        for action in ("Deactivate shaker", "Deactivate heater"):
            if not self._open_module_overflow(prefix):
                return
            if not self._click_module_menu_button(prefix, action):
                continue
            print(f"  {action.lower()}")
            self._dismiss_blocking_overlays()
            self.page.wait_for_timeout(1_500)

    def _exercise_heater_shaker_test_shake(self, prefix: str) -> None:
        """Start and stop a test shake via stable slideout test ids."""
        try:
            self._ensure_heater_shaker_idle(prefix)

            if not self._click_module_overflow_item_by_test_id(
                prefix,
                HS_TEST_SHAKE_MENU,
                fallback_names=("Test shake",),
            ):
                print("  Skipping test shake — menu item not found.")
                self._dismiss_blocking_overlays()
                return

            if not self._wait_for_test_shake_slideout():
                print("  Skipping test shake — slideout did not open.")
                self._dismiss_blocking_overlays()
                return

            # Start is disabled while the latch is open — close it in the slideout first.
            self._ensure_test_shake_latch_closed()
            self.page.wait_for_timeout(750)

            try:
                self._fill_test_shake_rpm("2000")
            except AssertionError:
                print("  Skipping test shake — shake speed input did not appear.")
                self._dismiss_blocking_overlays()
                return

            start_btn = self._test_shake_start_button()
            expect(start_btn).to_be_enabled(timeout=10_000)
            start_btn.click()
            self._confirm_heater_shaker_attachment_if_needed()

            try:
                expect(start_btn).to_have_text(
                    re.compile(r"stop", re.IGNORECASE), timeout=30_000
                )
                start_btn.click()
                print("  test shake at 2000 rpm (started and stopped)")
            except AssertionError:
                print(
                    "  test shake started but stop control did not appear — deactivating shaker"
                )
                self._stop_heater_shaker_test_shake(prefix)
            self._dismiss_blocking_overlays()
        except PlaywrightError as error:
            if "has been closed" in str(error).lower():
                raise
            print(f"  Skipping test shake — {error}")
            self._dismiss_blocking_overlays()

    def _stop_heater_shaker_test_shake(self, prefix: str) -> None:
        """Stop an in-progress test shake via Stop or Deactivate shaker."""
        stop_btn = self._test_shake_start_button()
        if (
            stop_btn.count() > 0
            and stop_btn.is_visible()
            and re.search(r"stop", stop_btn.inner_text(), re.IGNORECASE)
        ):
            stop_btn.click()
            print("  stopped test shake")
            self._dismiss_blocking_overlays()
            return

        if not self._open_module_overflow(prefix):
            return
        item = self._find_overflow_menu_item(
            prefix,
            test_id=re.compile(rf"^test_shake_{re.escape(HEATER_SHAKER.model)}$"),
            fallback_names=("Deactivate shaker",),
        )
        if item is not None and not item.is_disabled():
            try:
                item.click(timeout=5_000)
                print("  deactivate shaker")
            except PlaywrightError:
                print("  deactivate shaker — click did not complete")
        self._dismiss_blocking_overlays()

    def _exercise_heater_shaker_latch(self, prefix: str) -> None:
        """Toggle the labware latch from the overflow menu."""
        if not self._open_module_overflow(prefix):
            return
        item = self._find_overflow_menu_item(
            prefix,
            test_id=HS_LATCH_MENU,
            fallback_names=("Open labware latch", "Close labware latch"),
        )
        if item is None:
            print("  Skipping labware latch — menu item not found.")
            self._dismiss_blocking_overlays()
            return
        if item.is_disabled():
            print("  Skipping labware latch — unavailable while module is shaking.")
            self._dismiss_blocking_overlays()
            return
        latch_label = item.inner_text().strip()
        item.scroll_into_view_if_needed()
        item.click()
        print(f"  {latch_label.lower()}")
        self._dismiss_blocking_overlays()

    def _fill_number_in_test_id(self, test_id_pattern: re.Pattern[str], value: str) -> None:
        """Fill a numeric input located by a test-id pattern."""
        field = self.page.get_by_test_id(test_id_pattern).first
        expect(field).to_be_visible()
        field.locator("input").fill(value)

    def _fill_input_by_test_id(
        self,
        test_id: str,
        value: str,
        *,
        timeout: float = 10_000,
    ) -> None:
        """Fill a numeric field located by test id (wrapper or input element)."""
        target = self.page.get_by_test_id(test_id).first
        expect(target).to_be_visible(timeout=timeout)
        target.scroll_into_view_if_needed()
        nested_input = target.locator("input")
        if nested_input.count() > 0:
            field = nested_input.first
        else:
            field = target
        expect(field).to_be_visible(timeout=timeout)
        field.click(timeout=timeout)
        field.fill("", timeout=timeout)
        field.fill(value, timeout=timeout)
        field.press("Tab")

    def _read_module_about_serial(self, module_model: str) -> tuple[str, str | None]:
        """Read serial and firmware text from an open About module slideout."""
        serial_locator = self.page.get_by_test_id(
            re.compile(rf"^alert_item_serial_{re.escape(module_model)}$")
        ).first
        expect(serial_locator).to_be_visible()
        serial = serial_locator.inner_text().strip()

        version_locator = self.page.get_by_test_id(
            re.compile(rf"^alert_item_version_{re.escape(module_model)}$")
        )
        firmware = None
        if version_locator.count() > 0:
            version_text = version_locator.first.locator("p")
            if version_text.count() > 0:
                firmware = version_text.inner_text().strip()
        return serial, firmware

    def _close_module_about(self) -> None:
        """Close the About module slideout."""
        close_btn = self.page.get_by_test_id(ABOUT_MODULE_CLOSE).first
        close_btn.click()
        expect(close_btn).not_to_be_visible()
        self._dismiss_blocking_overlays()

    def _open_instrument_overflow(self, label: str) -> bool:
        """Open an instrument card overflow menu when the card is enabled."""
        self._dismiss_blocking_overlays()
        card = self._instrument_card(label)
        if card.count() == 0:
            print(f"  Skipping instrument card '{label}' — not found.")
            return False
        overflow = self._instrument_overflow_button(label)
        if overflow.is_disabled():
            print(f"  Skipping instrument card '{label}' — overflow menu disabled.")
            return False
        overflow.click()
        return True

    def _close_pipette_or_gripper_about(self) -> None:
        """Close the About pipette or gripper slideout."""
        self.page.get_by_test_id("AboutPipette_slideout_close").click()
        self._dismiss_blocking_overlays()

    def exercise_pipette_card(self, mount: str = "left") -> None:
        """Open About pipette for the given mount and print serial/firmware."""
        if mount == "left+right":
            label = "left+right Mount"
        else:
            label = "left Mount" if mount == "left" else "right Mount"
        print(f"\n--- Pipette card ({label}) ---")

        if not self._open_instrument_overflow(label):
            return

        self.page.get_by_role("button", name="About pipette", exact=True).click()
        serial = self.page.get_by_test_id(ABOUT_PIPETTE_SERIAL).first.inner_text().strip()

        firmware = None
        version_heading = self.page.get_by_text(re.compile(r"^current version$", re.I))
        if version_heading.count() > 0:
            firmware = (
                version_heading.first.locator("xpath=following-sibling::p[1]").inner_text().strip()
            )

        print(f"  Pipette serial: {serial}")
        if firmware:
            print(f"  Pipette firmware: {firmware}")

        self._close_pipette_or_gripper_about()

    def exercise_gripper_card(self) -> None:
        """Open About gripper and print serial/firmware."""
        label = "extension mount"
        print("\n--- Flex gripper card ---")

        if not self._open_instrument_overflow(label):
            return

        self.page.get_by_role("button", name="About gripper", exact=True).click()

        serial_heading = self.page.get_by_text(re.compile(r"^serial number$", re.I))
        expect(serial_heading).to_be_visible()
        serial = serial_heading.locator("xpath=following-sibling::p[1]").inner_text().strip()

        firmware = None
        version_heading = self.page.get_by_text(re.compile(r"^current version$", re.I))
        if version_heading.count() > 0:
            firmware = (
                version_heading.first.locator("xpath=following-sibling::p[1]").inner_text().strip()
            )

        print(f"  Gripper serial: {serial}")
        if firmware:
            print(f"  Gripper firmware: {firmware}")

        self._close_pipette_or_gripper_about()

    def exercise_thermocycler_card(self, prefix: str | None = None) -> None:
        """Exercise thermocycler lid and block temperature controls."""
        prefix = prefix or self.module_prefix(THERMOCYCLER)
        if not self._begin_module_exercise(THERMOCYCLER, prefix):
            return

        if not self._open_module_overflow(prefix):
            return

        close_lid = self._module_menu(prefix).get_by_role(
            "button", name="Close lid", exact=True
        )
        if close_lid.count() > 0 and close_lid.is_visible():
            close_lid.click()
            print("  Close lid")
            self._dismiss_blocking_overlays()

        if not self._open_module_overflow(prefix):
            return

        if not self._open_module_temp_slideout(
            prefix,
            TC_INPUT,
            "Set lid temperature",
            "Deactivate lid",
        ):
            print("  Skipping lid temperature — menu item not found.")
            self._dismiss_blocking_overlays()
            return
        self._fill_number_in_test_id(TC_INPUT, "80")
        self.page.get_by_test_id(TC_SUBMIT).first.click()
        print("  set lid temperature to 80")
        self._dismiss_blocking_overlays()

        if not self._open_module_overflow(prefix):
            return

        if not self._open_module_temp_slideout(
            prefix,
            TC_INPUT,
            "Set block temperature",
            "Deactivate block",
        ):
            print("  Skipping block temperature — menu item not found.")
            self._dismiss_blocking_overlays()
            return
        self._fill_number_in_test_id(TC_INPUT, "60")
        self.page.get_by_test_id(TC_SUBMIT).first.click()
        print("  set block temperature to 60")
        self._dismiss_blocking_overlays()

    def exercise_heater_shaker_card(self, prefix: str | None = None) -> None:
        """Exercise heater-shaker temperature, test-shake, and latch controls."""
        prefix = prefix or self.module_prefix(HEATER_SHAKER)
        if not self._begin_module_exercise(HEATER_SHAKER, prefix):
            return

        self._ensure_heater_shaker_idle(prefix)

        if not self._open_module_temp_slideout(
            prefix,
            HS_INPUT,
            "Set module temperature",
            "Deactivate heater",
        ):
            print("  Skipping module temperature — menu item not found.")
            self._dismiss_blocking_overlays()
            return
        self._fill_number_in_test_id(HS_INPUT, "40")
        self.page.get_by_test_id(HS_SUBMIT).first.click()
        print("  set temperature to 40")
        self._dismiss_blocking_overlays()

        # Test shake requires a closed latch; close it in-slideout if needed.
        self._exercise_heater_shaker_test_shake(prefix)
        self._ensure_heater_shaker_idle(prefix)
        # Exercise overflow-menu latch toggle separately (typically opens latch).
        self._exercise_heater_shaker_latch(prefix)

    def exercise_temperature_module_card(self, prefix: str | None = None) -> None:
        """Set temperature module target to 4 °C via the overflow menu."""
        prefix = prefix or self.module_prefix(TEMPERATURE)
        if not self._begin_module_exercise(TEMPERATURE, prefix):
            return

        if not self._open_module_temp_slideout(
            prefix,
            TEMP_INPUT,
            "Set module temperature",
            "Deactivate module",
        ):
            print("  Skipping module temperature — menu item not found.")
            self._dismiss_blocking_overlays()
            return
        self._fill_number_in_test_id(TEMP_INPUT, "4")
        self.page.get_by_test_id(TEMP_SUBMIT).first.click()
        print("  set module temperature to 4")
        self._dismiss_blocking_overlays()

    def exercise_lights(self) -> None:
        """Toggle the robot lights switch on the overview page."""
        print("\n--- Robot lights ---")
        self._dismiss_blocking_overlays()

        toggle = self.page.locator("#RobotOverview_lightsToggle")
        if toggle.count() == 0:
            toggle = self.page.get_by_role("switch", name="Lights")
        if toggle.count() == 0:
            print("  Skipping lights — toggle not found.")
            return

        was_on = toggle.get_attribute("aria-checked") == "true"
        toggle.click()
        now_on = toggle.get_attribute("aria-checked") == "true"
        print(f"  Lights toggled: {'on' if was_on else 'off'} -> {'on' if now_on else 'off'}")

    def exercise_all(
        self,
        *,
        thermocycler_prefix: str | None = None,
        heater_shaker_prefix: str | None = None,
        temperature_module_prefix: str | None = None,
        plate_reader_prefix: str | None = None,
    ) -> None:
        """Run every configured card exercise in one session."""
        print("\n=== Device card exercises ===")

        overrides = {
            THERMOCYCLER.model: thermocycler_prefix,
            HEATER_SHAKER.model: heater_shaker_prefix,
            TEMPERATURE.model: temperature_module_prefix,
            PLATE_READER.model: plate_reader_prefix,
        }
        self.print_module_inventory(prefix_overrides=overrides)

        if self.has_dual_mount_pipette_card():
            self.exercise_pipette_card(mount="left+right")
        else:
            self.exercise_pipette_card(mount="left")
            self.exercise_pipette_card(mount="right")
        self.exercise_gripper_card()

        for spec in MODULE_CARD_SPECS:
            prefix = overrides.get(spec.model) or self.module_prefix(spec)
            if not self.has_module_card(prefix):
                print(
                    f"\n--- {spec.label} (prefix: {prefix}) ---\n"
                    f"  Skipping — card not found or disabled."
                )
                continue
            if spec.exercise is None:
                continue
            getattr(self, spec.exercise)(prefix=prefix)

        self.exercise_lights()

        print("\n=== Device card exercises complete (verify robot responses manually) ===")
