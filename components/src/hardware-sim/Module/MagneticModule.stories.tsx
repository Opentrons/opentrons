import * as React from 'react'
import { RobotWorkSpace } from '../Deck/RobotWorkSpace'
import { getDeckDefinitions } from '../Deck/getDeckDefinitions'

import { Module } from './'

import type { RobotWorkSpaceRenderProps } from '../Deck'
import type { Story, Meta } from '@storybook/react'
import { MAGNETIC_MODULE_V2, getModuleDef2 } from '@opentrons/shared-data'

const slots = ['1', '3', '4', '6', '7', '9', '10']

export default {
  title: 'Library/Molecules/Simulation/Modules/Magnetic Module'
} as Meta

const Template: Story<{slot: string}> = args => {
  return (
    <RobotWorkSpace deckDef={getDeckDefinitions()['ot2_standard']}>
      {({ deckSlotsById }: RobotWorkSpaceRenderProps) => {
        const slot = deckSlotsById[args.slot]
        return (
          <Module
            x={slot.position[0]}
            y={slot.position[1]}
            def={getModuleDef2(MAGNETIC_MODULE_V2)}
            orientation={
              ['3','6','9'].includes(args.slot)
                ? 'right'
                : 'left'
            } />
        )
      }}
    </RobotWorkSpace>
  )
}
export const MagneticModule = Template.bind({})
MagneticModule.argTypes = {
  slot: {
    control: {
      type: 'select',
      options: slots
    },
    defaultValue: slots[slots.length - 1],
  },
}
