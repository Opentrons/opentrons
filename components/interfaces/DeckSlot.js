// @flow
import * as React from 'react'

export type DeckSlotProps = {
  slot: string,
  highlighted?: boolean,
  containerType?: string,
  children?: React.Node
}

export type DeckSlot = React.ComponentType<DeckSlotProps>
