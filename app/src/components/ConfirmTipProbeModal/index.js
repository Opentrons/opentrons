// @flow
// container to prompt the user to clear the deck before continuing tip probe
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'

import {actions as robotActions, type Mount} from '../../robot'
import {ContinueModal} from '@opentrons/components'
import {Portal} from '../portal'
import Contents from './Contents'

type OwnProps = {
  mount: Mount,
  backUrl: string
}

type Props = {
  onContinueClick: () => void,
  onCancelClick: () => void
}

export default connect(null, mapDispatchToProps)(ContinueTipProbeModal)

function ContinueTipProbeModal (props: Props) {
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

function mapDispatchToProps (dispatch: Dispatch<*>, ownProps: OwnProps) {
  const {mount, backUrl} = ownProps

  return {
    // TODO(mc, 2018-01-23): refactor to remove double dispatch
    onContinueClick: () => {
      dispatch(robotActions.moveToFront(mount))
      dispatch(push(backUrl))
    },
    onCancelClick: () => dispatch(push(backUrl))
  }
}
