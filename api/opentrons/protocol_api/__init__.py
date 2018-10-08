""" protocol_api: The user-facing API for OT2 protocols.

This package defines classes and functions for access through a protocol to
control the OT2.

"""
import enum
import os
from typing import List, Dict

from opentrons.protocol_api.labware import Well, Labware, load
from . import back_compat


def run(protocol_bytes: bytes = None,
        protocol_json: str = None,
        simulate: bool = False,
        context: 'ProtocolContext' = None):
        """ Create a ProtocolRunner instance from one of a variety of protocol
        sources.

        :param protocol_bytes: If the protocol is a Python protocol, pass the
        file contents here.
        :param protocol_json: If the protocol is a json file, pass the contents
        here.
        :param simulate: True to simulate; False to execute. If thsi is not an
        OT2, ``simulate`` will be forced ``True``.
        :param context: The context to use. If ``None``, create a new
        ProtocolContext.
        """
        if not os.environ.get('RUNNING_ON_PI'):
            simulate = True # noqa - will be used later
        if None is context and simulate:
            true_context = ProtocolContext()
        elif context:
            true_context = context
        else:
            raise RuntimeError(
                'Will not automatically generate hardware controller')
        if protocol_bytes:
            back_compat.run(protocol_bytes, true_context)
        elif protocol_json:
            pass


class ProtocolContext:
    """ The Context class is a container for the state of a protocol.

    It encapsulates many of the methods formerly found in the Robot class,
    including labware, instrument, and module loading; core functions like
    pause and resume.
    """

    def __init__(self):
        pass

    def load_labware(
            self, labware_obj: Labware, location: str,
            label: str = None, share: bool = False):
        """ Specify the presence of a piece of labware on the OT2 deck.

        This function loads the labware specified by ``labware``
        (previously loaded from a configuration file) to the location
        specified by ``location``.
        """
        pass

    def load_labware_by_name(
            self, labware_name: str, location: str) -> Labware:
        """ A convenience function to specify a piece of labware by name.

        For labware already defined by Opentrons, this is a convient way
        to collapse the two stages of labware initialization (creating
        the labware and adding it to the protocol) into one.

        This function returns the created and initialized labware for use
        later in the protocol.
        """
        labware = load(labware_name, location)
        self.load_labware(labware, location)
        return labware

    @property
    def loaded_labwares(self) -> Dict[str, Labware]:
        """ Get the labwares that have been loaded into the protocol context.

        The return value is a dict mapping locations to labware, sorted
        in order of the locations.
        """
        pass

    def load_instrument(
            self, instrument_name: str, mount: str) \
            -> 'InstrumentContext':
        """ Specify a specific instrument required by the protocol.

        This value will actually be checked when the protocol runs, to
        ensure that the correct instrument is attached in the specified
        location.
        """
        pass

    @property
    def loaded_instruments(self) -> Dict[str, 'InstrumentContext']:
        """ Get the instruments that have been loaded into the protocol context

        The return value is a dict mapping locations to instruments, sorted
        in order of mounts (so 'left' (if any), then 'right' (if any))
        """
        pass

    def pause(self):
        """ Pause execution of the protocol until resume is called.

        Note: This function call will not return until the protocol
        is resumed (presumably by a user in the run app).
        """
        pass

    def resume(self):
        """ Resume a previously-paused protocol. """
        pass

    def comment(self, msg):
        """ Add a user-readable comment string that will be echoed to the
        Opentrons app. """
        pass


