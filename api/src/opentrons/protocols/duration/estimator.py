import logging
from typing import Optional, List
from typing_extensions import Final

import math
import functools

from dataclasses import dataclass

from opentrons.protocols.geometry.deck import Deck
from opentrons.commands import types
from opentrons.protocols.api_support.labware_like import LabwareLike
from opentrons.protocols.duration.errors import DurationEstimatorException
from opentrons.types import Location


# We refer to page 3 of the GEN2 Temperature Module White-Paper
# https://blog.opentrons.com/opentrons-technical-documentation/
# Through the data we notice that there are different
# rates of Celsius/second depending on temperature range.
# These were all tested to be ~95% consistent with the data
TEMP_MOD_RATE_HIGH_AND_ABOVE: Final = 0.3611111111
TEMP_MOD_RATE_LOW_TO_HIGH: Final = 0.2
TEMP_MOD_RATE_ZERO_TO_LOW: Final = 0.0875
TEMP_MOD_LOW_THRESH: Final = 25.0
TEMP_MOD_HIGH_THRESH: Final = 37.0

THERMO_LOW_THRESH: Final = 23.0
THERMO_HIGH_THRESH: Final = 70.0

START_MODULE_TEMPERATURE: Final = 25.0

STARTING_SLOT: Final[str] = "12"


logger = logging.getLogger(__name__)


@dataclass
class TimerEntry:
    command: types.CommandMessage
    duration: float


# TODO (al, 2021-09-09): Write doc strings for each method detailing how the
#  duration is computed.


