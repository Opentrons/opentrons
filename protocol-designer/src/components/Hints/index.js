// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {AlertModal, CheckboxField, OutlineButton} from '@opentrons/components'
import i18n from '../../localization'
import {
  actions as steplistActions,
  type TerminalItemId,
} from '../../steplist'
import {actions, selectors} from '../../tutorial'
import {Portal} from '../portals/MainPageModalPortal'
import styles from './hints.css'
import EXAMPLE_ADD_LIQUIDS_IMAGE from '../../images/example_add_liquids.png'
import EXAMPLE_WATCH_LIQUIDS_MOVE_IMAGE from '../../images/example_watch_liquids_move.png'
import type {HintKey} from '../../tutorial'
import type {BaseState, ThunkDispatch} from '../../types'

type SP = {hint: ?HintKey}
type DP = {
  removeHint: (HintKey, boolean) => mixed,
  selectTerminalItem: (TerminalItemId) => mixed,
}
type Props = SP & DP

type State = {rememberDismissal: boolean}

class Hints extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {rememberDismissal: false}
  }

  toggleDismiss = () => {
    this.setState({rememberDismissal: !this.state.rememberDismissal})
  }

  makeHandleCloseClick = (hint) => {
    const {rememberDismissal} = this.state
    return () => this.props.removeHint(hint, rememberDismissal)
  }

  renderHintContents = (hint) => {
    switch (hint) {
      case 'add_liquids_and_labware':
        return (
          <React.Fragment>
            <div className={styles.summary}>
              {i18n.t(
                'alert.hint.add_liquids_and_labware.summary',
                {deck_setup_step: i18n.t('nav.terminal_item.__initial_setup__')})}
            </div>

            <span className={styles.column_left}>
              <div className={styles.step_description}>
                <span>Step 1: </span>
                <span>{i18n.t('alert.hint.add_liquids_and_labware.step1')}</span>
              </div>
              <img src={EXAMPLE_ADD_LIQUIDS_IMAGE} />
            </span>

            <span className={styles.column_right}>
              <div className={styles.step_description}>
                <span>Step 2: </span>
                <span>{i18n.t('alert.hint.add_liquids_and_labware.step2')}</span>
              </div>
              <img src={EXAMPLE_WATCH_LIQUIDS_MOVE_IMAGE} />
            </span>
          </React.Fragment>
        )
      default:
        return null
    }
  }

  render () {
    const {hint} = this.props
    return hint
      ? (
        <Portal>
          <AlertModal
            type='warning'
            alertOverlay
            heading={i18n.t(`alert.hint.${hint}.title`)}>
            {this.renderHintContents(hint)}
            <div>
              <CheckboxField
                className={styles.dont_show_again}
                label={i18n.t('alert.hint.dont_show_again')}
                onChange={this.toggleDismiss}
                value={this.state.rememberDismissal}
              />
              <OutlineButton
                className={styles.ok_button}
                onClick={this.makeHandleCloseClick(hint)}
              >
                {i18n.t('button.ok')}
              </OutlineButton>
            </div>
          </AlertModal>
        </Portal>
    )
    : null
  }
}

const mapStateToProps = (state: BaseState): SP => ({
  hint: selectors.getHint(state),
})
const mapDispatchToProps = (dispatch: ThunkDispatch<*>): DP => ({
  removeHint: (hint, rememberDismissal) => dispatch(actions.removeHint(hint, rememberDismissal)),
  selectTerminalItem: (terminalId) => dispatch(steplistActions.selectTerminalItem(terminalId)),
})

export default connect(mapStateToProps, mapDispatchToProps)(Hints)
