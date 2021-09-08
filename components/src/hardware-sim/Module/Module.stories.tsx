import * as React from 'react'
import { MAGNETIC_MODULE_V1, MAGNETIC_MODULE_V2, ModuleModel, TEMPERATURE_MODULE_V1, TEMPERATURE_MODULE_V2, THERMOCYCLER_MODULE_V1 } from '@opentrons/shared-data'
import { RobotWorkSpace } from '../Deck/RobotWorkSpace'
import { getDeckDefinitions } from '../Deck/getDeckDefinitions'

import { Module as ModuleComponent } from './'

import type { RobotWorkSpaceRenderProps } from '../Deck'
import type { Story, Meta } from '@storybook/react'

const slots = ['1', '3', '4', '6', '7', '9', '10']

const moduleModels: ModuleModel[] = [
  TEMPERATURE_MODULE_V2,
  TEMPERATURE_MODULE_V1,
  THERMOCYCLER_MODULE_V1,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
]

export default {
  title: 'Library/Molecules/Simulation/Modules/Module'
} as Meta

const Template: Story<{slot: string, model: ModuleModel, orientation: 'left' | 'right'}> = args => {
  return (
    <RobotWorkSpace deckDef={getDeckDefinitions().ot2_standard}>
      {({ deckSlotsById }: RobotWorkSpaceRenderProps) => {
        const slot = deckSlotsById[args.slot]
        return (
          <g transform={`translate(${slot.position[0]}, ${slot.position[1]})`}>
            <ModuleComponent
              model={args.model}
              x={slot.position[0]}
              y={slot.position[1]}
              orientation={args.orientation} />
          </g>
        )
      }}
    </RobotWorkSpace>
  )
}
export const Module = Template.bind({})
Module.argTypes = {
  slot: {
    control: {
      type: 'select',
      options: slots
    },
    defaultValue: slots[0],
  },
  model: {
    control: {
      type: 'select',
      options: moduleModels
    },
    defaultValue: moduleModels[0],
  },
  orientation: {
    control: {
      type: 'select',
      options: ['left' , 'right'],
    },
    defaultValue: 'left',
  },
}
