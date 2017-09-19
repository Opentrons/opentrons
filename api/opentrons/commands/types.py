COMMAND = 'command'


# Robot #
def makeRobotCommandName(name):
    return '{}.{}'.format(COMMAND, name)


ASPIRATE = makeRobotCommandName('ASPIRATE')
DISPENSE = makeRobotCommandName('DISPENSE')
MIX = makeRobotCommandName('MIX')
CONSOLIDATE = makeRobotCommandName('CONSOLIDATE')
DISTRIBUTE = makeRobotCommandName('DISTRIBUTE')
TRANSFER = makeRobotCommandName('TRANSFER')
PICK_UP_TIP = makeRobotCommandName('PICK_UP_TIP')
DROP_TIP = makeRobotCommandName('DROP_TIP')
COMMENT = makeRobotCommandName('COMMENT')
MAGBEAD_ENGAGE = makeRobotCommandName('MAGBEAD_ENGAGE')
DELAY = makeRobotCommandName('DELAY')
BLOW_OUT = makeRobotCommandName('BLOW_OUT')
AIR_GAP = makeRobotCommandName('AIR_GAP')
TOUCH_TIP = makeRobotCommandName('TOUCH_TIP')
RETURN_TIP = makeRobotCommandName('RETURN_TIP')
HOME = makeRobotCommandName('HOME')
