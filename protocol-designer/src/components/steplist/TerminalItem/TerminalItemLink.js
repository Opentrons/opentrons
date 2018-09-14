// @flow

import * as React from 'react'
import {connect} from 'react-redux'
import type {ThunkDispatch} from '../../../types'
import {
  actions as steplistActions,
  type TerminalItemId,
} from '../../../steplist'
import i18n from '../../../localization'
import styles from './styles.css'

type OP = { terminalId: TerminalItemId }
type DP = { selectTerminalItem: (TerminalItemId) => mixed }

class TerminalItemLink extends React.Component<OP & DP> {
  handleClick = () => {
    this.props.selectTerminalItem(this.props.terminalId)
  }

  render () {
    return (
      <a
        className={styles.nav_link}
        onClick={this.handleClick}>
        {i18n.t(`nav.terminal_item.${this.props.terminalId}`)}
      </a>
    )
  }
}

const mapDTP = (dispatch: ThunkDispatch<*>): DP => ({
  selectTerminalItem: (terminalId) => dispatch(steplistActions.selectTerminalItem(terminalId)),
})
export default connect(null, mapDTP)(TerminalItemLink)
