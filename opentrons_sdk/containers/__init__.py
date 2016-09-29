from opentrons_sdk.robot.robot import Robot


def load(container_name, slot):
    protocol = Robot.get_instance()
    return protocol.add_container(slot, container_name)