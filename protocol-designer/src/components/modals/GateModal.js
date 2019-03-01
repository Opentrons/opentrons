// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import cx from 'classnames'
import {AlertModal, Icon} from '@opentrons/components'
import {opentronsWebApi, type GateStage} from '../../networking'
import i18n from '../../localization'
import modalStyles from './modal.css'
import settingsStyles from '../SettingsPage/SettingsPage.css'
import {
  actions as analyticsActions,
  selectors as analyticsSelectors,
} from '../../analytics'
import type {BaseState} from '../../types'

type Props = {
  hasOptedIn: boolean | null,
  optIn: () => mixed,
  optOut: () => mixed,
}

type SP = {
  hasOptedIn: $PropertyType<Props, 'hasOptedIn'>,
}

type DP = $Diff<Props, SP>

type State = {gateStage: GateStage}
class GateModal extends React.Component<Props, State> {
  constructor () {
    super()
    this.state = {gateStage: 'loading'}

    opentronsWebApi.getGateStage().then(gateStage => {
      console.log('async state is: ', gateStage)
      this.setState({gateStage})
    })
  }

  render () {
    const {hasOptedIn, optIn, optOut} = this.props

    console.log('RENDERED STAGE IS: ', this.state.gateStage)
    if (hasOptedIn !== null) return null

    switch (this.state.gateStage) {
      case 'identify':
        return (
          <AlertModal className={cx(modalStyles.modal, modalStyles.blocking)}>
            <h3>Sign Up For Opentrons Protocol Designer Beta</h3>
            <div className={settingsStyles.body_wrapper}>
              <p className={settingsStyles.card_body}>{i18n.t('modal.gate.sign_up_below')}</p>
              <div>
                TODO: IMMEDIATELY: put typeform here
              </div>
            </div>
          </AlertModal>
        )
      case 'analytics':
        return (
          <AlertModal
            className={cx(modalStyles.modal, modalStyles.blocking)}
            buttons={[
              {onClick: optOut, children: i18n.t('button.no')},
              {onClick: optIn, children: i18n.t('button.yes')},
            ]} >
            <h3>{i18n.t('card.toggle.share_session')}</h3>
            <div className={settingsStyles.body_wrapper}>
              <p className={settingsStyles.card_body}>{i18n.t('card.body.reason_for_collecting_data')}</p>
              <ul className={settingsStyles.card_point_list}>
                <li>{i18n.t('card.body.data_collected_is_internal')}</li>
                {/* TODO: BC 2018-09-26 uncomment when only using fullstory <li>{i18n.t('card.body.data_only_from_pd')}</li> */}
                <li>{i18n.t('card.body.opt_out_of_data_collection')}</li>
              </ul>
            </div>
          </AlertModal>
        )
      case 'failedVerification':
        return (
          <AlertModal className={cx(modalStyles.modal, modalStyles.blocking)}>
            <h3>FAILED VERIFICATION</h3>
            <div className={settingsStyles.body_wrapper}>
              <p className={settingsStyles.card_body}>{i18n.t('modal.gate.verification_failed')}</p>
              <p>{i18n.t('modal.gate.expired_token')}</p>
              <div>
                TODO: IMMEDIATELY: put typeform here
              </div>
            </div>
          </AlertModal>
        )
      case 'loading':
      default:
        return (
          <AlertModal className={cx(modalStyles.modal, modalStyles.blocking)}>
            <div className={settingsStyles.body_wrapper}>
              <Icon name="ot-spinner" className={modalStyles.spinner_modal_icon} spin />
            </div>
          </AlertModal>
        )
    }
  }
}

function mapStateToProps (state: BaseState): SP {
  return {hasOptedIn: analyticsSelectors.getHasOptedIn(state)}
}

function mapDispatchToProps (dispatch: Dispatch<*>): DP {
  return {
    optIn: () => dispatch(analyticsActions.optIn()),
    optOut: () => dispatch(analyticsActions.optOut()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(GateModal)
