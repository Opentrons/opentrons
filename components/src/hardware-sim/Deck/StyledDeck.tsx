import * as React from 'react'
import styled from 'styled-components'

import { DeckFromLayers } from './DeckFromLayers'
import { FlexTrash } from './FlexTrash'

import type { RobotType } from '@opentrons/shared-data'
import type { DeckFromLayersProps } from './DeckFromLayers'
import type { TrashLocation } from './FlexTrash'

interface StyledDeckProps {
  deckFill: string
  robotType: RobotType
  trashColor?: string
  trashLocation?: TrashLocation
}

// apply fill to .SLOT_BASE class from ot3_standard deck definition
const StyledG = styled.g<Pick<StyledDeckProps, 'deckFill'>>`
  .SLOT_BASE {
    fill: ${props => props.deckFill};
  }
`

export function StyledDeck(
  props: StyledDeckProps & DeckFromLayersProps
): JSX.Element {
  const {
    deckFill,
    robotType,
    trashLocation,
    trashColor = '#757070',
    ...DeckFromLayersProps
  } = props
  const trashSlotClipId =
    trashLocation != null ? `SLOT_CLIPS_${trashLocation}` : null

  const trashLayerBlocklist =
    trashSlotClipId != null
      ? DeckFromLayersProps.layerBlocklist.concat(trashSlotClipId)
      : DeckFromLayersProps.layerBlocklist

  return (
    <StyledG deckFill={deckFill}>
      <DeckFromLayers
        {...DeckFromLayersProps}
        layerBlocklist={trashLayerBlocklist}
        robotType={robotType}
      />
      {/* TODO(bh, 2023-11-06): remove trash and trashLocation prop when StyledDeck removed from MoveLabwareOnDeck */}
      {trashLocation != null ? (
        <FlexTrash
          robotType={robotType}
          trashIconColor={deckFill}
          backgroundColor={trashColor}
          trashLocation={trashLocation}
        />
      ) : null}
    </StyledG>
  )
}
