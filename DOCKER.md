Docker Guide  
=======================  
Included in this repo are the tools to run a containerized Opentrons robot stack in docker.

This includes the `robot-server` connected to the hardware emulation application. The emulation application includes the Smoothie and magnetic, temperature, and thermocycler modules.

## Requirements

- A clone of [this](https://github.com/Opentrons/opentrons) repo.
- An installation of [docker](https://docs.docker.com/get-docker/)
- An installation of [docker-compose](https://docs.docker.com/compose/install/)

## How to use

Start a terminal and change directory to the root of this repo.

1. Build
   Enter `docker-compose build --force-rm` at the terminal.
2. Run
   Enter `docker-compose up` at the terminal. _The build and run stages can be combined `docker-compose up --build`._
3. Start the Opentrons application.
4. Click `MORE` on the bottom left. Then select `NETWORK & SYSTEM`. Click `MANAGE` and add `127.0.0.1` to the `Manually Add Robot Network Address` dialog.
5. The docker container will appear as `dev`. Connect and run just as you would on a robot.

## Configuration

### Pipettes

By default a `p20_multi_v2.0` is on the left mount and `p20_single_v2.0` is on the right. These can be changed by modifying environment variables in the `docker-compose.yml` file.

Under the `emulator` section add an `environment` section with a variable called `OT_EMULATOR_smoothie`. A stringified JSON object with `model` and `id` field for the `left` and `right` mounts is defined by `OT_EMULATOR_smoothie`. All fields are optional.

For example to use a `p300_multi` on the right add:

```
  environment:
    OT_EMULATOR_smoothie: '{"right": {"model": "p300_multi"}}'
```


### Adding more emulators

#### Magdeck

To add a second mag deck emulator make a copy of the existing `magdeck` section and change the key and `serial_number`. 

For example this adds a `magdeck` with the serial number `magdeck2`:
```
 magdeck2:
    build: .
    command: python3 -m opentrons.hardware_control.emulation.scripts.run_module_emulator magdeck emulator
    links:
      - 'emulator'
    depends_on:
      - 'emulator'
    environment:
      OT_EMULATOR_magdeck: '{"serial_number": "magdeck2", "model":"mag_deck_v20", "version":"2.0.0"}'
```

#### Tempdeck

To add a second temp deck emulator make a copy of the existing `tempdeck` section and change the key and `serial_number`. 

For example this adds a `tempdeck` with the serial number `tempdeck2`:
```
 tempdeck2:
    build: .
    command: python3 -m opentrons.hardware_control.emulation.scripts.run_module_emulator tempdeck emulator
    links:
      - 'emulator'
    depends_on:
      - 'emulator'
    environment:
      OT_EMULATOR_tempdeck: '{"serial_number": "tempdeck2", "model":"temp_deck_v20", "version":"v2.0.1", "temperature": {"starting":0.0, "degrees_per_tick": 2.0}}'
```

#### Thermocycler

To add a second thermocycler emulator make a copy of the existing `thermocycler` section and change the key and `serial_number`. 

For example this adds a `thermocycler` with the serial number `thermocycler2`:
```
 thermocycler2:
    build: .
    command: python3 -m opentrons.hardware_control.emulation.scripts.run_module_emulator thermocycler emulator
    links:
      - 'emulator'
    depends_on:
      - 'emulator'
    environment:
      OT_EMULATOR_thermocycler: '{"serial_number": "thermocycler2", "model":"v02", "version":"v1.1.0", "lid_temperature": {"starting":23.0, "degrees_per_tick": 2.0},  "plate_temperature": {"starting":23.0, "degrees_per_tick": 2.0}}'
```


## Known Issues

- Pipettes cannot be changed at run time.
