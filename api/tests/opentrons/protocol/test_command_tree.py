from opentrons.session import Session


def test_command_tree(protocol):
    session = Session('dino', protocol.text)
    _, commands = session.run()
    print(commands)
