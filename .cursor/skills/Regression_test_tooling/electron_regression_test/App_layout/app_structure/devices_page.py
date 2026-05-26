from playwright.sync_api import Page, expect


class DevicesPage:
    def __init__(self, page: Page, *, robot_name: str = "QA1Potato"):
        self.page = page
        self.robot_name = robot_name

    @property
    def nav_link(self):
        return self.page.get_by_role("link", name="Devices", exact=True)

    @property
    def robot_card(self):
        return self.page.locator(f"#RobotCard_{self.robot_name}_robotImage")

    def navigate(self):
        self.nav_link.click()
        self.page.wait_for_url("**/devices**")
        expect(self.nav_link).to_have_attribute("aria-current", "page")
        card = self.robot_card
        card.scroll_into_view_if_needed()
        card.click()
        self.page.wait_for_url(f"**/devices/{self.robot_name}**")
