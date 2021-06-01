import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { SIZE_2, SPACING_3 } from '@opentrons/components'

import {
  ALERT_APP_UPDATE_AVAILABLE,
  getAlertIsPermanentlyIgnored,
  alertPermanentlyIgnored,
  alertUnignored,
} from '../../../redux/alerts'

import { useTrackEvent } from '../../../redux/analytics'
import { TitledControl } from '../../../atoms/TitledControl'
import { ToggleBtn } from '../../../atoms/ToggleBtn'

import type { StyleProps } from '@opentrons/components'
import type { State, Dispatch } from '../../../redux/types'

const APP_UPDATE_ALERTS = 'App Update Alerts'

const GET_NOTIFIED_ABOUT_UPDATES =
  'Get notified when Opentrons has an app update ready for you.'

const ENABLE_APP_UPDATE_NOTIFICATIONS = 'Enable app update notifications'

const EVENT_APP_UPDATE_NOTIFICATIONS_TOGGLED = 'appUpdateNotificationsToggled'

export function UpdateNotificationsControl(props: StyleProps): JSX.Element {
  const dispatch = useDispatch<Dispatch>()
  const trackEvent = useTrackEvent()

  // may be enabled, disabled, or unknown (because config is loading)
  const enabled = useSelector((s: State) => {
    const ignored = getAlertIsPermanentlyIgnored(s, ALERT_APP_UPDATE_AVAILABLE)
    return ignored !== null ? !ignored : null
  })

  const handleToggle = (): void => {
    if (enabled !== null) {
      dispatch(
        enabled
          ? alertPermanentlyIgnored(ALERT_APP_UPDATE_AVAILABLE)
          : alertUnignored(ALERT_APP_UPDATE_AVAILABLE)
      )

      trackEvent({
        name: EVENT_APP_UPDATE_NOTIFICATIONS_TOGGLED,
        // this looks wierd, but the control is a toggle, which makes the next
        // "enabled" setting `!enabled`. Therefore the next "ignored" setting is
        // `!!enabled`, or just `enabled`
        properties: { updatesIgnored: enabled },
      })
    }
  }

  return (
    <TitledControl
      {...props}
      title={APP_UPDATE_ALERTS}
      description={GET_NOTIFIED_ABOUT_UPDATES}
      control={
        <ToggleBtn
          label={ENABLE_APP_UPDATE_NOTIFICATIONS}
          size={SIZE_2}
          marginRight={SPACING_3}
          disabled={enabled === null}
          toggledOn={enabled === true}
          onClick={handleToggle}
        />
      }
    />
  )
}
