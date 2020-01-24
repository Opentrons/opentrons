// @flow

import * as React from 'react'
import { connect } from 'react-redux'
import type { ThunkDispatch } from '../../../types'
import { actions as stepsActions } from '../../../ui/steps'
import { type TerminalItemId } from '../../../steplist'
import { i18n } from '../../../localization'
import styles from './styles.css'

type OP = {| terminalId: TerminalItemId |}
type DP = {| selectTerminalItem: TerminalItemId => mixed |}
type Props = {| ...OP, ...DP |}

class TerminalItemLinkComponent extends React.Component<Props> {
  handleClick = () => {
    this.props.selectTerminalItem(this.props.terminalId)
  }

  render() {
    return (
      <a className={styles.nav_link} onClick={this.handleClick}>
        {i18n.t(`nav.terminal_item.${this.props.terminalId}`)}
      </a>
    )
  }
}

const mapDTP = (dispatch: ThunkDispatch<*>): DP => ({
  selectTerminalItem: terminalId =>
    dispatch(stepsActions.selectTerminalItem(terminalId)),
})

export const TerminalItemLink = connect<Props, OP, {||}, DP, _, _>(
  null,
  mapDTP
)(TerminalItemLinkComponent)
