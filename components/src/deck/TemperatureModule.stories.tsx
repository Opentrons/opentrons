import * as React from 'react'
import { RobotWorkSpace } from './RobotWorkSpace'
import { getDeckDefinitions } from './getDeckDefinitions'

import { TemperatureModule as TemperatureModuleComponent } from './TemperatureModule'

import type { RobotWorkSpaceRenderProps } from './types'
import type { Story, Meta } from '@storybook/react'

const slots = ['1', '3', '4', '6', '7', '9', '10']

export default {
  title: 'Library/Molecules/Simulation/Modules/Temperature Module'
} as Meta

const Template: Story<{slot: string}> = args => {
  return (
    <RobotWorkSpace deckDef={getDeckDefinitions()['ot2_standard']}>
      {({ deckSlotsById }: RobotWorkSpaceRenderProps) => {
        const slot = deckSlotsById[args.slot]
        return (
          <g transform={`translate(${slot.position[0]}, ${slot.position[1]})`}>
            <TemperatureModuleComponent />
          </g>
        )
      }}
    </RobotWorkSpace>
  )
}
export const TemperatureModule = Template.bind({})
TemperatureModule.argTypes = {
  slot: {
    control: {
      type: 'select',
      options: slots
    },
    defaultValue: slots[0],
  },
}
