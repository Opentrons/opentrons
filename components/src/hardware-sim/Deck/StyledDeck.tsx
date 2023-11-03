import * as React from 'react'
import styled from 'styled-components'

import { DeckFromData } from './DeckFromData'
import { FlexTrash } from './FlexTrash'

import type { DeckFromDataProps } from './DeckFromData'
import type { TrashLocation } from './FlexTrash'

interface StyledDeckProps {
  deckFill: string
  trashColor?: string
  trashLocation?: TrashLocation
}

// apply fill to .SLOT_BASE class from ot3_standard deck definition
const StyledG = styled.g<StyledDeckProps>`
  .SLOT_BASE {
    fill: ${props => props.deckFill};
  }
`

export function StyledDeck(
  props: StyledDeckProps & DeckFromDataProps
): JSX.Element {
  const {
    deckFill,
    trashLocation,
    trashColor = '#757070',
    ...deckFromDataProps
  } = props

  const robotType = deckFromDataProps.def.robot.model ?? 'OT-2 Standard'

  const trashSlotClipId =
    trashLocation != null ? `SLOT_CLIPS_${trashLocation}` : null

  const trashLayerBlocklist =
    trashSlotClipId != null
      ? deckFromDataProps.layerBlocklist.concat(trashSlotClipId)
      : deckFromDataProps.layerBlocklist

  return (
    <StyledG deckFill={deckFill}>
      <DeckFromData
        {...deckFromDataProps}
        layerBlocklist={trashLayerBlocklist}
      />
      {trashLocation != null ? (
        <FlexTrash
          deckDefinition={deckFromDataProps.def}
          robotType={robotType}
          trashIconColor={deckFill}
          backgroundColor={trashColor}
          trashLocation={trashLocation}
        />
      ) : null}
    </StyledG>
  )
}
