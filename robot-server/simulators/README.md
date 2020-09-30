# Simulator Configuration

A json file can be used to initialize a hardware simulator. How to create and use such a file is described in this read me.

## JSON Format

The file is made up of the following keys:values which are all optional.

### Attached instruments

```
{
  "attached_instruments": {
    "right": {
        # Definition of right pipette
        ...
    },
    "left": {
        # Definition of left pipette
        ...
    }
  },
}
```

See [pipette](../../api/src/opentrons/config/pipette_config.py) for available fields

### Attached modules
```
{
  "attached_modules": {
    # A mapping of module type to an optional list of setup 
    # function calls which will be called in order.
    "thermocycler": [
      {
        "function_name": "set_temperature",
        "kwargs": {
          "temperature": 3,
          "hold_time_seconds": 1,
          "hold_time_minutes": 2,
          "ramp_rate": 4,
          "volume": 5
        }
      },
      {
        "function_name": "set_lid_temperature",
        "kwargs": {
          "temperature": 4
        }
      },
      {
        "function_name": "close"
      }
    ],
    "tempdeck": [
      {
        "function_name": "set_temperature",
        "kwargs": {
          "celsius": 3
        }
      }
    ],
    "magdeck": [
      {
        "function_name": "engage",
        "kwargs": {
          "height": 4
        }
      }
    ]
  }
}
```

### Configs

This is the same format as `robot_settings.json` as defined in [robot_configs](../../api/src/opentrons/config/robot_configs.py).

```
{
    configs: {
        "name": ...,
        "version": ....,
        ..... 
    }
}
```

## How to use

Use `OT_ROBOT_SERVER_simulator_configuration_file_path` environment variable to point to a custom simulator configuration file. 