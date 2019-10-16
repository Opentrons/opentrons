""" A backwards-compatibility shim for the new protocol API.

This should not be imported directly; it is used to provide backwards
compatible singletons in opentrons/__init__.py.
"""

import importlib.util
from typing import List, TYPE_CHECKING

from opentrons.config.pipette_config import config_models
from opentrons.types import Mount
from ..labware import Labware
from .robot_wrapper import Robot
from .instrument_wrapper import Pipette

if TYPE_CHECKING:
    from ..contexts import ProtocolContext


def run(protocol_bytes: bytes, context: 'ProtocolContext'):
    source = importlib.util.decode_source(protocol_bytes)
    exec(source)


class AddInstrumentCtors(type):

    @staticmethod
    def _build_initializer(model, proper_name):
        """ Build an initializer function for a given pipette.

        This is a separate function so that the `proper_name` is correctly
        caught in the closure that it returns.
        """

        def initializer(
                self,
                mount: str,
                trash_container: Labware = None,
                tip_racks: List[Labware] = None,
                aspirate_flow_rate: float = None,
                dispense_flow_rate: float = None,
                min_volume: float = None,
                max_volume: float = None) -> Pipette:
            return self._load_instr(model,
                                    mount)

        initializer.__name__ = proper_name
        initializer.__qualname__ = '.'.join([AddInstrumentCtors.__qualname__,
                                             proper_name])
        initializer.__doc__ = \
            """Build a {} in a backwards-compatible way.

            :param mount: The mount to load the instrument. One of
                          `'left'` or `'right'`.
            :param trash_container: If specified, a :py:class:`.Labware` to
                                    use for trash.
            :param tip_racks: If specified, a list of :py:class:`.Labware`
                              containing tips.
            :param aspirate_flow_rate: If specified, a flow rate (in uL/s)
                                       to use when aspirating. By default,
                                       the value from the pipette's
                                       configuration.
            :param dispense_flow_rate: If specified, a flow rate (in uL/s)
                                       to use when dispensing. By default,
                                       the value from the pipette's
                                       configuration.
            :param min_volume: The minimum volume that can be aspirated at
                               once. By default, the pipette's minimum
                               volume.
            :param max_volume: The maximum volume that can be aspirated at
                               once. By default, the pipette's maximum
                               volume.

            :returns: An :py:class:`.InstrumentContext`, which represents
                      the newly-loaded pipette.
            """.format(' '.join(proper_name.split('_')))
        return initializer

    def __new__(cls, name, bases, namespace, **kwds):
        """ Add the pipette initializer functions to the class. """
        res = type.__new__(cls, name, bases, namespace)
        for config in config_models:
            # Split the long name with the version
            comps = config.split('_')
            # To get the name without the version
            generic_model = '_'.join(comps[:2])
            number = comps[0].upper()
            ptype_0 = comps[1][0].upper()
            # And a nicely formatted version to name the function
            ptype = ptype_0 + comps[1][1:]
            proper_name = number + '_' + ptype
            if hasattr(res, proper_name):
                # Only build one initializer function for each versionless
                # model (i.e. don’t make a P10_Single for both p10_single_v1
                # and p10_single_v1.3)
                continue

            initializer = cls._build_initializer(generic_model, proper_name)
            setattr(res, proper_name, initializer)

        return res


class BCInstruments(metaclass=AddInstrumentCtors):
    """ A backwards-compatibility shim for the `New Protocol API`_.

    This class is provides a replacement for the `opentrons.instrument`
    global instance. Like that global instance, it shims object creation
    functions for ease of use. It should not be instantiated by user code, and
    use of its methods should be replaced with use of the corresponding methods
    of :py:class:`.ProtocolContext`. For information on how to replace calls to
    methods of this class, see the method documentation.
    """

    def __init__(
            self,
            robot: Robot) -> None:
        self._robot_wrapper = robot

    def _load_instr(self,
                    name: str,
                    mount: str) -> Pipette:
        """ Build an instrument in a backwards-compatible way.
        """
        instr_ctx = self._robot_wrapper._ctx.load_instrument(
            name, Mount[mount.upper()])
        instr = Pipette(instr_ctx)
        self._robot_wrapper._add_instrument(mount, instr)
        return instr


