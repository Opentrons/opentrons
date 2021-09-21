import * as React from 'react'
import { RobotWorkSpace } from './RobotWorkSpace'
import { RobotCoordsForeignDiv, Module } from '@opentrons/components'
import { getDeckDefinitions } from './getDeckDefinitions'

import type { Story, Meta } from '@storybook/react'

const allDeckDefs = getDeckDefinitions()

export default {
  title: 'Library/Molecules/Simulation/Deck',
  argTypes: {
    deckDef: {
      options: Object.keys(allDeckDefs),
      control: {
        type: 'select',
      },
      defaultValue: 'ot2_standard',
    },
    deckLayerBlocklist: {
      options: Object.keys(allDeckDefs.ot2_standard.layers),
      control: {
        type: 'check',
      },
      defaultValue: '',
    },
  },
} as Meta

const Template: Story<React.ComponentProps<typeof RobotWorkSpace>> = ({
  deckDef,
  ...args
}) => {
  const deckLoadName: unknown = deckDef
  const resolvedDef: typeof deckDef = allDeckDefs[deckLoadName as string]
  return <RobotWorkSpace deckDef={resolvedDef} {...args} />
}
export const Deck = Template.bind({})
Deck.args = {
  children: ({ deckSlotsById }) => {
    const divSlot = deckSlotsById['9']
    const moduleSlot = deckSlotsById['10']
    const rectSlot = deckSlotsById['11']
    return (
      <>
        <rect
          x={rectSlot.position[0]}
          y={rectSlot.position[1]}
          width={rectSlot.boundingBox.xDimension}
          height={rectSlot.boundingBox.yDimension}
          fill="#0075ff33"
        />
        <RobotCoordsForeignDiv
          x={divSlot.position[0] - 30}
          y={divSlot.position[1]}
          width={divSlot.boundingBox.xDimension}
          height={divSlot.boundingBox.yDimension}
        >
          <input
            style={{
              backgroundColor: 'lightgray',
              margin: '1rem',
              width: '6rem',
            }}
            placeholder="example input"
          />
        </RobotCoordsForeignDiv>
        <g
          transform={`translate(${moduleSlot.position[0]}, ${moduleSlot.position[1]})`}
        >
          <Module slot={moduleSlot} model="temperatureModuleV1" />
        </g>
      </>
    )
  },
}
