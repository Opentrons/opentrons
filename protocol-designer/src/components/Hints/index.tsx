import * as React from 'react'
import { connect } from 'react-redux'
import {
  AlertModal,
  DeprecatedCheckboxField,
  Flex,
  OutlineButton,
  Text,
} from '@opentrons/components'
import { actions as stepsActions } from '../../ui/steps'
import { TerminalItemId } from '../../steplist'
import { actions, selectors, HintKey } from '../../tutorial'
import { Portal } from '../portals/MainPageModalPortal'
import styles from './hints.css'
import EXAMPLE_ADD_LIQUIDS_IMAGE from '../../images/example_add_liquids.png'
import EXAMPLE_WATCH_LIQUIDS_MOVE_IMAGE from '../../images/example_watch_liquids_move.png'
import EXAMPLE_BATCH_EDIT_IMAGE from '../../images/announcements/multi_select.gif'
import { BaseState, ThunkDispatch } from '../../types'
import { useTranslation } from 'react-i18next'

interface SP {
  t: any
  hintKey?: HintKey | null
}
interface DP {
  removeHint: (key: HintKey, rememberDismissal: boolean) => unknown
  selectTerminalItem: (item: TerminalItemId) => unknown
}
type Props = SP & DP

interface State {
  rememberDismissal: boolean
}

// List of hints that should have /!\ gray AlertModal header
// (versus calmer non-alert header)
const HINT_IS_ALERT: HintKey[] = ['add_liquids_and_labware']

class HintsComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { rememberDismissal: false }
  }

  toggleRememberDismissal = (): void => {
    this.setState({ rememberDismissal: !this.state.rememberDismissal })
  }

  makeHandleCloseClick = (hintKey: HintKey): (() => void) => {
    const { rememberDismissal } = this.state
    return () => this.props.removeHint(hintKey, rememberDismissal)
  }

  renderHintContents = (hintKey: HintKey): JSX.Element | null => {
    // Only hints that have no outside effects should go here.
    // For hints that have an effect, use BlockingHint.
    switch (hintKey) {
      case 'add_liquids_and_labware':
        return (
          <>
            <div className={styles.summary}>
              {this.props.t('hint.add_liquids_and_labware.summary', {
                deck_setup_step: this.props.t(
                  'nav:terminal_item.__initial_setup__'
                ),
              })}
            </div>

            <span className={styles.column_left}>
              <div className={styles.step_description}>
                <span>Step 1: </span>
                <span>
                  {this.props.t('hint.add_liquids_and_labware.step1')}
                </span>
              </div>
              <img src={EXAMPLE_ADD_LIQUIDS_IMAGE} />
            </span>

            <span className={styles.column_right}>
              <div className={styles.step_description}>
                <span>Step 2: </span>
                <span>
                  {this.props.t('hint.add_liquids_and_labware.step2')}
                </span>
              </div>
              <img src={EXAMPLE_WATCH_LIQUIDS_MOVE_IMAGE} />
            </span>
          </>
        )
      case 'deck_setup_explanation':
        return (
          <>
            <p>{this.props.t(`hint.${hintKey}.body1`)}</p>
            <p>{this.props.t(`hint.${hintKey}.body2`)}</p>
            <p>{this.props.t(`hint.${hintKey}.body3`)}</p>
          </>
        )
      case 'module_without_labware':
        return (
          <>
            <p>{this.props.t(`alert:hint.${hintKey}.body`)}</p>
          </>
        )
      case 'thermocycler_lid_passive_cooling':
        return (
          <>
            <p>
              {this.props.t(`alert:hint.${hintKey}.body1a`)}
              <strong>
                {this.props.t(`alert:hint.${hintKey}.strong_body1`)}
              </strong>
              {this.props.t(`alert:hint.${hintKey}.body1b`)}
            </p>
            <ol className={styles.numbered_list}>
              <li>
                <span>{this.props.t(`alert:hint.${hintKey}.li1`)}</span>
              </li>
              <li>
                <span>{this.props.t(`alert:hint.${hintKey}.li2`)}</span>
              </li>
            </ol>
          </>
        )
      case 'protocol_can_enter_batch_edit':
        return (
          <>
            <span className={styles.column_left}>
              <img src={EXAMPLE_BATCH_EDIT_IMAGE} />
            </span>
            <span className={styles.column_right}>
              <p>{this.props.t(`alert:hint.${hintKey}.body1`)}</p>
              <p>
                {this.props.t(`alert:hint.${hintKey}.body2`)}
                <ol className={styles.numbered_list}>
                  <li>
                    {this.props.t(`alert:hint.${hintKey}.li1a`)}
                    <strong>
                      {this.props.t(`alert:hint.${hintKey}.strong_li1`)}
                    </strong>
                    {this.props.t(`alert:hint.${hintKey}.li1b`)}
                  </li>
                  <li>
                    {this.props.t(`alert:hint.${hintKey}.li2a`)}
                    <strong>
                      {this.props.t(`alert:hint.${hintKey}.strong_li2`)}
                    </strong>
                    {this.props.t(`alert:hint.${hintKey}.li2b`)}
                  </li>
                </ol>
              </p>
              <p>
                {this.props.t(`alert:hint.${hintKey}.body3a`)} <br />
                {this.props.t(`alert:hint.${hintKey}.body3b`)}
              </p>
              <p>
                {this.props.t(`alert:hint.${hintKey}.body4a`)} <br />
                {this.props.t(`alert:hint.${hintKey}.body4b`)}
              </p>
            </span>
          </>
        )
      case 'waste_chute_warning':
        return (
          <Flex>
            <Text>{this.props.t(`hint.${hintKey}.body1`)}</Text>
          </Flex>
        )
      default:
        return null
    }
  }

  render(): React.ReactNode {
    const { hintKey } = this.props
    if (!hintKey) return null

    const headingText = this.props.t(`hint.${hintKey}.title`)
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
            <DeprecatedCheckboxField
              className={styles.dont_show_again}
              label={this.props.t('hint.dont_show_again')}
              onChange={this.toggleRememberDismissal}
              value={this.state.rememberDismissal}
            />
            <OutlineButton
              className={styles.ok_button}
              onClick={this.makeHandleCloseClick(hintKey)}
            >
              {this.props.t('button:ok')}
            </OutlineButton>
          </div>
        </AlertModal>
      </Portal>
    )
  }
}

const mapStateToProps = (state: BaseState): SP => {
  const { t } = useTranslation(['alert', 'nav', 'button'])
  return {
    hintKey: selectors.getHint(state),
    t: t,
  }
}
const mapDispatchToProps = (dispatch: ThunkDispatch<any>): DP => ({
  removeHint: (hintKey, rememberDismissal) =>
    dispatch(actions.removeHint(hintKey, rememberDismissal)),
  selectTerminalItem: terminalId =>
    dispatch(stepsActions.selectTerminalItem(terminalId)),
})

export const Hints = connect(
  mapStateToProps,
  mapDispatchToProps
)(HintsComponent)
