// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'
import { AlertModal, Icon, OutlineButton } from '@opentrons/components'
import { opentronsWebApi, type GateStage } from '../../../networking'
import { i18n } from '../../../localization'
import { writeFakeIdentityCookie } from '../../../networking/opentronsWebApi'
import CHECK_EMAIL_IMAGE from '../../../images/youve_got_mail.svg'
import {
  actions as analyticsActions,
  selectors as analyticsSelectors,
} from '../../../analytics'
import type { BaseState, ThunkDispatch } from '../../../types'
import settingsStyles from '../../SettingsPage/SettingsPage.css'
import modalStyles from '../modal.css'
import { SignUpForm } from './SignUpForm'

type Props = {
  hasOptedIn: boolean | null,
  optIn: () => mixed,
  optOut: () => mixed,
}

type SP = {|
  hasOptedIn: $PropertyType<Props, 'hasOptedIn'>,
|}

type DP = $Rest<$Exact<Props>, SP>

type State = { gateStage: GateStage, errorMessage: ?string }

class GateModalComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { gateStage: 'loading', errorMessage: '' }
    this.refreshState()
  }

  refreshState() {
    return opentronsWebApi
      .getGateStage(this.props.hasOptedIn)
      .then(({ gateStage, errorMessage }) => {
        this.setState({ gateStage, errorMessage })
      })
  }

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    if (
      nextProps.hasOptedIn !== null &&
      prevState.gateStage === 'promptOptForAnalytics'
    ) {
      return { gateStage: 'openGate' }
    } else {
      return prevState
    }
  }

  render() {
    const { optIn, optOut } = this.props

    switch (this.state.gateStage) {
      case 'promptVerifyIdentity':
        return (
          <AlertModal className={cx(modalStyles.modal, modalStyles.blocking)}>
            <h3>{i18n.t('modal.gate.sign_up_below')}</h3>
            <div className={settingsStyles.body_wrapper}>
              <SignUpForm />
            </div>
            <OutlineButton
              className={modalStyles.bottom_button}
              onClick={() => {
                writeFakeIdentityCookie()
                this.refreshState()
              }}
            >
              SKIP SIGN UP
            </OutlineButton>
          </AlertModal>
        )
      case 'promptOptForAnalytics':
        return (
          <AlertModal
            className={cx(modalStyles.modal, modalStyles.blocking)}
            buttons={[
              { onClick: optOut, children: i18n.t('button.no') },
              { onClick: optIn, children: i18n.t('button.yes') },
            ]}
          >
            <h3>{i18n.t('card.toggle.share_session')}</h3>
            <div className={settingsStyles.body_wrapper}>
              <p className={settingsStyles.card_body}>
                {i18n.t('card.body.reason_for_collecting_data')}
              </p>
              <ul className={settingsStyles.card_point_list}>
                <li>{i18n.t('card.body.data_collected_is_internal')}</li>
                {/* TODO: BC 2018-09-26 uncomment when only using fullstory <li>{i18n.t('card.body.data_only_from_pd')}</li> */}
                <li>{i18n.t('card.body.opt_out_of_data_collection')}</li>
              </ul>
            </div>
          </AlertModal>
        )
      case 'failedIdentityVerification':
        return (
          <AlertModal className={cx(modalStyles.modal, modalStyles.blocking)}>
            <h3>{i18n.t('modal.gate.failed_verification')}</h3>
            <div className={settingsStyles.body_wrapper}>
              <p className={settingsStyles.card_body}>
                {this.state.errorMessage}
              </p>
              <SignUpForm />
            </div>
          </AlertModal>
        )
      case 'promptCheckEmail':
        return (
          <AlertModal className={cx(modalStyles.modal, modalStyles.blocking)}>
            <h3>{i18n.t('modal.gate.sign_up_success')}</h3>
            <div className={modalStyles.centered_icon_wrapper}>
              <img
                src={CHECK_EMAIL_IMAGE}
                className={modalStyles.success_icon}
              />
            </div>
            <div className={settingsStyles.body_wrapper}>
              <p className={settingsStyles.card_body}>
                {i18n.t('modal.gate.check_email')}
              </p>
            </div>
          </AlertModal>
        )
      case 'openGate':
        return null
      case 'loading':
      default:
        return (
          <AlertModal className={cx(modalStyles.modal, modalStyles.blocking)}>
            <div className={settingsStyles.body_wrapper}>
              <div className={modalStyles.centered_icon_wrapper}>
                <Icon
                  name="ot-spinner"
                  className={modalStyles.spinner_modal_icon}
                  spin
                />
              </div>
            </div>
          </AlertModal>
        )
    }
  }
}

function mapStateToProps(state: BaseState): SP {
  return { hasOptedIn: analyticsSelectors.getHasOptedIn(state) }
}

function mapDispatchToProps(dispatch: ThunkDispatch<*>): DP {
  return {
    optIn: () => dispatch(analyticsActions.optIn()),
    optOut: () => dispatch(analyticsActions.optOut()),
  }
}

export const GateModal = connect<Props, {||}, SP, DP, _, _>(
  mapStateToProps,
  mapDispatchToProps
)(GateModalComponent)
