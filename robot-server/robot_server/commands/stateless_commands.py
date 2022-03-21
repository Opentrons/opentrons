"""Command requests and responses allowed to be used with /commands."""
from typing import Union
from opentrons.protocol_engine import commands

StatelessCommandCreate = Union[
    commands.HomeCreate,
    commands.SetRailLightsCreate,
    commands.magnetic_module.EngageCreate,
    commands.magnetic_module.DisengageCreate,
    # TODO(mc, 2022-03-18): implement these commands
    # commands.temperature_module.SetTargetTemperatureCreate,
    # commands.temperature_module.DeactivateCreate,
    # commands.thermocycler.SetTargetBlockTemperatureCreate,
    # commands.thermocycler.SetTargetLidTemperatureCreate,
    # commands.thermocycler.DeactivateBlockCreate,
    # commands.thermocycler.DeactivateLidCreate,
    # commands.thermocycler.OpenLidCreate,
    # commands.thermocycler.CloseLidCreate,
    commands.heater_shaker.StartSetTargetTemperatureCreate,
    commands.heater_shaker.SetTargetShakeSpeedCreate,
    commands.heater_shaker.DeactivateHeaterCreate,
    commands.heater_shaker.StopShakeCreate,
    commands.heater_shaker.OpenLatchCreate,
    commands.heater_shaker.CloseLatchCreate,
]

StatelessCommand = Union[
    commands.Home,
    commands.SetRailLights,
    commands.magnetic_module.Engage,
    commands.magnetic_module.Disengage,
    # TODO(mc, 2022-03-18): implement these commands
    # commands.temperature_module.SetTargetTemperature,
    # commands.temperature_module.Deactivate,
    # commands.thermocycler.SetTargetBlockTemperature,
    # commands.thermocycler.SetTargetLidTemperature,
    # commands.thermocycler.DeactivateBlock,
    # commands.thermocycler.DeactivateLid,
    # commands.thermocycler.OpenLid,
    # commands.thermocycler.CloseLid,
    commands.heater_shaker.StartSetTargetTemperature,
    commands.heater_shaker.SetTargetShakeSpeed,
    commands.heater_shaker.DeactivateHeater,
    commands.heater_shaker.StopShake,
    commands.heater_shaker.OpenLatch,
    commands.heater_shaker.CloseLatch,
]
