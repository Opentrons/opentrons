from opentrons import hardware_control as hc


async def test_gpio_setup(loop):
    # Test without DTOVERLAY path
    # Board revision should be defaulted to 2.1
    backend = hc.Controller(config=None)
    await backend.setup_gpio_chardev()
    assert str(backend.board_revision) == '2.1'
