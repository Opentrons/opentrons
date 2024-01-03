import * as React from 'react'
import {
  getModuleDef2,
  LabwareDefinition2,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  ModuleModel,
  TEMPERATURE_MODULE_V1,
  TEMPERATURE_MODULE_V2,
  THERMOCYCLER_MODULE_V1,
  THERMOCYCLER_MODULE_V2,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_BLOCK_V1,
} from '@opentrons/shared-data'
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import { LabwareRender } from '../Labware'
import { RobotCoordinateSpace } from '../RobotCoordinateSpace'
import { Module as ModuleComponent } from './'

import type { Story, Meta } from '@storybook/react'

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

export default {
  title: 'Library/Molecules/Simulation/Module',
} as Meta

const Template: Story<{
  model: ModuleModel
  orientation: 'left' | 'right'
  hasLabware: boolean
  innerProps: {}
}> = args => {
  return (
    <RobotCoordinateSpace height="100vh" width="100vw" viewBox="0 -50 200 320">
      <ModuleComponent
        def={getModuleDef2(args.model)}
        x={0}
        y={0}
        innerProps={args.innerProps}
        orientation={args.orientation}
      >
        {args.hasLabware ? (
          <LabwareRender
            definition={fixture_96_plate as LabwareDefinition2}
          />
        ) : null}
      </ModuleComponent>
    </RobotCoordinateSpace>
  )
}
export const Module = Template.bind({})
Module.argTypes = {
  model: {
    control: {
      type: 'select',
      options: moduleModels,
    },
    defaultValue: moduleModels[0],
  },
  orientation: {
    control: {
      type: 'select',
      options: ['left', 'right'],
    },
    defaultValue: 'left',
  },
  hasLabware: {
    control: {
      type: 'boolean',
    },
    defaultValue: false,
  },
  innerProps: {
    control: {
      type: 'object'
    },
    defaultValue: {
      lidMotorState: 'open',
      blockTargetTemp: 90,
      targetTemperature: 4,
      targetTemp: 40
    }
  }
}
