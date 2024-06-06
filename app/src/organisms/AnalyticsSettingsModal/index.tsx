import * as React from 'react'
import { createPortal } from 'react-dom'
import { useSelector, useDispatch } from 'react-redux'

import {
  getAnalyticsOptInSeen,
  setAnalyticsOptInSeen,
} from '../../redux/analytics'

import { Modal, OutlineButton, SPACING } from '@opentrons/components'
import { AnalyticsToggle } from './AnalyticsToggle'
import { getModalPortalEl } from '../../App/portal'
import type { Dispatch } from '../../redux/types'

// TODO(bc, 2021-02-04): i18n
const TITLE = 'Privacy Settings'
const CONTINUE = 'continue'

// TODO(mc, 2020-05-07): move render logic to `state.alerts`
export function AnalyticsSettingsModal(): JSX.Element | null {
  const dispatch = useDispatch<Dispatch>()
  const seen = useSelector(getAnalyticsOptInSeen)
  const setSeen = (): unknown => dispatch(setAnalyticsOptInSeen())

  return !seen
    ? createPortal(
        <Modal onCloseClick={setSeen} heading={TITLE} alertOverlay>
          <AnalyticsToggle />
          <OutlineButton
            onClick={setSeen}
            float="right"
            margin={SPACING.spacing12}
          >
            {CONTINUE}
          </OutlineButton>
        </Modal>,
        getModalPortalEl()
      )
    : null
}
