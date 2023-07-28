import * as React from 'react'
import { useSelector } from 'react-redux'
import {
  getBatchEditSelectedStepTypes,
  getHoveredItem,
} from '../ui/steps/selectors'
import { DeckSetup, NullDeckState } from './DeckSetup'

export const DeckSetupManager = (): JSX.Element => {
  const batchEditSelectedStepTypes = useSelector(getBatchEditSelectedStepTypes)
  const hoveredItem = useSelector(getHoveredItem)

  if (batchEditSelectedStepTypes.length === 0 || hoveredItem !== null) {
    // not batch edit mode, or batch edit while item is hovered: show the deck
    return <DeckSetup />
  } else {
    return <NullDeckState />
  }
}
