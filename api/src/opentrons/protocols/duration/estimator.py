import logging
from typing import Optional, List

import numpy as np
import functools

from dataclasses import dataclass

from opentrons.commands import types
from opentrons.protocols.api_support.labware_like import LabwareLike
from opentrons.types import Location

START_MODULE_TEMPERATURE = 25

logger = logging.getLogger(__name__)


@dataclass
class TimerEntry:
    command: types.CommandMessage
    duration: float


class DurationEstimator:
    """
    Broker listener that calculates the duration of protocol steps.
    """
    def __init__(self):
        # Which slot the last command was in.
        self._last_deckslot = None
        self._last_temperature_module_temperature = START_MODULE_TEMPERATURE
        self._last_thermocyler_module_temperature = START_MODULE_TEMPERATURE
        # Per step time estimate.
        self._increments: List[TimerEntry] = []
        # New
        self._labware_locations = []

    def get_total_duration(self) -> float:
        """Return the total duration"""
        return functools.reduce(
            lambda acc, val: acc + val.duration,
            self._increments,
            0.0
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
        if message['$'] != 'after':
            return

        # Extract the message name
        message_name = message['name']
        # The actual payload of the command that varies by message.
        payload = message['payload']
        duration = 0.0

        location = payload.get('location')

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
            duration = self.on_thermocyler_block_temp(payload=payload)
        elif message_name == types.THERMOCYCLER_EXECUTE_PROFILE:
            duration = self.on_execute_profile(payload=payload)
        elif message_name == types.THERMOCYCLER_SET_LID_TEMP:
            duration = self.on_thermocyler_set_lid_temp(payload=payload)
        elif message_name == types.THERMOCYCLER_CLOSE:
            duration = self.on_thermocyler_lid_close(payload=payload)
        elif message_name == types.THERMOCYCLER_DEACTIVATE_LID:
            duration = self.on_thermocyler_deactivate_lid(payload=payload)
        elif message_name == types.THERMOCYCLER_OPEN:
            duration = self.on_thermocyler_lid_open(payload=payload)

        self._last_deckslot = self.get_slot(location)
        self._increments.append(
            TimerEntry(
                command=message,
                duration=duration,
            )
        )

    def on_pick_up_tip(
            self,
            payload) -> float:
        """Handle a pick up tip event"""
        # The instrument is opentrons/api/src/opentrons/protocol_api/instrument_context.py
        instrument = payload['instrument']

        # The location is either a Well or a Labware: see opentrons/api/src/opentrons/protocol_api/labware.py
        location = payload['location']
        prev_slot = self._last_deckslot
        curr_slot = self.get_slot(location)

        gantry_speed = instrument.default_speed

        deck_travel_time = self.calc_deck_movement_time(curr_slot, prev_slot, gantry_speed)

        duration = deck_travel_time + 4

        logger.info(f"{instrument.name} picked up tip from slot {curr_slot} the duration is {duration}")
        return duration

    def on_drop_tip(
            self,
            payload) -> float:
        # How long this took
        duration = 0
        # The instrument is opentrons/api/src/opentrons/protocol_api/instrument_context.py
        instrument = payload['instrument']
        # The location is either a Well or a Labware: see opentrons/api/src/opentrons/protocol_api/labware.py
        location = payload['location']
        # Use the utility to get the  slot
        ## We are going to once again use our "deck movement" set up. This should be in pickup, drop tip, aspirate, dispense
        location = payload['location']
        curr_slot = self.get_slot(location)
        ## this one disagrees with me.
        prev_slot = self._last_deckslot
        gantry_speed = instrument.default_speed
        deck_travel_time = self.calc_deck_movement_time(curr_slot, prev_slot, gantry_speed)
        ## Should we be checking for drop tip home_after = False?
        ## we need to add default 10 second drop tip time
        duration = deck_travel_time + 10
        # let's only log the message after the pick up tip is done.

        logger.info(f"{instrument.name}, drop tip duration is {duration}")
        return duration

    def on_aspirate(
            self,
            payload) -> float:
        # How long this took
        duration = 0
        ## General aspiration code
        instrument = payload['instrument']
        volume = payload['volume']
        rate = payload['rate'] * instrument.flow_rate.aspirate

        aspiration_time = volume / rate

        # okay lets add that in to duration.

        # now lets handle the aspiration z-axis code.
        location = payload['location']
        slot = self.get_slot(location)
        slot_module = 1 if location.labware.parent.parent.is_module else 0
        gantry_speed = instrument.default_speed
        z_total_time = self.z_time(slot_module, gantry_speed)

        # We are going to once again use our "deck movement" set up. This
        # should be in pickup, drop tip, aspirate, dispense
        location = payload['location']
        prev_slot = self._last_deckslot
        curr_slot = self.get_slot(location)

        gantry_speed = instrument.default_speed
        deck_travel_time = self.calc_deck_movement_time(curr_slot, prev_slot, gantry_speed)
        duration = deck_travel_time + z_total_time + aspiration_time
        logger.info(f"{instrument.name} aspirate from {slot}, the duration is {duration}")
        return duration

    def on_dispense(
            self,
            payload) -> float:
        ## General code for aspiration/dispense
        duration = 0
        instrument = payload['instrument']
        volume = payload['volume']
        rate = payload['rate'] * instrument.flow_rate.dispense
        dispense_time = volume / rate

        # define variables

        location = payload['location']
        slot = self.get_slot(location)
        slot_module = 1 if location.labware.parent.parent.is_module else 0
        gantry_speed = instrument.default_speed

        z_total_time = self.z_time(slot_module, gantry_speed)
        # We are going to once again use our "deck movement" set up.
        # This should be in pickup, drop tip, aspirate, dispense
        location = payload['location']
        prev_slot = self._last_deckslot
        curr_slot = self.get_slot(location)

        gantry_speed = instrument.default_speed
        deck_travel_time = self.calc_deck_movement_time(curr_slot, prev_slot, gantry_speed)

        duration = deck_travel_time + z_total_time + dispense_time

        logger.info(f"{instrument.name} dispensed from {slot}, the duration is {duration}")
        return duration

    # self.on_blow_out(payload=payload)

    def on_blow_out(
            self,
            payload) -> float:
        location = payload['location']
        curr_slot = self.get_slot(location)
        duration = 0.5
        # Note will need to multiply minutes by 60
        logger.info(f"blowing_out_for {duration} seconds, in slot {curr_slot}")

        return duration

    # self.on_touch_tip(payload=payload)
    def on_touch_tip(
            self,
            payload) -> float:
        """
        location = payload['location']
        duration = 0
        prev_slot = self._last_deckslot
        curr_slot = self.get_slot(location)
        duration = 0.5
        """
        ## base assumption
        duration = 0.5
        ## Note will need to multiply minutes by 60
        logger.info(f"touch_tip for {duration} seconds")

        return duration

    def on_delay(
            self,
            payload) -> float:
        ## Specialist Code: This is code that doesn't fit pickup, drop_tip, aspirate, and dispense
        # Explanation: we are gathering seconds and minutes here
        duration = 0
        seconds_delay = payload['seconds']
        minutes_delay = payload['minutes']
        duration = seconds_delay + minutes_delay * 60
        ## Note will need to multiply minutes by 60
        logger.info(f"delay for {seconds_delay} seconds and {minutes_delay} minutes")

        return duration

    def on_thermocyler_block_temp(
            self,
            payload) -> float:
        # How long this took
        duration = 0

        temperature = payload['temperature']
        hold_time = payload['hold_time']
        temp0 = self._last_thermocyler_module_temperature
        temp1 = temperature
        temperature_changing_time = self.thermocyler_handler(temp0, temp1)
        if hold_time is None:
            hold_time = 0
        else:
            hold_time = float(hold_time)

        duration = temperature_changing_time + hold_time
        ## Note will need to multiply minutes by 60
        logger.info(f"hold for {hold_time} seconds and set temp for {temperature} C total duration {duration}")

        return duration

    def on_execute_profile(
            self,
            payload) -> float:
        # How long this took
        duration = 0

        ## This is a bit copy and paste needs to be beautified

        profile_total_steps = payload['steps']
        thermocyler_temperatures = [self._last_thermocyler_module_temperature]
        thermocyler_hold_times = []
        cycle_count = float(payload['text'].split(' ')[2])

        # We are going to need to treat this theromcyler part a bit differently for a bit and just send out total times
        for step in profile_total_steps:
            thermocyler_temperatures.append(float(step['temperature']))
            thermocyler_hold_times.append(float(step['hold_time_seconds']))
        # Initializing variable
        total_hold_time = 0
        total_hold_time = float(cycle_count) * float(sum(thermocyler_hold_times))
        # This takes care of the cumulative hold time
        # WE DON't Have a way to deal with this currently in the way we have things set up.
        cycling = 0
        cycling_counter = []
        thermocyler_temperatures.pop(0)
        for thermocyler_counter in range(0, len(thermocyler_temperatures)):
            # cycling_counter.append(thermocyler_handler(float(temp_update_thermocyler[thermocyler_counter-1]), float(temp_update_thermocyler[thermocyler_counter])))
            cycling_counter.append(self.thermocyler_handler(float(thermocyler_temperatures[thermocyler_counter - 1]),
                                                  float(thermocyler_temperatures[thermocyler_counter])))

        # Sum hold time and cycling temp time
        duration = sum(cycling_counter) + total_hold_time
        self._last_thermocyler_module_temperature = float(thermocyler_temperatures[-1])

        cycling_counter = []
        # Note will need to multiply minutes by 60
        logger.info(f"\ temperatures {sum(cycling_counter)}, hold_times {total_hold_time} , cycles are {cycle_count}, {duration} boop")
        return duration

    def on_thermocyler_set_lid_temp(self,
                                    payload) -> float:
        # How long this took
        duration = 60
        thermoaction = 'set lid temperature'
        logger.info(f"\ thermocation =  {thermoaction}")
        return duration

    def on_thermocyler_lid_close(self,
                                 payload) -> float:
        # How long this took
        duration = 24
        thermoaction = 'closing'
        logger.info(f"\ thermocation =  {thermoaction}")

        return duration

    def on_thermocyler_lid_open(self,
                                payload) -> float:
        # How long this took
        duration = 24
        thermoaction = 'opening'
        logger.info(f"\ thermocation =  {thermoaction}")

        return duration

    def on_thermocyler_deactivate_lid(self,
                                      payload) -> float:
        # How long this took
        duration = 23
        thermoaction = 'Deactivating'
        logger.info(f"\ thermocation =  {thermoaction}")

        return duration

    def on_tempdeck_set_temp(self,
                             payload) -> float:
        duration = 0.0
        temperature_tempdeck = payload['celsius']
        temp0 = self._last_temperature_module_temperature
        temp1 = float(temperature_tempdeck)
        duration = self.temperature_module(temp0, temp1)
        self._last_temperature_module_temperature = temp0
        logger.info(f"tempdeck {duration} ")
        return duration

    def thermocyler_handler(self, temp0, temp1):
        total = []
        if temp1 - temp0 > 0:
            # heating up!
            if temp1 > 70:
                # the temp1 part that's over 70 is
                total.append(abs(temp1 - 70) / (2))
                # the temp1 part that's under 70 is:
                total.append(abs(70 - temp0) / 4)
            else:
                total.append(abs(temp1 - temp0) / 4)
        ## This is where the error is. if it's 10 and 94 this would not
        ## @Matt please look into this
        elif temp1 - temp0 < 0:
            if temp1 >= 70:
                total.append(abs(temp1 - temp0) / 2)

            else:
                if temp1 >= 23:
                    total.append(abs(temp1 - temp0) / 1)


                else:
                    # 70 to 23 2 C/s
                    total.append(abs(temp0 - 23) / 0.5)
                    # 23 to temp1 0.1 C/s
                    total.append(abs(temp1 - 23) / 0.1)

        return sum(total)

    def temperature_module(self, temp0, temp1: float) -> float:
        timing_gather = []
        if temp1 == temp0:
            timing_gather.append(0)
        if temp1 > 37:
            timing_gather.append(sum(self.rate_high(temp0, temp1)))
        if temp1 >= 25 and temp1 <= 37:
            timing_gather.append(sum(self.rate_mid(temp0, temp1)))
        if temp1 < 25:
            timing_gather.append(sum(self.rate_low(temp0, temp1)))
        return sum(timing_gather)

    def on_tempdeck_deactivate(self,
                               payload) -> float:
        duration = 0.0
        logger.info(f"tempdeck deactivating")
        return duration

    def on_tempdeck_await_temp(self,
                               payload) -> float:
        duration = 0.0
        logger.info(f"tempdeck awaiting temperature")
        return duration

    @staticmethod
    def get_slot(location) -> Optional[str]:
        """A utility function to extract the slot number from the location."""
        if isinstance(location, Location):
            return location.labware.first_parent()
        else:
            return LabwareLike(location).first_parent()

    @staticmethod
    def calc_deck_movement_time(current_slot, previous_slot, gantry_speed):
        y_dist = 88.9
        x_dist = 133.35

        ## why is
        start_point_pip = (2 * x_dist, 3 * y_dist)

        deck_movement_time = 0

        deck_centers = {'1': (0, 0), '2': (x_dist, 0),
                        '3': (2 * x_dist, 0), '4': (0, y_dist),
                        '5': (x_dist, y_dist), '6': (2 * x_dist, y_dist),
                        '7': (0, 2 * y_dist), '8': (x_dist, 2 * y_dist),
                        '9': (2 * x_dist, 2 * y_dist), '10': (0, 3 * y_dist),
                        '11': (x_dist, 3 * y_dist), '12': (2 * x_dist, 3 * y_dist)}

        current_deck_center = deck_centers.get(current_slot)

        if previous_slot is None:
            init_x_diff = abs((current_deck_center[0]) - (start_point_pip[0]))
            init_y_diff = abs((current_deck_center[1]) - (start_point_pip[1]))
            init_deck_d = np.sqrt((init_x_diff ** 2) + (init_y_diff ** 2))
            deck_movement_time = init_deck_d / gantry_speed
            return deck_movement_time
        else:
            previous_deck_center = deck_centers.get(previous_slot)
            x_difference = abs(current_deck_center[0] - previous_deck_center[0])
            y_difference = abs(current_deck_center[1] - previous_deck_center[1])

            if x_difference and y_difference == 0:
                deck_movement_time = 0.5
            else:
                deck_distance = np.sqrt((x_difference ** 2) + (y_difference ** 2))
                deck_movement_time = deck_distance / gantry_speed
            return deck_movement_time

    @staticmethod
    def z_time(piece, gantry_speed):
        z_default_labware_height = 177.8
        z_default_module_height = 95.25  # 177.8 - 82.55 Where did we get 177.8 from?
        ## Would it be better to just use https://docs.opentrons.com/v2/new_protocol_api.html#opentrons.protocol_api.labware.Well.top
        # labware.top() ?

        if piece == 0:
            z_time = z_default_module_height / gantry_speed
        else:
            z_time = z_default_labware_height / gantry_speed

        return z_time

    # Static
    def rate_high(self, temp0, temp1):
        rate_zero_to_amb = 0.0875
        rate_ambient_to_37 = 0.2
        rate_37_to_95 = 0.3611111111
        low = 25
        val = []
        if temp0 >= 37:
            val.append(abs(temp1 - temp0) / rate_37_to_95)
        if 25 < temp0 <= 37:
            val.append(abs(temp0 - 37) / (rate_ambient_to_37))
            val.append(abs(temp1 - 37) / (rate_37_to_95))
        if temp0 <= 25:
            # the temp1 part that's under 25 is:
            val.append(abs(25 - temp0) / rate_zero_to_amb)
            val.append(abs(25 - temp1) / rate_37_to_95)

        return val

    # Static
    def rate_mid(self, temp0, temp1):
        rate_zero_to_amb = 0.0875
        rate_37_to_95 = 0.3611111111
        val = []
        rate_ambient_to_37 = (37 - 25) / 60
        if temp0 >= 25 and temp0 <= 37:
            val.append(abs(temp1 - temp0) / rate_ambient_to_37)

        if temp0 < 25:
            # the temp1 part that's over 25 is
            val.append(abs(temp1 - 25) / rate_ambient_to_37)
            # the temp0 part that's under 25 is:
            val.append(abs(25 - temp0) / rate_zero_to_amb)
        if temp0 > 37:
            val.append(abs(temp0 - 37) / rate_37_to_95)
            # the temp1 part that's under 25 is:
            val.append(abs(37 - temp1) / rate_zero_to_amb)
        return val

    # Static
    def rate_low(self, temp0, temp1):
        rate_zero_to_amb = 0.0875
        rate_ambient_to_37 = 0.2
        rate_37_to_95 = 0.3611111111
        val = []
        if temp0 <= 25:
            val.append(abs(temp1 - temp0) / rate_zero_to_amb)
        if temp0 > 25 and temp0 <= 37:
            # the temp0 part that's over 25 is
            val.append(abs(temp0 - 25) / (rate_ambient_to_37))
            # the temp1 part that's under 25 is:
            val.append(abs(25 - temp1) / rate_zero_to_amb)
        if temp0 > 37:
            val.append(abs(temp0 - 37) / (rate_ambient_to_37))
            # the temp1 part that's under 25 is:
            val.append(abs(37 - temp1) / rate_zero_to_amb)
        return val
