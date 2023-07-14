import * as React from 'react'
import { FLEX_ROBOT_TYPE, DeckSlot, RobotType, getDeckDefFromRobotType } from '@opentrons/shared-data'
import { RobotCoordinateSpace } from '../RobotCoordinateSpace'
import { DeckSlotLocation as DeckSlotLocationComponent } from './'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<React.ComponentProps<typeof DeckSlotLocationComponent>> = {
  component: DeckSlotLocationComponent,
  title: 'Library/Molecules/Simulation/DeckSlotLocation',
} as Meta

export default meta
type Story = StoryObj<React.ComponentProps<typeof DeckSlotLocationComponent>>

const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
export const DeckSlotLocation: Story = {
  render: args => (
    <RobotCoordinateSpace height="400px" viewBox={`${deckDef.cornerOffsetFromOrigin[0]} ${deckDef.cornerOffsetFromOrigin[1]} ${deckDef.dimensions[0]} ${deckDef.dimensions[1]}`}>
      <DeckSlotLocationComponent
        slotName={args.slotName}
        deckDefinition={args.deckDefinition}
        slotClipColor='#00ff0000'
        slotBaseColor='#ccc'
      />
    </RobotCoordinateSpace>
  ),
  args: {
    slotName: 'A1',
    deckDefinition: deckDef
  },
}


interface StandardDeckBaseProps {
  robotType: RobotType,
  trashSlotName?: { [slotName: DeckSlot['id']]: string }
}

function StandardDeckBase(props: StandardDeckBaseProps): JSX.Element {
  const { robotType, trashSlotName } = props
  const deckDef = getDeckDefFromRobotType(robotType)
  return (
    <RobotCoordinateSpace height="400px" viewBox={`${deckDef.cornerOffsetFromOrigin[0]} ${deckDef.cornerOffsetFromOrigin[1]} ${deckDef.dimensions[0]} ${deckDef.dimensions[1]}`}>
      {deckDef.locations.orderedSlots.map(slotDef => (
        <>
        <DeckSlotLocationComponent
          slotName={slotDef.id}
          deckDefinition={deckDef}
          slotClipColor='#00ff0000'
          slotBaseColor='#ccc'
        />
        {slotDef.id === trashSlotName ?(
        ) :null}
        </>
      ))}
    </RobotCoordinateSpace>
  )
}