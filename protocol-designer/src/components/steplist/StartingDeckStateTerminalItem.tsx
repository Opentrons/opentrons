import * as React from 'react'
import { useSelector } from 'react-redux'
import { PDListItem } from '../lists'
import { START_TERMINAL_TITLE } from '../../constants'
import { START_TERMINAL_ITEM_ID } from '../../steplist'
import { selectors as stepFormSelectors } from '../../step-forms'
import { TerminalItem } from './TerminalItem'

export function StartingDeckStateTerminalItem(): JSX.Element {
  const labwareEntities = useSelector(stepFormSelectors.getLabwareEntities)
  const showHint = Object.keys(labwareEntities).length <= 1
  const hintContents = (
    <PDListItem>
      Add labware to the deck and assign liquids to the wells they start in
    </PDListItem>
  )

  return (
    <TerminalItem id={START_TERMINAL_ITEM_ID} title={START_TERMINAL_TITLE}>
      {showHint && hintContents}
    </TerminalItem>
  )
}
