from __future__ import annotations

import re

from playwright.sync_api import Locator, Page, expect

TC_INPUT = re.compile(r"^ThermocyclerSlideout_input_field_")
TC_SUBMIT = re.compile(r"^ThermocyclerSlideout_btn_")
TEMP_INPUT = re.compile(r"^TemperatureSlideout_input_field_")
TEMP_SUBMIT = re.compile(r"^TemperatureSlideout_btn_")
HS_INPUT = re.compile(r"^HeaterShakerSlideout_input_field_")
HS_SUBMIT = re.compile(r"^HeaterShakerSlideout_btn_")
ABOUT_MODULE_CLOSE = re.compile(r"^AboutModuleSlideout_btn_")
ABOUT_PIPETTE_SERIAL = re.compile(r"^AboutPipetteSlideout_serial_")

THERMOCYCLER_MODEL = "thermocyclerModuleV2"
HEATER_SHAKER_MODEL = "heaterShakerModuleV1"
TEMPERATURE_MODEL = "temperatureModuleV2"


class DeviceCardHelper:
    """Page object for exercising pipette, gripper, and module cards on a robot detail page."""

    def __init__(self, page: Page):
        self.page = page

    def _module_overflow_btn(self, serial_prefix: str) -> Locator:
        return self.page.get_by_test_id(
            re.compile(rf"^ModuleCard_overflow_btn_{re.escape(serial_prefix)}")
        )

    def _module_overflow_menu(self, serial_prefix: str) -> Locator:
        return self.page.get_by_test_id(
            re.compile(rf"^ModuleCard_overflow_menu_{re.escape(serial_prefix)}")
        )

    def _instrument_card(self, label: str) -> Locator:
        return (
            self.page.locator("div")
            .filter(has=self.page.get_by_text(label, exact=True))
            .filter(
                has=self.page.get_by_role(
                    "button", name=re.compile("InstrumentCard_overflowMenu")
                )
            )
            .first
        )

    def has_module_card(self, serial_prefix: str) -> bool:
        btn = self._module_overflow_btn(serial_prefix)
        return btn.count() > 0 and not btn.first.is_disabled()

    def has_instrument_card(self, label: str) -> bool:
        card = self._instrument_card(label)
        if card.count() == 0:
            return False
        overflow = card.get_by_role(
            "button", name=re.compile("InstrumentCard_overflowMenu")
        )
        return not overflow.is_disabled()

    def _open_module_overflow(self, serial_prefix: str) -> bool:
        btn = self._module_overflow_btn(serial_prefix)
        if btn.count() == 0:
            print(f"  Skipping module with prefix '{serial_prefix}' — card not found.")
            return False
        overflow = btn.first
        if overflow.is_disabled():
            print(
                f"  Skipping module with prefix '{serial_prefix}' — overflow menu disabled."
            )
            return False
        overflow.click()
        expect(self._module_overflow_menu(serial_prefix).first).to_be_visible()
        return True

    def _module_menu(self, serial_prefix: str) -> Locator:
        return self._module_overflow_menu(serial_prefix).first

    def _click_module_menu_item(
        self, serial_prefix: str, *, test_id: str | None = None, name: str | None = None
    ) -> None:
        menu = self._module_menu(serial_prefix)
        if test_id is not None:
            menu.get_by_test_id(test_id).click()
        elif name is not None:
            menu.get_by_role("menuitem", name=name, exact=True).click()
        else:
            raise ValueError("Provide test_id or name for module menu item.")

    def _fill_number_in_test_id(self, test_id_pattern: re.Pattern[str], value: str) -> None:
        field = self.page.get_by_test_id(test_id_pattern).first
        expect(field).to_be_visible()
        field.locator("input").fill(value)

    def _read_module_about_serial(self, module_model: str) -> tuple[str, str | None]:
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
            firmware = (
                version_locator.first.locator("xpath=following-sibling::p[1]").inner_text().strip()
            )
        return serial, firmware

    def _close_module_about(self) -> None:
        close_btn = self.page.get_by_test_id(ABOUT_MODULE_CLOSE).first
        close_btn.click()
        expect(close_btn).not_to_be_visible()

    def _open_instrument_overflow(self, label: str) -> bool:
        card = self._instrument_card(label)
        if card.count() == 0:
            print(f"  Skipping instrument card '{label}' — not found.")
            return False
        overflow = card.get_by_role(
            "button", name=re.compile("InstrumentCard_overflowMenu")
        )
        if overflow.is_disabled():
            print(f"  Skipping instrument card '{label}' — overflow menu disabled.")
            return False
        overflow.click()
        return True

    def _close_pipette_or_gripper_about(self) -> None:
        self.page.get_by_test_id("AboutPipette_slideout_close").click()

    def exercise_pipette_card(self, mount: str = "left") -> None:
        label = "left Mount" if mount == "left" else "right Mount"
        print(f"\n--- Pipette card ({label}) ---")

        if not self._open_instrument_overflow(label):
            return

        self.page.get_by_role("menuitem", name="About pipette", exact=True).click()
        serial = self.page.get_by_test_id(ABOUT_PIPETTE_SERIAL).first.inner_text().strip()

        firmware = None
        version_heading = self.page.get_by_text("Current version", exact=True)
        if version_heading.count() > 0:
            firmware = (
                version_heading.first.locator("xpath=following-sibling::p[1]").inner_text().strip()
            )

        print(f"  Pipette serial: {serial}")
        if firmware:
            print(f"  Pipette firmware: {firmware}")

        self._close_pipette_or_gripper_about()

    def exercise_gripper_card(self) -> None:
        label = "extension mount"
        print("\n--- Flex gripper card ---")

        if not self._open_instrument_overflow(label):
            return

        self.page.get_by_role("menuitem", name="About gripper", exact=True).click()

        serial_heading = self.page.get_by_text("Serial number", exact=True)
        expect(serial_heading).to_be_visible()
        serial = serial_heading.locator("xpath=following-sibling::p[1]").inner_text().strip()

        firmware = None
        version_heading = self.page.get_by_text("Current version", exact=True)
        if version_heading.count() > 0:
            firmware = (
                version_heading.first.locator("xpath=following-sibling::p[1]").inner_text().strip()
            )

        print(f"  Gripper serial: {serial}")
        if firmware:
            print(f"  Gripper firmware: {firmware}")

        self._close_pipette_or_gripper_about()

    def exercise_thermocycler_card(self, prefix: str = "TC2") -> None:
        print(f"\n--- Thermocycler card (prefix: {prefix}) ---")

        if not self._open_module_overflow(prefix):
            return

        self._click_module_menu_item(
            prefix, test_id=f"about_module_{THERMOCYCLER_MODEL}"
        )
        serial, firmware = self._read_module_about_serial(THERMOCYCLER_MODEL)
        print(f"  Module serial: {serial}")
        if firmware:
            print(f"  Module firmware: {firmware}")
        self._close_module_about()

        if not self._open_module_overflow(prefix):
            return

        close_lid = self._module_menu(prefix).get_by_role(
            "menuitem", name="Close lid", exact=True
        )
        if close_lid.count() > 0 and close_lid.is_visible():
            close_lid.click()
            print("  Close lid")

        if not self._open_module_overflow(prefix):
            return

        self._module_menu(prefix).get_by_role(
            "menuitem", name="Set lid temperature", exact=True
        ).click()
        self._fill_number_in_test_id(TC_INPUT, "80")
        self.page.get_by_test_id(TC_SUBMIT).first.click()
        print("  set lid temperature to 80")

        if not self._open_module_overflow(prefix):
            return

        self._module_menu(prefix).get_by_role(
            "menuitem", name="Set block temperature", exact=True
        ).click()
        self._fill_number_in_test_id(TC_INPUT, "60")
        self.page.get_by_test_id(TC_SUBMIT).first.click()
        print("  set block temperature to 60")

    def exercise_heater_shaker_card(self, prefix: str = "HSV0") -> None:
        print(f"\n--- Heater-Shaker card (prefix: {prefix}) ---")

        if not self._open_module_overflow(prefix):
            return

        self._click_module_menu_item(
            prefix, test_id=f"about_module_{HEATER_SHAKER_MODEL}"
        )
        serial, firmware = self._read_module_about_serial(HEATER_SHAKER_MODEL)
        print(f"  Module serial: {serial}")
        if firmware:
            print(f"  Module firmware: {firmware}")
        self._close_module_about()

        if not self._open_module_overflow(prefix):
            return

        self._module_menu(prefix).get_by_role(
            "menuitem", name="Set module temperature", exact=True
        ).click()
        self._fill_number_in_test_id(HS_INPUT, "40")
        self.page.get_by_test_id(HS_SUBMIT).first.click()
        print("  set temperature to 40")

        if not self._open_module_overflow(prefix):
            return

        latch_item = self._module_menu(prefix).get_by_test_id(
            re.compile(rf"^hs_labware_latch_{re.escape(HEATER_SHAKER_MODEL)}$")
        )
        if latch_item.count() > 0:
            latch_label = latch_item.inner_text().strip()
            latch_item.click()
            print(f"  {latch_label.lower()}")
        else:
            print("  Skipping labware latch — menu item not found.")

        if not self._open_module_overflow(prefix):
            return

        self._module_menu(prefix).get_by_role(
            "menuitem", name="Test shake", exact=True
        ).click()
        expect(self.page.get_by_test_id("TestShakeSlideout_shake_input")).to_be_visible()
        self.page.get_by_test_id("TestShakeSlideout_shake_input").locator("input").fill(
            "2000"
        )
        print("  test shake at 2000 rpm")
        self.page.get_by_test_id(re.compile(r"^Temp_Slideout_set_temp_btn_")).first.click()

    def exercise_temperature_module_card(self, prefix: str = "TD2") -> None:
        print(f"\n--- Temperature module card (prefix: {prefix}) ---")

        if not self._open_module_overflow(prefix):
            return

        self._click_module_menu_item(
            prefix, test_id=f"about_module_{TEMPERATURE_MODEL}"
        )
        serial, firmware = self._read_module_about_serial(TEMPERATURE_MODEL)
        print(f"  Module serial: {serial}")
        if firmware:
            print(f"  Module firmware: {firmware}")
        self._close_module_about()

        if not self._open_module_overflow(prefix):
            return

        self._module_menu(prefix).get_by_role(
            "menuitem", name="Set module temperature", exact=True
        ).click()
        self._fill_number_in_test_id(TEMP_INPUT, "4")
        self.page.get_by_test_id(TEMP_SUBMIT).first.click()
        print("  set module temperature to 4")

    def exercise_lights(self) -> None:
        print("\n--- Robot lights ---")

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
        thermocycler_prefix: str = "TC2",
        heater_shaker_prefix: str = "HSV0",
        temperature_module_prefix: str = "TD2",
    ) -> None:
        print("\n=== Device card exercises ===")

        self.exercise_pipette_card(mount="left")
        self.exercise_pipette_card(mount="right")
        self.exercise_gripper_card()
        self.exercise_thermocycler_card(prefix=thermocycler_prefix)
        self.exercise_heater_shaker_card(prefix=heater_shaker_prefix)
        self.exercise_temperature_module_card(prefix=temperature_module_prefix)
        self.exercise_lights()

        print("\n=== Device card exercises complete (verify robot responses manually) ===")
