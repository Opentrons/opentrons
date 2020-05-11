// @flow
import * as React from 'react'
import { useHistory, Link as InternalLink } from 'react-router-dom'
import styled from 'styled-components'

import {
  AlertModal,
  CheckboxField,
  Link,
  useToggle,
} from '@opentrons/components'
import { useFeatureFlag } from '../../config'
import { useTrackEvent } from '../../analytics'
import {
  U2E_DRIVER_UPDATE_URL,
  U2E_DRIVER_OUTDATED_MESSAGE,
  U2E_DRIVER_DESCRIPTION,
  U2E_DRIVER_OUTDATED_CTA,
  EVENT_U2E_DRIVER_ALERT_DISMISSED,
  EVENT_U2E_DRIVER_LINK_CLICKED,
} from '../../system-info'
import type { AlertProps } from './types'

// TODO(mc, 2020-05-07): i18n
const DRIVER_OUT_OF_DATE = 'Realtek USB-to-Ethernet Driver Update Available'
const VIEW_ADAPTER_INFO = 'view adapter info'
const GET_UPDATE = 'get update'
const DONT_REMIND_ME_AGAIN = "Don't remind me again"

const ADAPTER_INFO_URL = '/menu/network-and-system'

const LinkButton = styled(Link)`
  width: auto;
  padding-left: 1rem;
  padding-right: 1rem;
`

const IgnoreCheckbox = styled(CheckboxField)`
  position: absolute;
  left: 1rem;
  bottom: 1.5rem;
`

export function U2EDriverOutdatedAlert(props: AlertProps) {
  const history = useHistory()
  const trackEvent = useTrackEvent()
  const [rememberDismiss, toggleRememberDismiss] = useToggle()
  const { dismissAlert } = props

  // TODO(mc, 2020-05-07): remove this feature flag
  const enabled = useFeatureFlag('enableSystemInfo')
  React.useLayoutEffect(() => {
    if (!enabled) dismissAlert()
  })

  return (
    <AlertModal
      alertOverlay
      heading={DRIVER_OUT_OF_DATE}
      buttons={[
        {
          Component: LinkButton,
          as: InternalLink,
          to: ADAPTER_INFO_URL,
          children: VIEW_ADAPTER_INFO,
          onClick: () => {
            dismissAlert(rememberDismiss)
            trackEvent({
              name: EVENT_U2E_DRIVER_ALERT_DISMISSED,
              properties: { rememberDismiss },
            })
          },
        },
        {
          Component: LinkButton,
          href: U2E_DRIVER_UPDATE_URL,
          external: true,
          children: GET_UPDATE,
          onClick: () => {
            history.push(ADAPTER_INFO_URL)
            dismissAlert(rememberDismiss)
            trackEvent({
              name: EVENT_U2E_DRIVER_LINK_CLICKED,
              properties: { source: 'modal' },
            })
          },
        },
      ]}
    >
      <p>
        {U2E_DRIVER_OUTDATED_MESSAGE} {U2E_DRIVER_DESCRIPTION}
      </p>
      <p>{U2E_DRIVER_OUTDATED_CTA}</p>
      <IgnoreCheckbox
        label={DONT_REMIND_ME_AGAIN}
        value={rememberDismiss}
        onChange={toggleRememberDismiss}
      />
    </AlertModal>
  )
}
