# Lid Motor Control

def open(self):

def close(self):

# Lid Temperature Control

def heat_lid(self):
  # always non-blocking

def stop_lid_heating(self):

# Block Temperature Control

def set_temperature(self,
                    temperature: float,
                    hold_time: float = None,
                    ramp_rate: float = None):
  # non-blocking if no hold_time

def cycle_temperatures(self,
                       steps: List[modules.types.ThermocyclerStep],
                       repetitions: int):

def deactivate(self):


# Passive

def wait_for_lid_temp(self):

def wait_for_temp(self):

def wait_for_hold(self):


# properties

def lid_status(self):
  # e.g. 'holding at target', 'cooling', etc.

def status(self):
  # e.g. 'holding at target', 'cooling', etc.

# Context State

def total_cycle_count(self):
def current_cycle_index(self):
def total_step_count(self):
def current_step_index(self):

# Driver State
def current_lid_target(self):
def lid_target(self):

def temperature(self):
def target(self):
def ramp_rate(self):
def hold_time(self):