class DurationEstimator:
    """
    Broker listener that calculates the duration of protocol steps.
    """

    def __init__(self):
        # Which slot the last command was in.
        self._last_deckslot = STARTING_SLOT
        # todo(mm, 2021-09-08): Support protocols with more than one
        # Temperature or Thermocycler Module.
        self._last_temperature_module_temperature = START_MODULE_TEMPERATURE
        self._last_thermocycler_module_temperature = START_MODULE_TEMPERATURE
        # Per step time estimate.
        self._increments: List[TimerEntry] = []
        self._deck = Deck()

    def get_total_duration(self) -> float:
        """Return the total duration"""
        return functools.reduce(
            lambda acc, val: acc + val.duration, self._increments, 0.0
        )

    def on_message(self, message: types.CommandMessage) -> None:
        """
        Message handler for Broker events.

        Args:
            message: A protocol message

        Returns:
            None
        """
        # Whether this message comes before or after the command is being executed..
        if message["$"] != "after":
            # We only want to process the afters.
            return

        # Extract the message name
        message_name = message["name"]
        # The actual payload of the command that varies by message.
        payload = message["payload"]

        location = payload.get("location")

        try:
            duration = self.handle_message(message_name, payload)
        except Exception as e:
            raise DurationEstimatorException(str(e))

        if location:
            slot = self.get_slot(location)
            self._last_deckslot = slot if slot else self._last_deckslot

        self._increments.append(
            TimerEntry(
                command=message,
                duration=duration,
            )
        )

    def handle_message(  # noqa: C901
        self, message_name: str, payload: types.CommandPayload
    ) -> float:
        """
        Handle the message payload

        Args:
            message_name: Name of message
            payload: The command payload

        Returns:
            The duration in seconds
        """
        duration = 0.0
        # TODO (al, 2021-09-09):
        #  - Make this into a map
        #  - Remove "noqa: C901"
        #  - type the payload in the on_X methods.
        if message_name == types.PICK_UP_TIP:
            duration = self.on_pick_up_tip(payload=payload)
        elif message_name == types.DROP_TIP:
            duration = self.on_drop_tip(payload=payload)
        elif message_name == types.ASPIRATE:
            duration = self.on_aspirate(payload=payload)
        elif message_name == types.DISPENSE:
            duration = self.on_dispense(payload=payload)
        elif message_name == types.BLOW_OUT:
            duration = self.on_blow_out(payload=payload)
        elif message_name == types.TOUCH_TIP:
            duration = self.on_touch_tip(payload=payload)
        elif message_name == types.DELAY:
            duration = self.on_delay(payload=payload)
        elif message_name == types.TEMPDECK_SET_TEMP:
            duration = self.on_tempdeck_set_temp(payload=payload)
        elif message_name == types.TEMPDECK_DEACTIVATE:
            duration = self.on_tempdeck_deactivate(payload=payload)
        elif message_name == types.TEMPDECK_AWAIT_TEMP:
            duration = self.on_tempdeck_await_temp(payload=payload)
        elif message_name == types.THERMOCYCLER_SET_BLOCK_TEMP:
            duration = self.on_thermocycler_block_temp(payload=payload)
        elif message_name == types.THERMOCYCLER_EXECUTE_PROFILE:
            duration = self.on_execute_profile(payload=payload)
        elif message_name == types.THERMOCYCLER_SET_LID_TEMP:
            duration = self.on_thermocycler_set_lid_temp(payload=payload)
        elif message_name == types.THERMOCYCLER_CLOSE:
            duration = self.on_thermocycler_lid_close(payload=payload)
        elif message_name == types.THERMOCYCLER_DEACTIVATE_LID:
            duration = self.on_thermocycler_deactivate_lid(payload=payload)
        elif message_name == types.THERMOCYCLER_OPEN:
            duration = self.on_thermocycler_lid_open(payload=payload)
        elif message_name == types.TRANSFER:
            # Already accounted for in other steps
            pass
        elif message_name == types.DISTRIBUTE:
            pass
        elif message_name == types.CONSOLIDATE:
            pass
        elif message_name == types.COMMENT:
            pass
        else:
            logger.warning(
                f"Command type '{message_name}' is not yet supported by the "
                f"duration estimator."
            )
        return duration

    def on_pick_up_tip(self, payload) -> float:
        """Handle a pick up tip event"""
        instrument = payload["instrument"]

        location = payload["location"]
        prev_slot = self._last_deckslot
        curr_slot = self.get_slot(location)

        gantry_speed = instrument.default_speed

        deck_travel_time = self.calc_deck_movement_time(
            self._deck, curr_slot, prev_slot, gantry_speed
        )

        # The time to pick up tip is 4 seconds. Determined by testing on hardware.
        duration = deck_travel_time + 4

        logger.info(
            f"{instrument.name} picked up tip from slot "
            f"{curr_slot} the duration is {duration}"
        )
        return duration

    def on_drop_tip(self, payload) -> float:
        instrument = payload["instrument"]
        # We are going to once again use our "deck movement" set up. This should
        # be in pickup, drop tip, aspirate, dispense
        location = payload["location"]
        curr_slot = self.get_slot(location)
        # this one disagrees with me.
        prev_slot = self._last_deckslot
        gantry_speed = instrument.default_speed
        deck_travel_time = self.calc_deck_movement_time(
            self._deck, curr_slot, prev_slot, gantry_speed
        )
        # TODO (al, 2021-09-08): Should we be checking for drop tip home_after = False?

        # The time to drop up tip is 10 seconds. Determined by testing on hardware.
        duration = deck_travel_time + 10

        # let's only log the message after the pick up tip is done.
        logger.info(f"{instrument.name}, drop tip duration is {duration}")
        return duration

    def on_aspirate(self, payload) -> float:
        # General aspiration code
        instrument = payload["instrument"]
        volume = payload["volume"]
        rate = payload["rate"] * instrument.flow_rate.aspirate

        aspiration_time = volume / rate

        # now lets handle the aspiration z-axis code.
        location = payload["location"]
        slot = self.get_slot(location)

        gantry_speed = instrument.default_speed
        z_total_time = self.z_time(
            location.labware.parent.parent.is_module, gantry_speed
        )

        # We are going to once again use our "deck movement" set up.
        # Might be changed in future PR if our travel
        # calculations adjust
        # This should be in pickup, drop tip, aspirate, dispense
        location = payload["location"]
        prev_slot = self._last_deckslot
        curr_slot = self.get_slot(location)

        gantry_speed = instrument.default_speed
        deck_travel_time = self.calc_deck_movement_time(
            self._deck, curr_slot, prev_slot, gantry_speed
        )
        duration = deck_travel_time + z_total_time + aspiration_time
        logger.info(
            f"{instrument.name} aspirate from {slot}, " f"the duration is {duration}"
        )
        return duration

    def on_dispense(self, payload) -> float:
        # General code for aspiration/dispense
        instrument = payload["instrument"]
        volume = payload["volume"]
        rate = payload["rate"] * instrument.flow_rate.dispense
        dispense_time = volume / rate

        # define variables
        location = payload["location"]
        slot = self.get_slot(location)
        gantry_speed = instrument.default_speed

        z_total_time = self.z_time(
            location.labware.parent.parent.is_module, gantry_speed
        )
        # We are going to once again use our "deck movement" set up.
        # This should be in pickup, drop tip, aspirate, dispense
        location = payload["location"]
        prev_slot = self._last_deckslot
        curr_slot = self.get_slot(location)

        gantry_speed = instrument.default_speed
        deck_travel_time = self.calc_deck_movement_time(
            self._deck, curr_slot, prev_slot, gantry_speed
        )

        duration = deck_travel_time + z_total_time + dispense_time

        logger.info(
            f"{instrument.name} dispensed from {slot}, the duration is {duration}"
        )
        return duration

    def on_blow_out(self, payload) -> float:
        location = payload["location"]
        curr_slot = self.get_slot(location)
        # In theory, we could use instrument.flow_rate.blow_out, but we don't
        # know how much is in the tip left to blow out
        # So we are defaulting to 0.5 seconds
        duration = 0.5
        logger.info(f"blowing_out_for {duration} seconds, in slot {curr_slot}")
        return duration

    def on_touch_tip(self, payload) -> float:
        # base assumption. Touch_tip takes 0.5 seconds This is consistent with a
        # ~7.5mm diameter (default 60mm/s, 4 sides)
        # plate = protocol.load_labware('corning_96_wellplate_360ul_flat', '1')
        # depth = plate['A1'].diameter
        # Then use the speed of the touch tip
        # ( plate = protocol.load_labware('corning_96_wellplate_360ul_flat', '1')
        # depth = plate['A1'].diameter
        duration = 0.5
        logger.info(f"touch_tip for {duration} seconds")
        return duration

    def on_delay(self, payload) -> float:
        # Explanation: we are gathering seconds and minutes here
        seconds_delay = payload["seconds"]
        minutes_delay = payload["minutes"]
        duration = seconds_delay + minutes_delay * 60
        # Note will need to multiply minutes by 60
        logger.info(f"delay for {seconds_delay} seconds and {minutes_delay} minutes")

        return duration

    def on_thermocycler_block_temp(self, payload) -> float:
        temperature = payload["temperature"]
        hold_time = payload["hold_time"]
        temp0 = self._last_thermocycler_module_temperature
        temp1 = temperature
        # we are referring to a thermocycler_handler(temp0, temp1) function.
        # Magic numbers come from testing and have been consistent
        temperature_changing_time = self.thermocycler_handler(temp0, temp1)
        if hold_time is None:
            hold_time = 0
        else:
            hold_time = float(hold_time)

        duration = temperature_changing_time + hold_time
        # Note will need to multiply minutes by 60
        logger.info(
            f"hold for {hold_time} seconds and set temp for {temperature}"
            f" C total duration {duration}"
        )

        return duration

    def on_execute_profile(self, payload) -> float:
        # Overview We need to run each time a temperature change happens
        # through thermocycler_handler and multiply
        # By the cycle count. Then we also (in parallel) do the same with delays

        profile_total_steps = payload["steps"]
        thermocycler_temperatures = [self._last_thermocycler_module_temperature]
        thermocycler_hold_times = []
        cycle_count = float(payload["text"].split(" ")[2])

        # We are going to need to treat this theromcycler part a bit differently
        # for a bit and just send out total times
        for step in profile_total_steps:
            thermocycler_temperatures.append(float(step["temperature"]))
            thermocycler_hold_times.append(float(step["hold_time_seconds"]))
        # Initializing variable
        total_hold_time = float(cycle_count) * float(sum(thermocycler_hold_times))
        # This takes care of the cumulative hold time
        # WE DON't Have a way to deal with this currently in the way we
        # have things set up.
        cycling_counter = []
        thermocycler_temperatures.pop(0)
        for thermocycler_counter in range(0, len(thermocycler_temperatures)):
            cycling_counter.append(
                self.thermocycler_handler(
                    float(thermocycler_temperatures[thermocycler_counter - 1]),
                    float(thermocycler_temperatures[thermocycler_counter]),
                )
            )

        # Sum hold time and cycling temp time
        duration = float(sum(cycling_counter) + total_hold_time)
        self._last_thermocycler_module_temperature = thermocycler_temperatures[-1]

        cycling_counter = []
        # Note will need to multiply minutes by 60
        logger.info(
            f"temperatures {sum(cycling_counter)}, "
            f"hold_times {total_hold_time} , cycles are {cycle_count}, "
            f"{duration}"
        )
        return duration

    def on_thermocycler_set_lid_temp(self, payload) -> float:
        # Hardware said ~1 minute
        duration = 60
        thermoaction = "set lid temperature"
        logger.info(f"thermocation =  {thermoaction}")
        return duration

    def on_thermocycler_lid_close(self, payload) -> float:
        # Hardware said ~24 seconds
        duration = 24
        thermoaction = "closing"
        logger.info(f"thermocation =  {thermoaction}")
        return duration

    def on_thermocycler_lid_open(self, payload) -> float:
        # Hardware said ~24 seconds
        duration = 24
        thermoaction = "opening"
        logger.info(f"thermocation =  {thermoaction}")
        return duration

    def on_thermocycler_deactivate_lid(self, payload) -> float:
        # Hardware said ~23 seconds
        duration = 23
        thermoaction = "Deactivating"
        logger.info(f"thermocation =  {thermoaction}")
        return duration

    def on_tempdeck_set_temp(self, payload) -> float:
        temperature_tempdeck = payload["celsius"]
        temp0 = self._last_temperature_module_temperature
        temp1 = float(temperature_tempdeck)
        duration = self.temperature_module(temp0, temp1)
        self._last_temperature_module_temperature = temp0
        logger.info(f"tempdeck {duration} ")
        return duration

    def thermocycler_handler(self, temp0: float, temp1: float) -> float:
        total = 0.0
        if temp1 - temp0 > 0:
            # heating up!
            if temp1 > THERMO_HIGH_THRESH:
                # the temp1 part that's over 70 is
                total = abs(temp1 - THERMO_HIGH_THRESH) / 2
                # the temp1 part that's under 70 is:
                total += abs(THERMO_HIGH_THRESH - temp0) / 4
            else:
                total = abs(temp1 - temp0) / 4
        # This is where the error is. if it's 10 and 94 this would not
        # @Matt please look into this
        elif temp1 - temp0 < 0:
            if temp1 >= THERMO_HIGH_THRESH:
                total = abs(temp1 - temp0) / 2
            elif temp1 >= THERMO_LOW_THRESH:
                total = abs(temp1 - temp0) / 1
            else:
                # 70 to 23 2 C/s
                total = abs(temp0 - THERMO_LOW_THRESH) / 0.5
                # 23 to temp1 0.1 C/s
                total += abs(temp1 - THERMO_LOW_THRESH) / 0.1

        return total

    def temperature_module(self, temp0: float, temp1: float) -> float:
        duration = 0.0
        if temp1 != temp0:
            if temp1 > TEMP_MOD_HIGH_THRESH:
                duration = self.rate_high(temp0, temp1)
            elif TEMP_MOD_LOW_THRESH <= temp1 <= TEMP_MOD_HIGH_THRESH:
                duration = self.rate_mid(temp0, temp1)
            elif temp1 < TEMP_MOD_LOW_THRESH:
                duration = self.rate_low(temp0, temp1)
        return duration

    def on_tempdeck_deactivate(self, payload) -> float:
        # TODO (al, 2021-09-08: Find an answer for this value.
        duration = 0.0
        logger.info("tempdeck deactivating")
        return duration

    def on_tempdeck_await_temp(self, payload) -> float:
        # The duration is accounted for in set temperature
        duration = 0.0
        logger.info("tempdeck awaiting temperature")
        return duration

    @staticmethod
    def get_slot(location) -> Optional[str]:
        """A utility function to extract the slot number from the location."""
        if isinstance(location, Location):
            return location.labware.first_parent()
        else:
            return LabwareLike(location).first_parent()

    @staticmethod
    def calc_deck_movement_time(
        deck: Deck, current_slot: Optional[str], previous_slot: str, gantry_speed: float
    ) -> float:
        # Quick summary we set coordinates for each deck slot and found ways
        # to move between deck slots.
        # Each deck slot is a key for a coordinate value
        # Moving between coordinate values
        if not current_slot:
            raise DurationEstimatorException(
                f"Current slot '{current_slot}' is not valid."
            )

        previous_deck_center = deck.position_for(previous_slot)
        if not previous_deck_center:
            raise DurationEstimatorException(
                f"Previous slot '{current_slot}' is not valid."
            )
        current_deck_center = deck.position_for(current_slot)

        x_difference = abs(current_deck_center.point.x - previous_deck_center.point.x)
        y_difference = abs(current_deck_center.point.y - previous_deck_center.point.y)

        if x_difference == 0 and y_difference == 0:
            # Inter slot movement defaults to half a second.
            deck_movement_time = 0.5
        else:
            deck_distance = math.sqrt((x_difference**2) + (y_difference**2))
            deck_movement_time = deck_distance / gantry_speed
        return deck_movement_time

    @staticmethod
    def z_time(is_module: bool, gantry_speed: float) -> float:
        # TODO (al, 2021-09-08): Use definitions from protocol context objects.
        z_default_labware_height = 177.8
        z_default_module_height = 95.25
        # 177.8 - 82.55 Where did we get 177.8 from?
        # Would it be better to just use
        # protocol_api.labware.Well.top
        # labware.top() ?

        if is_module:
            z_time = z_default_module_height / gantry_speed
        else:
            z_time = z_default_labware_height / gantry_speed

        return z_time

    @staticmethod
    def rate_high(temp0: float, temp1: float) -> float:
        """
        Calculate temp deck temperature change to a high temperature.

        Args:
            temp0: Current
            temp1: Target

        Returns:
            Duration in seconds.
        """
        val = 0.0
        if temp0 >= TEMP_MOD_HIGH_THRESH:
            val = abs(temp1 - temp0) / TEMP_MOD_RATE_HIGH_AND_ABOVE
        elif TEMP_MOD_LOW_THRESH < temp0 < TEMP_MOD_HIGH_THRESH:
            val = abs(temp0 - TEMP_MOD_HIGH_THRESH) / TEMP_MOD_RATE_LOW_TO_HIGH
            val += abs(temp1 - TEMP_MOD_HIGH_THRESH) / TEMP_MOD_RATE_HIGH_AND_ABOVE
        elif temp0 <= TEMP_MOD_LOW_THRESH:
            # the temp1 part that's under TEMP_MOD_HIGH_THRESH is:
            val = abs(TEMP_MOD_LOW_THRESH - temp0) / TEMP_MOD_RATE_ZERO_TO_LOW
            val += abs(TEMP_MOD_LOW_THRESH - temp1) / TEMP_MOD_RATE_HIGH_AND_ABOVE

        return val

    @staticmethod
    def rate_mid(temp0: float, temp1: float) -> float:
        """
        Calculate temp deck temperature change to a medium temperature.

        Args:
            temp0: Current
            temp1: Target

        Returns:
            Duration in seconds.
        """
        val = 0.0
        if TEMP_MOD_LOW_THRESH <= temp0 <= TEMP_MOD_HIGH_THRESH:
            val = abs(temp1 - temp0) / TEMP_MOD_RATE_LOW_TO_HIGH
        elif temp0 < TEMP_MOD_LOW_THRESH:
            # the temp1 part that's over TEMP_MOD_HIGH_THRESH is
            val = abs(temp1 - TEMP_MOD_LOW_THRESH) / TEMP_MOD_RATE_LOW_TO_HIGH
            # the temp0 part that's under TEMP_MOD_HIGH_THRESH is:
            val += abs(TEMP_MOD_LOW_THRESH - temp0) / TEMP_MOD_RATE_ZERO_TO_LOW
        elif temp0 > TEMP_MOD_HIGH_THRESH:
            val = abs(temp0 - TEMP_MOD_HIGH_THRESH) / TEMP_MOD_RATE_HIGH_AND_ABOVE
            # the temp1 part that's under TEMP_MOD_HIGH_THRESH is:
            val += abs(TEMP_MOD_HIGH_THRESH - temp1) / TEMP_MOD_RATE_ZERO_TO_LOW
        return val

    # How to handle temperatures where one of them is low temp
    @staticmethod
    def rate_low(temp0: float, temp1: float) -> float:
        """
        Calculate temp deck temperature change to a low temperature.

        Args:
            temp0: Current
            temp1: Target

        Returns:
            Duration in seconds.
        """
        val = 0.0
        if temp0 <= TEMP_MOD_LOW_THRESH:
            val = abs(temp1 - temp0) / TEMP_MOD_RATE_ZERO_TO_LOW
        elif TEMP_MOD_LOW_THRESH < temp0 < TEMP_MOD_HIGH_THRESH:
            # the temp0 part that's over TEMP_MOD_HIGH_THRESH is
            val = abs(temp0 - TEMP_MOD_LOW_THRESH) / TEMP_MOD_RATE_LOW_TO_HIGH
            # the temp1 part that's under TEMP_MOD_HIGH_THRESH is:
            val += abs(TEMP_MOD_LOW_THRESH - temp1) / TEMP_MOD_RATE_ZERO_TO_LOW
        elif temp0 >= TEMP_MOD_HIGH_THRESH:
            val = abs(temp0 - TEMP_MOD_HIGH_THRESH) / TEMP_MOD_RATE_LOW_TO_HIGH
            # the temp1 part that's under TEMP_MOD_HIGH_THRESH is:
            val += abs(TEMP_MOD_HIGH_THRESH - temp1) / TEMP_MOD_RATE_ZERO_TO_LOW
        return val
