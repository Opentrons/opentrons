class InstrumentMotor(object):
    """
    Provides access to Robot's head motor.
    """
    def __init__(self, driver, axis):
        self.axis = axis
        self.driver = driver

    def move(self, value):
        ''' Move motor '''
        self.driver.move(**{self.axis:value})

    def home(self):
        ''' Home plunger motor '''
        self.driver.home(self.axis)

    #TODO: Should instruments be able to delay overall system operation?
    def delay(self, seconds):
        self.driver.delay(seconds)

    #FIXME: Should instruments be able to set speed for overall system motion?
    def set_speed(self, rate):
        ''' Set combined motion speed '''
        self.driver.set_speed(rate)





class Gantry:
    '''
    Responsible for:
        - Gantry, independent of the instruments
        - Providing driver resources to instruments

    Not Response for:
        - Robot state, or any instrument specific actions
    '''

    def __init__(self, driver):
        self.driver = driver

    def add_instrument(self, instrument_slot, instrument):
        instrument.motor = InstrumentMotor(self.driver, instrument_slot)
