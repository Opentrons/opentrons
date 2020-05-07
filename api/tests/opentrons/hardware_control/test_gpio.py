from opentrons.hardware_control import Controller


async def test_gpio_setup(loop):
    # Test without DTOVERLAY path
    # Board revision should be defaulted to 2.1
    backend = Controller(config=None)
    await backend.setup_gpio_chardev()
    assert str(backend.board_revision) == '2.1'
