from opentrons_sdk.protocol.robot import Robot


def load(container_name, slot):
    protocol = Robot.get_instance()
    return protocol.add_container(slot, container_name)