class BCLabware:
    """ A backwards-compatibility shim for the `New Protocol API`_.

    This class provides a replacement for the `opentrons.labware` and
    `opentrons.containers` global instances. Like those global instances,
    this class shims labware load functions for ease of use. This class should
    not be instantiated by user code, and use of its methods should be
    replaced with use of the corresponding functions of
    :py:class:`.ProtocolContext`. For information on how to replace calls to
    methods of this class, see the method documentation.
    """

    def __init__(self, ctx: 'ProtocolContext') -> None:
        self._ctx = ctx

    LW_NO_EQUIVALENT = {'24-vial-rack', '48-vial-plate', '5ml-3x4',
                        '96-well-plate-20mm', 'MALDI-plate',
                        'T25-flask', 'T75-flask', 'e-gelgol',
                        'hampton-1ml-deep-block', 'point',
                        'rigaku-compact-crystallization-plate',
                        'small_vial_rack_16x45', 'temperature-plate',
                        'tiprack-10ul-H', 'trough-12row-short',
                        'trough-1row-25ml', 'trough-1row-test',
                        'tube-rack-2ml-9x9', 'tube-rack-5ml-96',
                        'tube-rack-80well', 'wheaton_vial_rack'}
    """ Labwares that are no longer supported in this version """

    LW_TRANSLATION = {
        '6-well-plate': 'corning_6_wellplate_16.8ml_flat',
        '12-well-plate': 'corning_12_wellplate_6.9_ml',
        '24-well-plate': 'corning_24_wellplate_3.4_ml',
        '48-well-plate': 'corning_48_wellplate_1.6ml_flat',
        '384-plate': 'corning_384_wellplate_112ul_flat',
        '96-deep-well': 'usascientific_96_wellplate_2.4ml_deep',
        '96-flat': 'corning_96_wellplate_360ul_flat',
        '96-PCR-flat': 'biorad_96_wellplate_200ul_pcr',
        '96-PCR-tall': 'biorad_96_wellplate_200ul_pcr',
        'biorad-hardshell-96-PCR': 'biorad_96_wellplate_200ul_pcr',
        'alum-block-pcr-strips': 'opentrons_40_aluminumblock_eppendorf_24x2ml_safelock_snapcap_generic_16x0.2ml_pcr_strip',  # noqa(E501)
        'opentrons-aluminum-block-2ml-eppendorf': 'opentrons_24_aluminumblock_generic_2ml_screwcap',       # noqa(E501)
        'opentrons-aluminum-block-2ml-screwcap': 'opentrons_24_aluminumblock_generic_2ml_screwcap',        # noqa(E501)
        'opentrons-aluminum-block-96-PCR-plate': 'opentrons_96_aluminum_biorad_plate_200_ul',  # noqa(E501)
        'opentrons-aluminum-block-PCR-strips-200ul': 'opentrons_96_aluminumblock_generic_pcr_strip_200ul',  # noqa(E501)
        'opentrons-tiprack-300ul': 'opentrons_96_tiprack_300ul',
        'opentrons-tuberack-1.5ml-eppendorf': 'opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap',        # noqa(E501)
        'opentrons-tuberack-15_50ml': 'opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical',        # noqa(E501)
        'opentrons-tuberack-15ml': 'opentrons_15_tuberack_15_ml_falcon',
        'opentrons-tuberack-2ml-eppendorf': 'opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap',            # noqa(E501)
        'opentrons-tuberack-2ml-screwcap': 'opentrons_24_tuberack_generic_2ml_screwcap',              # noqa(E501)
        'opentrons-tuberack-50ml': 'opentrons_6_tuberack_falcon_50ml_conical',
        'PCR-strip-tall': 'opentrons_96_aluminumblock_generic_pcr_strip_200ul',
        'tiprack-10ul': 'opentrons_96_tiprack_10ul',
        'tiprack-200ul': 'tipone_96_tiprack_200ul',
        'tiprack-1000ul': 'opentrons_96_tiprack_1000ul',
        'trash-box': 'agilent_1_reservoir_290ml',
        'trough-12row': 'usascientific_12_reservoir_22ml',
        'tube-rack-.75ml': 'opentrons_24_tuberack_generic_0.75ml_snapcap_acrylic',  # noqa(E501)
        'tube-rack-2ml': 'opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap_acrylic',  # noqa(E501)
        'tube-rack-15_50ml': 'opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical_acrylic',  # noqa(E501)
    }

    """ A table mapping old labware names to new labware names"""

    def load(self, container_name, slot, label=None, share=False):
        """ Load a piece of labware by specifying its name and position.

        This method calls :py:meth:`.ProtocolContext.load_labware`;
        see that documentation for more information on arguments and return
        values. Calls to this function should be replaced with calls to
        :py:meth:`.Protocolcontext.load_labware`.

        In addition, this function contains translations between old
        labware names and new labware names.
        """
        if share:
            raise NotImplementedError("Sharing not supported")

        try:
            name = self.LW_TRANSLATION[container_name]
        except KeyError:
            if container_name in self.LW_NO_EQUIVALENT:
                raise NotImplementedError("Labware {} is not supported"
                                          .format(container_name))
            elif container_name in ('magdeck', 'tempdeck'):
                # TODO(mc, 2019-06-28): when modules BC implemented, change
                # error type and message to point user to modules.load
                raise NotImplementedError("Module load not yet implemented")
            else:
                name = container_name

        return self._ctx.load_labware(name, slot, label)

    def create(self, *args, **kwargs):
        raise NotImplementedError

    def list(self, *args, **kwargs):
        raise NotImplementedError


class BCModules:
    def __init__(self, ctx: 'ProtocolContext') -> None:
        self._ctx = ctx

    def load(self, *args, **wargs):
        pass


def build_globals(context: 'ProtocolContext'):
    rob = Robot(context)
    instr = BCInstruments(rob)
    lw = BCLabware(context)
    mod = BCModules(context)
    rob._set_globals(instr, lw, mod)

    return {'robot': rob, 'instruments': instr, 'labware': lw, 'modules': mod}
