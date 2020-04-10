import logging

MODULE_LOG = logging.getLogger(__name__)


def build_gpio_chardev(chip_name: str):
    try:
        from .gpio import GPIOCharDev
        return GPIOCharDev(chip_name)
    except ImportError:
        MODULE_LOG.warning(
            'Failed to initialize character device, cannot control gpios')
        from .gpio_simulator import SimulatingGPIOCharDev
        return SimulatingGPIOCharDev(chip_name)
