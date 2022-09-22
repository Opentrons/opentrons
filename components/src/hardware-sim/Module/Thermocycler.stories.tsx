import * as React from 'react'
import { RobotWorkSpace } from '../Deck/RobotWorkSpace'
import { getDeckDefinitions } from '../Deck/getDeckDefinitions'
import {
  THERMOCYCLER_MODULE_V1,
  getModuleDef2,
  THERMOCYCLER_MODULE_V2,
} from '@opentrons/shared-data'

import { Module } from './'

import type { ThermocyclerVizProps } from './Thermocycler'
import type { RobotWorkSpaceRenderProps } from '../Deck/RobotWorkSpace'
import type { Story, Meta } from '@storybook/react'

const lidMotorStates = ['open', 'closed', 'unknown']

export default {
  title: 'Library/Molecules/Simulation/Modules/Thermocycler',
} as Meta

const ThermocyclerGen1: Story<ThermocyclerVizProps> = args => {
  return (
    <RobotWorkSpace deckDef={getDeckDefinitions().ot2_standard}>
      {({ deckSlotsById }: RobotWorkSpaceRenderProps) => {
        const slot = deckSlotsById['7']
        const [x, y] = slot.position
        return (
          <Module
            x={x}
            y={y}
            def={getModuleDef2(THERMOCYCLER_MODULE_V1)}
            innerProps={{ lidMotorState: args.lidMotorState }}
          />
        )
      }}
    </RobotWorkSpace>
  )
}
export const Thermocycler = ThermocyclerGen1.bind({})
Thermocycler.argTypes = {
  lidMotorState: {
    control: {
      type: 'select',
      options: lidMotorStates,
    },
    defaultValue: lidMotorStates[0],
  },
}

const ThermocyclerGen2: Story<ThermocyclerVizProps> = args => {
  return (
    <RobotWorkSpace deckDef={getDeckDefinitions().ot2_standard}>
      {({ deckSlotsById }: RobotWorkSpaceRenderProps) => {
        const slot = deckSlotsById['7']
        const [x, y] = slot.position
        return (
          <Module
            x={x}
            y={y}
            def={getModuleDef2(THERMOCYCLER_MODULE_V2)}
            innerProps={{ lidMotorState: args.lidMotorState }}
          />
        )
      }}
    </RobotWorkSpace>
  )
}
export const Thermocycler2 = ThermocyclerGen2.bind({})
Thermocycler2.argTypes = {
  lidMotorState: {
    control: {
      type: 'select',
      options: lidMotorStates,
    },
    defaultValue: lidMotorStates[0],
  },
}
