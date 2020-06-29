// @flow
import { Modal } from '@opentrons/components'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { getAnalyticsOptInSeen, setAnalyticsOptInSeen } from '../../analytics'
import type { Dispatch } from '../../types'
import { Portal } from '../portal'
import { AnalyticsToggle } from './AnalyticsToggle'
import { ModalButton } from './ModalButton'

const TITLE = 'Privacy Settings'
const CONTINUE = 'continue'

// TODO(mc, 2020-05-07): move render logic to `state.alerts`
export function AnalyticsSettingsModal(): React.Node {
  const dispatch = useDispatch<Dispatch>()
  const seen = useSelector(getAnalyticsOptInSeen)
  const setSeen = () => dispatch(setAnalyticsOptInSeen())

  return (
    !seen && (
      <Portal>
        <Modal onCloseClick={setSeen} heading={TITLE} alertOverlay>
          <AnalyticsToggle />
          <ModalButton onClick={setSeen}>{CONTINUE}</ModalButton>
        </Modal>
      </Portal>
    )
  )
}
