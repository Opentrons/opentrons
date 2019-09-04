# Lid Motor Control


X def open_lid(self):

X def close_lid(self):


# Lid Temperature Control

# Laura NOTE: blocking by default diverges from temp deck api
X def set_lid_temperature(self, temperature: float = 105):
  # blocking by default
  # add an optional param later for non-blocking


# Block Temperature Control

X def set_block_temperature(self,
                          temperature: float,
                          hold_time_minutes: float = None,
                          hold_time_seconds: float = None,
                          ramp_rate: float = None):
  # blocking by default
  # if no hold time, wait until temp
  # if hold time, wait until temp, then wait for hold time
  # add an optional param later for non-blocking

  # thermocycler.set_block_temperature(10, hold_time_seconds:3)
def execute_profile(self,
                    steps: List[modules.types.ThermocyclerStep],
                    repetitions: int):
  # blocking by default
  # add an optional params later for lid control

  cycles = {
    "primary_cycle":[
      {temperature: 10, hold_time_seconds: 30},
      {temperature: 10, hold_time_seconds: 30},
      {temperature: 10, hold_time_seconds: 30},
    ],
    "secondary_cycle": [
      {temperature: 10, hold_time_seconds: 30},
      {temperature: 10, hold_time_seconds: 30},
      {temperature: 10, hold_time_seconds: 30},
    ]
  }

  thermocycler.set_lid_temperature(30) #block until temp reached
  thermocycler.set_block_temperature(30, hold_time_minutes=4) #block until temp reached
  thermocycler.execute_profile(steps=primary_cycle, repetitions=30, lid_temperature=105)
  thermocycler.execute_profile(steps=secondary_cycle, repetitions=30, lid_temperature=105)

  thermocycler.execute_profile(steps=[{temperature: 10, hold_time_seconds: 30},
                                      {temperature: 10, hold_time_seconds: 30}],
                               repetitions=30,
                               lid_temperature=105)
  # hold until lid temp reach
  # loop
  # hold until block temp reach
  # hold until block hold time reached

# surface a warning if opening when hot somehow
# Kinnari votes for: 3 separate
# so does Laura and Alise
def deactivate(self):
  # deactivate both

def deactivate_lid(self):

def deactivate_block(self):

# Alise deactivating convo about whether or not to open it or cool


# Passive
# wait on these

# def wait_for_lid_temp(self):

# def wait_for_temp(self):

# def wait_for_hold(self):
# thermocycerl.wait_for('lid_temp')


# Properties

def lid_position(self):
  # e.g. 'open' or 'closed' or 'in-between'

def lid_temperature_status(self):
  # e.g. 'holding at target', 'cooling', etc.

def block_temperature_status(self):
  # e.g. 'holding at target', 'cooling', etc.


# Laura, make sure this doesn't show up in DOCs
# Context State

def total_cycle_count(self):
def current_cycle_index(self):
def total_step_count(self):
def current_step_index(self):
def hold_time(self):
def ramp_rate(self):


# well block instead of block?

# Driver State

def lid_target_temperature(self):
def block_target_temperature(self):
def lid_temperature(self):
def block_temperature(self):
