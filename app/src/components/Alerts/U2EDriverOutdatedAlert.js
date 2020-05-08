// @flow
import * as React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import { AlertModal, CheckboxField, useToggle } from '@opentrons/components'
import { useFeatureFlag } from '../../config'
import { U2E_DRIVER_UPDATE_URL } from '../../system-info'
import type { AlertProps } from './types'

// TODO(mc, 2020-05-07): i18n
const DRIVER_OUT_OF_DATE = 'Realtek USB-to-Ethernet Driver Out of Date'
const VIEW_ADAPTER_INFO = 'view adapter info'
const GET_UPDATE = 'get update'
const DONT_REMIND_ME_AGAIN = "Don't remind me again"

const DRIVER_UPDATE_DESCRIPTION =
  "It looks like your computer's Realtek USB-to-Ethernet adapter driver may be out of date. The OT-2 uses this adapter for its USB connection to your computer."
const DRIVER_UPDATE_CTA =
  "Please update your computer's driver to ensure you can connect to your OT-2."

const ADAPTER_INFO_URL = '/menu/network-and-system'

const IgnoreCheckbox = styled(CheckboxField)`
  position: absolute;
  left: 1rem;
  bottom: 1.5rem;
`

export function U2EDriverOutdatedAlert(props: AlertProps) {
  const [rememberDismiss, toggleRememberDismiss] = useToggle()
  const dismissAlert = () => props.dismissAlert(rememberDismiss)

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
          Component: Link,
          to: ADAPTER_INFO_URL,
          children: VIEW_ADAPTER_INFO,
          onClick: dismissAlert,
        },
        {
          Component: 'a',
          href: U2E_DRIVER_UPDATE_URL,
          target: '_blank',
          rel: 'noopener noreferrer',
          children: GET_UPDATE,
          onClick: dismissAlert,
        },
      ]}
    >
      <p>{DRIVER_UPDATE_DESCRIPTION}</p>
      <p>{DRIVER_UPDATE_CTA}</p>
      <IgnoreCheckbox
        label={DONT_REMIND_ME_AGAIN}
        value={rememberDismiss}
        onChange={toggleRememberDismiss}
      />
    </AlertModal>
  )
}
