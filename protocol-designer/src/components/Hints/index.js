// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { AlertModal, CheckboxField, OutlineButton } from '@opentrons/components'
import { i18n } from '../../localization'
import { actions as stepsActions } from '../../ui/steps'
import type { TerminalItemId } from '../../steplist'
import { actions, selectors } from '../../tutorial'
import { Portal } from '../portals/MainPageModalPortal'
import styles from './hints.css'
import EXAMPLE_ADD_LIQUIDS_IMAGE from '../../images/example_add_liquids.png'
import EXAMPLE_WATCH_LIQUIDS_MOVE_IMAGE from '../../images/example_watch_liquids_move.png'
import type { HintKey } from '../../tutorial'
import type { BaseState, ThunkDispatch } from '../../types'

type SP = {| hintKey: ?HintKey |}
type DP = {|
  removeHint: (HintKey, boolean) => mixed,
  selectTerminalItem: TerminalItemId => mixed,
|}
type Props = {| ...SP, ...DP |}

type State = { rememberDismissal: boolean }

// List of hints that should have /!\ gray AlertModal header
// (versus calmer non-alert header)
const HINT_IS_ALERT: Array<HintKey> = ['add_liquids_and_labware']

class HintsComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { rememberDismissal: false }
  }

  toggleRememberDismissal = () => {
    this.setState({ rememberDismissal: !this.state.rememberDismissal })
  }

  makeHandleCloseClick = (hintKey: HintKey) => {
    const { rememberDismissal } = this.state
    return () => this.props.removeHint(hintKey, rememberDismissal)
  }

  renderHintContents = (hintKey: HintKey) => {
    // Only hints that have no outside effects should go here.
    // For hints that have an effect, use BlockingHint.
    switch (hintKey) {
      case 'add_liquids_and_labware':
        return (
          <>
            <div className={styles.summary}>
              {i18n.t('alert.hint.add_liquids_and_labware.summary', {
                deck_setup_step: i18n.t('nav.terminal_item.__initial_setup__'),
              })}
            </div>

            <span className={styles.column_left}>
              <div className={styles.step_description}>
                <span>Step 1: </span>
                <span>
                  {i18n.t('alert.hint.add_liquids_and_labware.step1')}
                </span>
              </div>
              <img src={EXAMPLE_ADD_LIQUIDS_IMAGE} />
            </span>

            <span className={styles.column_right}>
              <div className={styles.step_description}>
                <span>Step 2: </span>
                <span>
                  {i18n.t('alert.hint.add_liquids_and_labware.step2')}
                </span>
              </div>
              <img src={EXAMPLE_WATCH_LIQUIDS_MOVE_IMAGE} />
            </span>
          </>
        )
      case 'deck_setup_explanation':
        return (
          <>
            <p>{i18n.t(`alert.hint.${hintKey}.body1`)}</p>
            <p>{i18n.t(`alert.hint.${hintKey}.body2`)}</p>
            <p>{i18n.t(`alert.hint.${hintKey}.body3`)}</p>
          </>
        )
      case 'module_without_labware':
        return (
          <>
            <p>{i18n.t(`alert.hint.${hintKey}.body`)}</p>
          </>
        )
      default:
        return null
    }
  }

  render() {
    const { hintKey } = this.props
    if (!hintKey) return null

    const headingText = i18n.t(`alert.hint.${hintKey}.title`)
    const hintIsAlert = HINT_IS_ALERT.includes(hintKey)
    return (
      <Portal>
        <AlertModal alertOverlay heading={hintIsAlert ? headingText : null}>
          {!hintIsAlert ? (
            <div className={styles.heading}>{headingText}</div>
          ) : null}
          <div className={styles.hint_contents}>
            {this.renderHintContents(hintKey)}
          </div>
          <div>
            <CheckboxField
              className={styles.dont_show_again}
              label={i18n.t('alert.hint.dont_show_again')}
              onChange={this.toggleRememberDismissal}
              value={this.state.rememberDismissal}
            />
            <OutlineButton
              className={styles.ok_button}
              onClick={this.makeHandleCloseClick(hintKey)}
            >
              {i18n.t('button.ok')}
            </OutlineButton>
          </div>
        </AlertModal>
      </Portal>
    )
  }
}

const mapStateToProps = (state: BaseState): SP => ({
  hintKey: selectors.getHint(state),
})
const mapDispatchToProps = (dispatch: ThunkDispatch<*>): DP => ({
  removeHint: (hintKey, rememberDismissal) =>
    dispatch(actions.removeHint(hintKey, rememberDismissal)),
  selectTerminalItem: terminalId =>
    dispatch(stepsActions.selectTerminalItem(terminalId)),
})

export const Hints = connect<Props, {||}, SP, DP, _, _>(
  mapStateToProps,
  mapDispatchToProps
)(HintsComponent)
