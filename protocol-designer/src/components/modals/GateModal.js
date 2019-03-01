// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import cx from 'classnames'
import queryString from 'query-string'
import isEmpty from 'lodash/isEmpty'
import { AlertModal } from '@opentrons/components'
import i18n from '../../localization'
import modalStyles from './modal.css'
import settingsStyles from '../SettingsPage/SettingsPage.css'
import {
  actions as analyticsActions,
  selectors as analyticsSelectors,
} from '../../analytics'
import type {BaseState} from '../../types'

type GateStage = 'identify' | 'analytics'

type Props = {
  hasOptedIn: boolean | null,
  optIn: () => mixed,
  optOut: () => mixed,
}

type SP = {
  hasOptedIn: $PropertyType<Props, 'hasOptedIn'>,
}

type DP = $Diff<Props, SP>

function GateModal (props: Props) {
  const {hasOptedIn, optIn, optOut} = props
  let stage: GateStage = 'identify'

  const parsedQueryStringParams = (queryString.parse(global.location.search))
  const {token} = parsedQueryStringParams

  const OPENTRONS_API_BASE_URL = 'https://staging.web-api.opentrons.com'
  const VERIFY_EMAIL_ENDPOINT = '/users/verify-email'

  if (token) {
    fetch(
      'https://staging.web-api.opentrons.com/users/verify-email',
      {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiYnJpYW4iLCJlbWFpbCI6ImJyaWFuQG9wZW50cm9ucy5jb20iLCJpYXQiOjE1NTE0NTgyMjgsImV4cCI6MTU1MTQ2MTgyOCwiaXNzIjoid2ViLWFwaS5vcGVudHJvbnMuY29tIn0.8t97irZcKIWuLt-sGE4z9XYLJnwi20m8uaaAuXWNDSA'
        }),
      }
    ).then(res => res.json()).then(response => (
      console.log('Success:', JSON.stringify(response))
    )).catch(error => console.error('Error:', error))
  }

  if (hasOptedIn !== null) return null

  const getButtons = () => {
    if (stage === 'analytics') {
      return [
        {onClick: optOut, children: i18n.t('button.no')},
        {onClick: optIn, children: i18n.t('button.yes')},
      ]
    }
  }

  return (
    <AlertModal
      className={cx(modalStyles.modal, modalStyles.blocking)}
      buttons={getButtons()} >
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
