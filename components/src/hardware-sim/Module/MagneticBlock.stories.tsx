import * as React from 'react'
import { RobotWorkSpace } from '../Deck/RobotWorkSpace'
import { getDeckDefinitions } from '../Deck/getDeckDefinitions'

import { Module } from './'

import type { RobotWorkSpaceRenderProps } from '../Deck'
import type { Story, Meta } from '@storybook/react'
import { MAGNETIC_BLOCK_V1, getModuleDef2 } from '@opentrons/shared-data'

const slots = ['1', '3', '4', '6', '7', '9', '10']

export default {
  title: 'Library/Molecules/Simulation/Modules/Magnetic Block',
} as Meta

const Template: Story<{ slot: string; layerBlocklist: string[] }> = args => {
  return (
    <RobotWorkSpace deckDef={getDeckDefinitions().ot2_standard}>
      {({ deckSlotsById }: RobotWorkSpaceRenderProps) => {
        const slot = deckSlotsById[args.slot]
        return (
          <Module
            x={slot.position[0]}
            y={slot.position[1]}
            def={getModuleDef2(MAGNETIC_BLOCK_V1)}
            orientation={'left'}
            innerProps={{ layerBlocklist: args.layerBlocklist }}
          />
        )
      }}
    </RobotWorkSpace>
  )
}
export const MagneticBlock = Template.bind({})
MagneticBlock.argTypes = {
  slot: {
    control: {
      type: 'select',
      options: slots,
    },
    defaultValue: slots[slots.length - 1],
  },
  layerBlocklist: {
    control: {
      type: 'check',
    },
    defaultValue: '',
    options: getModuleDef2(MAGNETIC_BLOCK_V1)
      .twoDimensionalRendering.children.map(({ attributes }) => attributes.id)
      .filter(id => id != null),
  },
}
