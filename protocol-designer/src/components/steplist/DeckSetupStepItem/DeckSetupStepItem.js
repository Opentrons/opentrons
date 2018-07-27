// @flow
import * as React from 'react'
import {DECK_SETUP_TITLE} from '../../../constants'
import {PDTitledList} from '../../lists'

type Props = {
  hovered: boolean,
  selected: boolean,
  showDescription: boolean,
  onStepClick?: (event?: SyntheticEvent<>) => mixed,
  onStepHover?: (event?: SyntheticEvent<>) => mixed,
  onStepMouseLeave?: (event?: SyntheticEvent<>) => mixed
}

export default function DeckSetupStepItem (props: Props) {
  const {
    hovered,
    selected,
    onStepClick,
    onStepHover,
    onStepMouseLeave
  } = props

  return (
    <PDTitledList
      title={DECK_SETUP_TITLE}
      onClick={onStepClick}
      onMouseEnter={onStepHover}
      onMouseLeave={onStepMouseLeave}
      selected={selected}
      hovered={hovered}
    >
      <span>Add labware to the deck and assign liquids to the wells they start in</span>
    </PDTitledList>
  )
}
