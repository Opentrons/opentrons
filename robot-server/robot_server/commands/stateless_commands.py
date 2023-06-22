"""Command requests and responses allowed to be used with /commands."""
from typing import Union
from opentrons.protocol_engine import commands

StatelessCommandCreate = Union[
    commands.HomeCreate,
    commands.SetRailLightsCreate,
    commands.SetStatusBarCreate,
    commands.magnetic_module.EngageCreate,
    commands.magnetic_module.DisengageCreate,
    commands.temperature_module.SetTargetTemperatureCreate,
    commands.temperature_module.DeactivateTemperatureCreate,
    commands.thermocycler.SetTargetBlockTemperatureCreate,
    commands.thermocycler.SetTargetLidTemperatureCreate,
    commands.thermocycler.DeactivateBlockCreate,
    commands.thermocycler.DeactivateLidCreate,
    commands.thermocycler.OpenLidCreate,
    commands.thermocycler.CloseLidCreate,
    commands.heater_shaker.SetTargetTemperatureCreate,
    commands.heater_shaker.SetAndWaitForShakeSpeedCreate,
    commands.heater_shaker.DeactivateHeaterCreate,
    commands.heater_shaker.DeactivateShakerCreate,
    commands.heater_shaker.OpenLabwareLatchCreate,
    commands.heater_shaker.CloseLabwareLatchCreate,
]

StatelessCommand = Union[
    commands.Home,
    commands.SetRailLights,
    commands.SetStatusBar,
    commands.magnetic_module.Engage,
    commands.magnetic_module.Disengage,
    commands.temperature_module.SetTargetTemperature,
    commands.temperature_module.DeactivateTemperature,
    commands.thermocycler.SetTargetBlockTemperature,
    commands.thermocycler.SetTargetLidTemperature,
    commands.thermocycler.DeactivateBlock,
    commands.thermocycler.DeactivateLid,
    commands.thermocycler.OpenLid,
    commands.thermocycler.CloseLid,
    commands.heater_shaker.SetTargetTemperature,
    commands.heater_shaker.SetAndWaitForShakeSpeed,
    commands.heater_shaker.DeactivateHeater,
    commands.heater_shaker.DeactivateShaker,
    commands.heater_shaker.OpenLabwareLatch,
    commands.heater_shaker.CloseLabwareLatch,
]
