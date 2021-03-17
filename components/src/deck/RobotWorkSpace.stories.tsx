import * as React from 'react'
import { RobotWorkSpace } from './RobotWorkSpace'
import { RobotCoordsText, RobotCoordsForeignDiv } from '@opentrons/components'
import { getDeckDefinitions } from './getDeckDefinitions'

import type { Story, Meta } from '@storybook/react'

const allDeckDefs = getDeckDefinitions()

export default {
  title: 'Library/Molecules/Deck',
  argTypes: {
    deckDef: {
      control: {
        type: 'select',
        options: Object.keys(allDeckDefs),
      },
      defaultValue: 'ot2_standard',
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
export const Basic = Template.bind({})
Basic.args = {
  children: ({ deckSlotsById }) => {
    const slotName = '5'
    const divSlot = '3'
    return (
      <>
        <rect
          x={deckSlotsById[slotName].position[0]}
          y={deckSlotsById[slotName].position[1]}
          width={deckSlotsById[slotName].boundingBox.xDimension}
          height={deckSlotsById[slotName].boundingBox.yDimension}
          fill="#0075ff33"
        />
        <RobotCoordsText
          x={deckSlotsById[slotName].position[0] + 10}
          y={deckSlotsById[slotName].position[1] + 10}
          fill="gray"
        >
          Some Text
        </RobotCoordsText>
        <RobotCoordsForeignDiv
          x={deckSlotsById[divSlot].position[0]}
          y={deckSlotsById[divSlot].position[1]}
          width={deckSlotsById[divSlot].boundingBox.xDimension}
          height={deckSlotsById[divSlot].boundingBox.yDimension}
        >
          <input
            style={{ backgroundColor: 'lightgray', margin: '1rem' }}
            placeholder="example input"
          />
        </RobotCoordsForeignDiv>
      </>
    )
  },
}
