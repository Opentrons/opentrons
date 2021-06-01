import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import {
  getAnalyticsOptInSeen,
  setAnalyticsOptInSeen,
} from '../../redux/analytics'

import { Modal, OutlineButton } from '@opentrons/components'
import { AnalyticsToggle } from './AnalyticsToggle'
import { Portal } from '../../App/portal'
import type { Dispatch } from '../../redux/types'

// TODO(bc, 2021-02-04): i18n
const TITLE = 'Privacy Settings'
const CONTINUE = 'continue'

// TODO(mc, 2020-05-07): move render logic to `state.alerts`
export function AnalyticsSettingsModal(): JSX.Element | null {
  const dispatch = useDispatch<Dispatch>()
  const seen = useSelector(getAnalyticsOptInSeen)
  const setSeen = (): unknown => dispatch(setAnalyticsOptInSeen())

  return !seen ? (
    <Portal>
      <Modal onCloseClick={setSeen} heading={TITLE} alertOverlay>
        <AnalyticsToggle />
        <OutlineButton onClick={setSeen} float="right" margin="0.75rem">
          {CONTINUE}
        </OutlineButton>
      </Modal>
    </Portal>
  ) : null
}
