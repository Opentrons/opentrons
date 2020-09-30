// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { getAnalyticsOptInSeen, setAnalyticsOptInSeen } from '../../analytics'

import { Modal } from '@opentrons/components'
import { ModalButton } from './ModalButton'
import { AnalyticsToggle } from './AnalyticsToggle'
import { Portal } from '../portal'
import type { Dispatch } from '../../types'

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
