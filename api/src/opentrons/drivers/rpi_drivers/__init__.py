import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .dev_types import GPIODriverLike

MODULE_LOG = logging.getLogger(__name__)


def build_gpio_chardev(chip_name: str) -> 'GPIODriverLike':
    try:
        from .gpio import GPIOCharDev
        return GPIOCharDev(chip_name)
    except (ImportError, OSError):
        MODULE_LOG.info(
            'Failed to initialize character device, cannot control gpios')
        from .gpio_simulator import SimulatingGPIOCharDev
        return SimulatingGPIOCharDev(chip_name)
