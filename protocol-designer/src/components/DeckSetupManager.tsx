import { useSelector } from 'react-redux'
import {
  getBatchEditSelectedStepTypes,
  getHoveredItem,
} from '../ui/steps/selectors'
import { LegacyDeckSetup } from './DeckSetup'
import { NullDeckState } from './DeckSetup/NullDeckState'
import { OffDeckLabwareButton } from './OffDeckLabwareButton'

export const DeckSetupManager = (): JSX.Element => {
  const batchEditSelectedStepTypes = useSelector(getBatchEditSelectedStepTypes)
  const hoveredItem = useSelector(getHoveredItem)

  if (batchEditSelectedStepTypes.length === 0 || hoveredItem !== null) {
    // not batch edit mode, or batch edit while item is hovered: show the deck
    return (
      <>
        <OffDeckLabwareButton />
        <LegacyDeckSetup />
      </>
    )
  } else {
    return <NullDeckState />
  }
}
