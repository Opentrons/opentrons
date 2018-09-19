// @flow

import * as React from 'react'
import {connect} from 'react-redux'
import i18n from '../../localization'
import {
  actions as steplistActions,
  START_TERMINAL_ITEM_ID,
  type TerminalItemId,
} from '../../steplist'
import {actions, selectors} from '../../tutorial'
import type {HintKey} from '../../tutorial'
import {AlertItem} from '@opentrons/components'
import type {BaseState, ThunkDispatch} from '../../types'
import {TerminalItemLink} from '../steplist/TerminalItem'

type SP = {hints: Array<HintKey>}
type DP = {
  removeHint: (HintKey) => mixed,
  selectTerminalItem: (TerminalItemId) => mixed,
}
type Props = SP & DP

class Hints extends React.Component<Props> {
  makeHandleCloseClick = (hint) => () => this.props.removeHint(hint)

  renderHintContents = (hint) => {
    switch (hint) {
      case 'add_liquids_and_labware':
        return (
          <React.Fragment>
            {i18n.t('alert.hint.go_to')}
            <TerminalItemLink terminalId={START_TERMINAL_ITEM_ID} />
            {i18n.t('alert.hint.add_liquids_and_labware.directions')}
          </React.Fragment>
        )
      default:
        return null
    }
  }

  render () {
    return (
      <div>
        {this.props.hints.map((hint) => (
          <AlertItem
            type='warning'
            key={`hint:${hint}`}
            title={i18n.t(`alert.hint.${hint}.title`)}
            onCloseClick={this.makeHandleCloseClick(hint)}>
            {this.renderHintContents(hint)}
          </AlertItem>
        ))}
      </div>
    )
  }
}

const mapStateToProps = (state: BaseState): SP => ({
  hints: selectors.getHints(state),
})
const mapDispatchToProps = (dispatch: ThunkDispatch<*>): DP => ({
  removeHint: (hint) => dispatch(actions.removeHint(hint)),
  selectTerminalItem: (terminalId) => dispatch(steplistActions.selectTerminalItem(terminalId)),
})

export default connect(mapStateToProps, mapDispatchToProps)(Hints)
