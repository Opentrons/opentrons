// @flow
import {connect} from 'react-redux'
import * as React from 'react'
import TerminalItem from './TerminalItem'
import {PDListItem} from '../lists'
import {START_TERMINAL_TITLE} from '../../constants'
import type {BaseState} from '../../types'
import {START_TERMINAL_ITEM_ID} from '../../steplist'
import {selectors as labwareIngredsSelectors} from '../../labware-ingred/reducers'

type Props = {
  showHint: boolean
}

function StartingDeckStateTerminalItem (props: Props) {
  const {showHint} = props
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

function mapStateToProps (state: BaseState): Props {
  // since default-trash counts as 1, labwareCount <= 1 means "user did not add labware"
  const noLabware = Object.keys(labwareIngredsSelectors.getLabware(state)).length <= 1
  return {showHint: noLabware}
}

export default connect(mapStateToProps)(StartingDeckStateTerminalItem)
