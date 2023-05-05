import * as React from 'react'
import { Modal, OutlineButton } from '@opentrons/components'
import { useSelector, useDispatch } from 'react-redux'

import { Portal } from '../../App/portal'
import {
  getAnalyticsOptInSeen,
  setAnalyticsOptInSeen,
} from '../../redux/analytics'
import type { Dispatch } from '../../redux/types'
import { AnalyticsToggle } from './AnalyticsToggle'

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
