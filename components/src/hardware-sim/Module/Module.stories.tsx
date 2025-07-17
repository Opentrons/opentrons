import * as React from 'react'

import {
  fixture96Plate,
  getModuleDef,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_BLOCK_V1,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  TEMPERATURE_MODULE_V1,
  TEMPERATURE_MODULE_V2,
  THERMOCYCLER_MODULE_V1,
  THERMOCYCLER_MODULE_V2,
} from '@opentrons/shared-data'

import { LabwareRender } from '../Labware'
import { RobotCoordinateSpace } from '../RobotCoordinateSpace'
import { Module as ModuleComponent } from './'

import type { Meta, Story } from '@storybook/react'
import type { LabwareDefinition, ModuleModel } from '@opentrons/shared-data'

const moduleModels: ModuleModel[] = [
  TEMPERATURE_MODULE_V2,
  TEMPERATURE_MODULE_V1,
  THERMOCYCLER_MODULE_V1,
  THERMOCYCLER_MODULE_V2,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_BLOCK_V1,
]

const moduleModelOptions = {
  'Temperature Module V2': TEMPERATURE_MODULE_V2,
  'Temperature Module V1': TEMPERATURE_MODULE_V1,
  'Thermocycler Module V1': THERMOCYCLER_MODULE_V1,
  'Thermocycler Module V2': THERMOCYCLER_MODULE_V2,
  'Magnetic Module V1': MAGNETIC_MODULE_V1,
  'Magnetic Module V2': MAGNETIC_MODULE_V2,
  'Heater-Shaker Module V1': HEATERSHAKER_MODULE_V1,
  'Magnetic Block V1': MAGNETIC_BLOCK_V1,
}

export default {
  title: 'Library/Molecules/Simulation/Module',
} as Meta

const Template: Story<{
  model: ModuleModel
  orientation: 'left' | 'right'
  hasLabware: boolean
  innerProps: {}
}> = args => {
  // Add null check and default to first module model if undefined
  const moduleModel = args.model || moduleModels[0]

  return (
    <RobotCoordinateSpace height="100vh" width="100vw" viewBox="0 -50 200 320">
      <ModuleComponent
        def={getModuleDef(moduleModel)}
        x={0}
        y={0}
        innerProps={args.innerProps}
        orientation={args.orientation}
        targetSlotId={null}
        targetDeckId={null}
      >
        {args.hasLabware ? (
          <LabwareRender
            definition={fixture96Plate as LabwareDefinition}
            positioningMode="passThrough"
          />
        ) : null}
      </ModuleComponent>
    </RobotCoordinateSpace>
  )
}

export const Module = Template.bind({})
Module.args = {
  model: TEMPERATURE_MODULE_V2,
  orientation: 'left',
  hasLabware: false,
  innerProps: {
    lidMotorState: 'open',
    blockTargetTemp: 90,
    targetTemperature: 4,
    targetTemp: 40,
  },
}

Module.argTypes = {
  model: {
    control: {
      type: 'select',
    },
    options: moduleModelOptions,
  },
  orientation: {
    control: {
      type: 'select',
    },
    options: ['left', 'right'],
  },
  hasLabware: {
    control: {
      type: 'boolean',
    },
  },
  innerProps: {
    control: {
      type: 'object',
    },
  },
}
