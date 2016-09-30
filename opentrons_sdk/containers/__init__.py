

def load(container_name, slot):
    from opentrons_sdk.robot import Robot
    protocol = Robot.get_instance()
    return protocol.add_container(slot, container_name)
