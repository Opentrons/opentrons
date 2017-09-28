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





# FIXME: The following should eventually live in the robot
#
# def setup_robot(self):
#     self.setup_pose_tracking()
#     self.setup_deck()
#     self.setup_gantry(self._driver)
#     self.setup_frame_base()
#
# def setup_pose_tracking(self):
#     self.pose_tracker = pose_tracker.PoseTracker()
#
# def setup_deck(self):
#     self._deck = containers.Deck()
#     # Setup Deck as root object for pose tracker
#     self.pose_tracker.create_root_object(
#         self._deck, *self._deck._coordinates
#     )
#     self.add_slots_to_deck()
#
#
# def setup_gantry(self):
#     self._gantry = Gantry()
#
# def setup_frame_base(self):
#     self._frame_base = FrameBase()