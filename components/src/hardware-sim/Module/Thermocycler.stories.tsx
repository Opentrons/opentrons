import * as React from 'react'
import { RobotWorkSpace } from '../Deck/RobotWorkSpace'
import { getDeckDefinitions } from '../Deck/getDeckDefinitions'

import { Module } from './'

import type { ThermocyclerVizProps } from './Thermocycler'
import type { RobotWorkSpaceRenderProps } from '../Deck/RobotWorkSpace'
import type { Story, Meta } from '@storybook/react'
import { THERMOCYCLER_MODULE_V1, getModuleDef2 } from '@opentrons/shared-data'

const lidMotorStates = ['open', 'closed', 'unknown']

export default {
  title: 'Library/Molecules/Simulation/Modules/Thermocycler'
} as Meta

const Template: Story<ThermocyclerVizProps> = args => {
  return (
    <RobotWorkSpace deckDef={getDeckDefinitions()['ot2_standard']}>
      {({ deckSlotsById }: RobotWorkSpaceRenderProps) => {
        const slot = deckSlotsById['7']
        const [x, y] = slot.position
        return (
          <Module x={x} y={y} def={getModuleDef2(THERMOCYCLER_MODULE_V1)} innerProps={{lidMotorState: args.lidMotorState}} />
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