class InstrumentContext:
    """ A context for a specific pipette or instrument.

    This can be used to call methods related to pipettes - moves or
    aspirates or dispenses, or higher-level methods.

    Instances of this class bundle up state and config changes to a
    pipette - for instance, changes to flow rates or trash containers.
    Action methods (like :py:meth:``aspirate`` or :py:meth:``distribute``) are
    defined here for convenience.

    In general, this class should not be instantiated directly; rather,
    instances are returned from :py:meth:``ProtcolContext.load_instrument``.
    """

    class MODE(enum.Enum):
        """ Definition for the modes in which a pipette can operate.
        """
        ASPIRATE = 'aspirate'
        DISPENSE = 'dispense'

    class TYPE(enum.Enum):
        """ Definition for the types of pipettte.
        """
        SINGLE = 'single'
        MULTI = 'multi'

    def __init__(self, ctx, tip_racks,
                 **config_kwargs):
        pass

    def aspirate(self,
                 volume: float = None,
                 location: Well = None,
                 rate: float = 1.0):
        pass

    def dispense(self,
                 volume: float = None,
                 location: Well = None,
                 rate: float = 1.0):
        pass

    def mix(self,
            repetitions: int = 1,
            volume: float = None,
            location: Well = None,
            rate: float = 1.0):
        pass

    def blow_out(self, location: Well = None):
        pass

    def touch_tip(self,
                  location: Well = None,
                  radius: float = 1.0,
                  v_offset: float = -1.0,
                  speed: float = 60.0):
        pass

    def air_gap(self,
                volume: float = None,
                height: float = None):
        pass

    def return_tip(self, home_after: bool = True):
        pass

    def pick_up_tip(self, location: Well = None,
                    presses: int = 3,
                    increment: int = 1):
        pass

    def drop_tip(self, location: Well = None,
                 home_after: bool = True):
        pass

    def home(self):
        pass

    def distribute(self,
                   volume: float,
                   source: Well,
                   dest: Well,
                   *args, **kwargs):
        pass

    def consolidate(self,
                    volume: float,
                    source: Well,
                    dest: Well,
                    *args, **kwargs):
        pass

    def transfer(self,
                 volume: float,
                 source: Well,
                 dest: Well,
                 **kwargs):
        pass

    @property
    def speeds(self) -> Dict[MODE, float]:
        """ The speeds (in mm/s) configured for the pipette, as a dict.

        The keys will be 'aspirate' and 'dispense' (e.g. the keys of
        :py:class:`MODE`)

        :note: This property is equivalent to :py:attr:`speeds`; the only
        difference is the units in which this property is specified.
        """
        pass

    @speeds.setter
    def speeds(self, new_speeds: Dict[MODE, float]) -> None:
        """ Update the speeds (in mm/s) set for the pipette.

        :param new_speeds: A dict containing at least one of 'aspirate'
        and 'dispense',  mapping to new speeds in mm/s.
        """
        pass

    @property
    def flow_rate(self) -> Dict[MODE, float]:
        """ The speeds (in uL/s) configured for the pipette, as a dict.

        The  keys will be 'aspirate' and 'dispense'.

        :note: This property is equivalent to :py:attr:`speeds`; the only
        difference is the units in which this property is specified.
        """
        pass

    @flow_rate.setter
    def flow_rate(self, new_flow_rate: Dict[MODE, float]) -> None:
        """ Update the speeds (in uL/s) for the pipette.

        :param new_flow_rates: A dict containing at least one of 'aspirate
        and 'dispense', mapping to new speeds in uL/s.
        """
        pass

    @property
    def pick_up_current(self) -> float:
        """
        The current (amperes) the pipette mount's motor will use
        while picking up a tip. Specified in amps.
        """
        pass

    @pick_up_current.setter
    def pick_up_current(self, amps: float):
        """ Set the current used when picking up a tip.

        :param amps: The current, in amperes. Acceptable values: (0.0, 2.0)
        """

    @property
    def type(self) -> TYPE:
        """ One of :py:class:`TYPE`.
        """
        pass

    @property
    def tip_racks(self) -> List[Labware]:
        """ Query which tipracks have been linked to this PipetteContext"""
        pass

    @tip_racks.setter
    def tip_racks(self, racks: List[Labware]):
        pass

    @property
    def trash_container(self) -> Labware:
        """ The location the pipette will dispense trash to.
        """
        pass

    @trash_container.setter
    def trash_container(self, trash: Labware):
        pass
