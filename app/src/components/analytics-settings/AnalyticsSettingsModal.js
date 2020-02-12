// @flow
import * as React from 'react'
import { connect } from 'react-redux'

import { getAnalyticsSeen, setAnalyticsSeen } from '../../analytics'

import { Modal } from '@opentrons/components'
import { ModalButton } from './ModalButton'
import { AnalyticsToggle } from './AnalyticsToggle'
import { Portal } from '../portal'
import type { State, Dispatch } from '../../types'

type OP = {||}

type SP = {| seen: boolean |}

type DP = {| setSeen: () => mixed |}

type Props = {| ...SP, ...DP |}

const TITLE = 'Privacy Settings'
const CONTINUE = 'continue'

export const AnalyticsSettingsModal = connect<Props, OP, _, _, _, _>(
  mapStateToProps,
  mapDispatchToProps
)(AnalyticsSettingsModalComponent)

function AnalyticsSettingsModalComponent(props: Props) {
  if (props.seen) return null

  const { setSeen } = props

  return (
    <Portal>
      <Modal onCloseClick={setSeen} heading={TITLE} alertOverlay>
        <AnalyticsToggle />
        <ModalButton onClick={setSeen}>{CONTINUE}</ModalButton>
      </Modal>
    </Portal>
  )
}

function mapStateToProps(state: State): SP {
  return {
    seen: getAnalyticsSeen(state),
  }
}

function mapDispatchToProps(dispatch: Dispatch): DP {
  return {
    setSeen: () => dispatch(setAnalyticsSeen()),
  }
}
