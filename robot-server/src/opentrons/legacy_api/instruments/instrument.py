import logging


log = logging.getLogger(__name__)


class Instrument:
    """
    This class represents instrument attached to the :any:`Robot`:
    :Pipette:.

    It gives the instruments ability to CRUD their calibration data,
    and gives access to some common methods across instruments
    """

    def reset(self):
        """
        Placeholder for instruments to reset their state between runs
        """
        pass

    def setup_simulate(self, *args, **kwargs):
        """
        Placeholder for instruments to prepare their state for simulation
        """
        pass

    def teardown_simulate(self, *args, **kwargs):
        """
        Placeholder for instruments to reverse :meth:`setup_simulate`
        """
        pass

    def init_calibrations(self, key, attributes=None):
        """
        Creates empty calibrations data if not already present

        Parameters
        ----------
        key : str
            The unique string to save this instrument's calibation data

        attributes : list
            A list of this instrument's attribute names to be saved

        .. warning::
           This method is deprecated and does nothing
        """
        log.warning("init_calibrations is deprecated and does nothing")

    def update_calibrations(self):
        """
        Saves the instrument's peristed attributes to file

        .. warning::
           This method is deprecated and does nothing
        """
        log.warning("update_calibration is deprecated and does nothing")

    def load_persisted_data(self):
        """
        Loads and sets the instrument's peristed attributes from file

        .. warning::
           This method is deprecated and does nothing
        """
        log.warning("load_persisted_data is deprecated and does nothing")

    def delete_calibration_data(self):
        """
        Set the instrument's properties to their initialized values,
        and saves those initialized values to file.

        .. warning::
           This method is deprecated and does nothing

        """
        log.warning("delete_calibration_data is deprecated and does nothing")
