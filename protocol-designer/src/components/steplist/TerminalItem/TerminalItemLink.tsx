import * as React from 'react'
import { connect } from 'react-redux'
import { ThunkDispatch } from '../../../types'
import { actions as stepsActions } from '../../../ui/steps'
import { TerminalItemId } from '../../../steplist'
import { i18n } from '../../../localization'
import styles from './styles.module.css'

interface OP {
  terminalId: TerminalItemId
}
interface DP {
  selectTerminalItem: (terminalItemId: TerminalItemId) => unknown
}
type Props = OP & DP

class TerminalItemLinkComponent extends React.Component<Props> {
  handleClick = (): void => {
    this.props.selectTerminalItem(this.props.terminalId)
  }

  render(): JSX.Element {
    return (
      <a className={styles.nav_link} onClick={this.handleClick}>
        {i18n.t(`nav.terminal_item.${this.props.terminalId}`)}
      </a>
    )
  }
}

const mapDTP = (dispatch: ThunkDispatch<any>): DP => ({
  selectTerminalItem: terminalId =>
    dispatch(stepsActions.selectTerminalItem(terminalId)),
})

export const TerminalItemLink = connect(null, mapDTP)(TerminalItemLinkComponent)
