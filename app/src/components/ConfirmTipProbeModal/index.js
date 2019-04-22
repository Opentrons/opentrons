// @flow
// container to prompt the user to clear the deck before continuing tip probe
import * as React from 'react'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'

import { actions as robotActions, type Mount } from '../../robot'
import { ContinueModal } from '@opentrons/components'
import { Portal } from '../portal'
import Contents from './Contents'

import type { Dispatch } from '../../types'

type OP = {| mount: Mount, backUrl: string |}

type DP = {| onContinueClick: () => void, onCancelClick: () => void |}

type Props = { ...OP, ...DP }

export default connect<Props, OP, {||}, DP, _, Dispatch>(
  null,
  mapDispatchToProps
)(ContinueTipProbeModal)

function ContinueTipProbeModal(props: Props) {
  return (
    <Portal>
      <ContinueModal
        onContinueClick={props.onContinueClick}
        onCancelClick={props.onCancelClick}
      >
        <Contents />
      </ContinueModal>
    </Portal>
  )
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  const { mount, backUrl } = ownProps

  return {
    // TODO(mc, 2018-01-23): refactor to remove double dispatch
    onContinueClick: () => {
      // $FlowFixMe: robotActions.moveToFront is not typed
      dispatch(robotActions.moveToFront(mount))
      dispatch(push(backUrl))
    },
    // $FlowFixMe: react-router-redux action creators are not typed
    onCancelClick: () => dispatch(push(backUrl)),
  }
}
