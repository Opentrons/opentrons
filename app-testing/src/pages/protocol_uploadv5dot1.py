"""Model for the screens of protocol upload v5dot1."""
import logging
from typing import Optional, Tuple
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains

from src.driver.highlight import highlight

logger = logging.getLogger(__name__)

"""Class for Protocol Upload landing page."""


class ProtocolUpload:
    browse_our_protocol_library_button_locator: Tuple[str, str] = (
        By.ID,
        "UploadInput_protocolLibraryButton",
    )
