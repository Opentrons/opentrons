---
title: "Heater-Shaker Module: Error Codes"
description: "Lists error codes returned by a Heater-Shaker."
---

This table lists Heater-Shaker error codes. These codes are also used by other Opentrons modules. Descriptions are based on literal firmware output, edited for brevity and clarity.

| Error code | Description |
|---|---|
| `ERR002` | The module's internal queue is full. This can happen when the module receives too many commands too quickly. |
| `ERR003` | Indicates an unhandled G-code. This means the G-code is unknown or misspelled. |
| `ERR004` | The module's G-code cache is full. This can happen when the module receives too many G-codes too quickly. |
| `ERR005` | This is a bad message acknowledgement. It's a type of internal error that indicates something sent an acknowledgement for a G-code that was already acknowledged. |
| `ERR201` | Indicates the module's heat sink thermistor is disconnected. This can happen when the thermistor on the heat sink reads off-scale high, which indicates a disconnected or broken wire. |
| `ERR202` | Indicates the module's heat sink thermistor is shorted. This can happen when the thermistor on the heat sink reads off-scale low, which indicates a short circuit. |
| `ERR203` | Indicates a heat sink thermistor overtemp condition. This can happen when the thermistor on the heat sink reaches a temperature over its internal limits. |
| `ERR204` | Indicates the front-right thermistor is disconnected. This can happen when the thermistor reads off-scale high, which indicates a disconnected or broken wire. |
| `ERR205` | Indicates the front-right thermistor is shorted. This can happen when the thermistor reads off-scale low, which indicates a short circuit. |
| `ERR206` | Indicates a front-right thermistor overtemp condition. This can happen when the thermistor reads a temperature over its internal limits. |
| `ERR207` | Indicates the front-left thermistor is disconnected. This can happen when the thermistor reads off-scale high, which indicates a disconnected or broken wire. |
| `ERR208` | Indicates the front-left thermistor is shorted. This can happen when the thermistor reads off-scale low, which indicates a short circuit. |
| `ERR209` | Indicates a front-left thermistor overtemp condition. This can happen when the thermistor reaches a temperature over its internal limits. |
| `ERR210` | Indicates the front-center thermistor is disconnected. This can happen when the thermistor reads off-scale high, which indicates a disconnected or broken wire. |
| `ERR211` | Indicates the front-center thermistor is shorted. This can happen when the thermistor reads off-scale low, which indicates a short circuit. |
| `ERR212` | Indicates a front-center thermistor overtemp condition. This can happen when the thermistor reaches a temperature over its internal limits. |
| `ERR213` | Indicates the back-right thermistor is disconnected. This can happen when the thermistor reads off-scale high, indicating a disconnected or broken wire. |
| `ERR214` | Indicates the back-right thermistor is shorted. This can happen when the thermistor reads off-scale low, indicating a short circuit. |
| `ERR215` | Indicates the back-right thermistor is in an overtemp condition. This can happen when the thermistor reaches a temperature over its internal limits. |
| `ERR216` | Indicates the back-left thermistor is disconnected. This can happen when the thermistor reads off-scale high, indicating a disconnect or broken wire. |
| `ERR217` | Indicates the back-left thermistor is shorted. This can happen when the thermistor reads off-scale low, indicating a short circuit. |
| `ERR218` | Indicates a back-left thermistor is in an overtemp condition. This can happen when the thermistor reads a temperature over internal limits. |
| `ERR219` | Indicates the back-center thermistor is disconnected. This can happen when the thermistor reads off-scale high, indicating a disconnect or broken wire. |
| `ERR220` | Indicates the back-center thermistor is shorted. This can happen when the thermistor reads off-scale low, indicating a short circuit. |
| `ERR221` | Indicates the back-center thermistor is in an overtemp condition. This can happen when the thermistor reads a temperature over internal limits. |
| `ERR222` | Indicates the lid thermistor is disconnected. This can happen when the thermistor reads off-scale high, indicating a disconnected or broken wire. |
| `ERR223` | Indicates the lid thermistor is shorted. This can happen when the thermistor reads off-scale low, indicating a short circuit. |
| `ERR224` | Indicates the lid thermistor is in an overtemp condition. This can happen when the thermistor reads a temperature over internal limits. |
| `ERR301` | Indicates a module's serial number is invalid. |
| `ERR302` | Indicates the hardware abstraction layer (HAL) is busy or timed out. This can happen when the hardware abstraction layer raises an error while writing the EEPROM. |
| `ERR303` | Indicates an EEPROM communication error. This can happen when the on-board EEPROM could not be communicated with. |
| `ERR401` | Indicates the thermal plate is busy. This can happen when the thermal plate is currently executing a command that cannot be interrupted. |
| `ERR402` | Indicates the Peltier drivers could not activate the module's heating/cooling plates. |
| `ERR403` | Indicates the module could not control the heat sink fan. This can happen when the heat sink fan driver indicates a problem. |
| `ERR404` | Indicates the module's lid heater is executing a command that cannot be interrupted. |
| `ERR405` | Indicates the module cannot control its lid heater. |
| `ERR406` | Indicates the PID controller is reporting that the set of numbers defining how the thermal control loop should behave are invalid or outside the device's acceptable limits. |
| `ERR407` | Indicates an invalid target temperature. |
| `ERR408` | Indicates a thermal drift of more than 4 °C. This can happen when the thermistors read values that are different from each other by more than 4 °C. |
| `ERR501` | Indicates the lid motor is busy executing a command that cannot be interrupted. |
| `ERR502` | Indicates a lid motor fault as reported by the lid's motor driver. |
| `ERR503` | Indicates a seal peripheral interface error. This can happen when communication with the seal motor driver fails. |
| `ERR504` | Indicates the seal motor is busy executing a command that cannot be interrupted. |
| `ERR505` | Indicates the seal motor motor driver reports a fault. |
| `ERR506` | Indicates the seal motor driver detected a stall event. |
| `ERR507` | Indicates that the lid is closed but must be open. |
| `ERR508` | Indicates the seal switch should not be engaged. This can happen when the seal switch is in an unexpected state. |
| `ERR509` | Indicates the lid state is not what is expected (e.g., after the lid was closed and the seal was engaged, the lid closed sensor indicates the lid is open). |