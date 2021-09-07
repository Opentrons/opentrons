import { connect } from 'react-redux'
import * as React from 'react'
import { TerminalItem } from './TerminalItem'
import { PDListItem } from '../lists'
import { START_TERMINAL_TITLE } from '../../constants'
import { BaseState } from '../../types'
import { START_TERMINAL_ITEM_ID } from '../../steplist'
import { selectors as stepFormSelectors } from '../../step-forms'

interface Props {
  showHint: boolean
}

type SP = Props

function StartingDeckStateTerminalItemComponent(props: Props): JSX.Element {
  const { showHint } = props
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

function mapStateToProps(state: BaseState): SP {
  // since default-trash counts as 1, labwareCount <= 1 means "user did not add labware"
  const noLabware =
    Object.keys(stepFormSelectors.getLabwareEntities(state)).length <= 1
  return { showHint: noLabware }
}

export const StartingDeckStateTerminalItem = connect(mapStateToProps)(
  StartingDeckStateTerminalItemComponent
)
