import * as React from 'react'
import {
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  TEMPERATURE_MODULE_V1,
  TEMPERATURE_MODULE_V2,
  THERMOCYCLER_MODULE_V1,
  getModuleDef2
} from '@opentrons/shared-data'
import { RobotWorkSpace } from './RobotWorkSpace'
import { getDeckDefinitions } from './getDeckDefinitions'

import { Module as ModuleComponent, ModuleFromData } from './Module'

import type { RobotWorkSpaceRenderProps } from './types'
import type { Story, Meta } from '@storybook/react'

const moduleModels = [
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  TEMPERATURE_MODULE_V1,
  TEMPERATURE_MODULE_V2,
  THERMOCYCLER_MODULE_V1,
]

const displayModes = ['default', 'present', 'missing', 'info']

export default {
  title: 'Library/Molecules/Simulation/Module',
} as Meta

const Template: Story<React.ComponentProps<typeof ModuleComponent>> = args => {
  return (
    <RobotWorkSpace deckDef={getDeckDefinitions().ot2_standard}>
      {({ deckSlotsById }: RobotWorkSpaceRenderProps) => {
        const slot = deckSlotsById['7']
        return (
          <g transform={`translate(${slot.position[0]}, ${slot.position[1]})`}>
            {/* <ModuleComponent mode={args.mode} model={args.model} slot={slot} /> */}
            <ModuleFromData
              def={getModuleDef2(args.model)}
              stylePropsByLayer={{'darkFill': {fill: '#ccc'}}}
              />
          </g>
        )
      }}
    </RobotWorkSpace>
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
  mode: {
    control: {
      type: 'select',
      options: displayModes,
    },
    defaultValue: displayModes[0],
  },
}
