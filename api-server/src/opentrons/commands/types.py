COMMAND = 'command'


# helpers #

def makeRobotCommandName(name):
    return '{}.{}'.format(COMMAND, name)


# Robot #

DELAY = makeRobotCommandName('DELAY')
HOME = makeRobotCommandName('HOME')
PAUSE = makeRobotCommandName('PAUSE')
RESUME = makeRobotCommandName('RESUME')
COMMENT = makeRobotCommandName('COMMENT')

# Pipette #

ASPIRATE = makeRobotCommandName('ASPIRATE')
DISPENSE = makeRobotCommandName('DISPENSE')
MIX = makeRobotCommandName('MIX')
CONSOLIDATE = makeRobotCommandName('CONSOLIDATE')
DISTRIBUTE = makeRobotCommandName('DISTRIBUTE')
TRANSFER = makeRobotCommandName('TRANSFER')
PICK_UP_TIP = makeRobotCommandName('PICK_UP_TIP')
DROP_TIP = makeRobotCommandName('DROP_TIP')
BLOW_OUT = makeRobotCommandName('BLOW_OUT')
AIR_GAP = makeRobotCommandName('AIR_GAP')
TOUCH_TIP = makeRobotCommandName('TOUCH_TIP')
RETURN_TIP = makeRobotCommandName('RETURN_TIP')

# Modules #

MAGDECK_CALIBRATE = makeRobotCommandName('MAGDECK_CALIBRATE')
MAGDECK_DISENGAGE = makeRobotCommandName('MAGDECK_DISENGAGE')
MAGDECK_ENGAGE = makeRobotCommandName('MAGDECK_ENGAGE')

TEMPDECK_DEACTIVATE = makeRobotCommandName('TEMPDECK_DEACTIVATE')
TEMPDECK_SET_TEMP = makeRobotCommandName('TEMPDECK_SET_TEMP')

THERMOCYCLER_OPEN = makeRobotCommandName('THERMOCYCLER_OPEN')
THERMOCYCLER_CLOSE = makeRobotCommandName('THERMOCYCLER_CLOSE')
THERMOCYCLER_SET_BLOCK_TEMP = makeRobotCommandName(
    'THERMOCYCLER_SET_BLOCK_TEMP')
THERMOCYCLER_EXECUTE_PROFILE = makeRobotCommandName(
    'THERMOCYCLER_EXECUTE_PROFILE')
THERMOCYCLER_DEACTIVATE = makeRobotCommandName('THERMOCYCLER_DEACTIVATE')
THERMOCYCLER_WAIT_FOR_HOLD = makeRobotCommandName('THERMOCYCLER_WAIT_FOR_HOLD')
THERMOCYCLER_WAIT_FOR_TEMP = makeRobotCommandName('THERMOCYCLER_WAIT_FOR_TEMP')
THERMOCYCLER_WAIT_FOR_LID_TEMP = makeRobotCommandName(
    'THERMOCYCLER_WAIT_FOR_LID_TEMP')
THERMOCYCLER_SET_LID_TEMP = makeRobotCommandName('THERMOCYCLER_SET_LID_TEMP')
THERMOCYCLER_DEACTIVATE_LID = makeRobotCommandName(
    'THERMOCYCLER_DEACTIVATE_LID')
THERMOCYCLER_DEACTIVATE_BLOCK = makeRobotCommandName(
    'THERMOCYCLER_DEACTIVATE_BLOCK')
