import * as React from 'react'
import { RobotWorkSpace } from '../Deck/RobotWorkSpace'
import { getDeckDefinitions } from '../Deck/getDeckDefinitions'

import { Thermocycler as ThermocyclerComponent } from './Thermocycler'

import type { RobotWorkSpaceRenderProps } from '../Deck/RobotWorkSpace'
import type { Story, Meta } from '@storybook/react'

const lidMotorStates = ['open', 'closed', 'unknown']

export default {
  title: 'Library/Molecules/Simulation/Modules/Thermocycler'
} as Meta

const Template: Story<React.ComponentProps<typeof ThermocyclerComponent>> = args => {
  return (
    <RobotWorkSpace deckDef={getDeckDefinitions()['ot2_standard']}>
      {({ deckSlotsById }: RobotWorkSpaceRenderProps) => {
        const slot = deckSlotsById['7']
        return (
          <g transform={`translate(${slot.position[0]}, ${slot.position[1]})`}>
            <ThermocyclerComponent lidMotorState={args.lidMotorState} />
          </g>
        )
      }}
    </RobotWorkSpace>
  )
}
export const Thermocycler = Template.bind({})
Thermocycler.argTypes = {
  lidMotorState: {
    control: {
      type: 'select',
      options: lidMotorStates
    },
    defaultValue: lidMotorStates[0],
  },
}
