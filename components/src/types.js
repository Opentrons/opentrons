// @flow
// Reusable types.
// TODO: should this file live here?
import * as React from 'react'

export type DeckSlotProps = {
  slotName: string,
  width: number,
  height: number,
  highlighted?: boolean,
  children?: React.Node
}
