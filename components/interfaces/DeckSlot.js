// @flow
import * as React from 'react'

export type DeckSlotProps = {
  slot: string,
  width: number,
  height: number,
  highlighted?: boolean,
  containerType?: string,
  children?: React.Node
}

export type DeckSlot = React.ComponentType<DeckSlotProps>
