// @flow
import * as React from 'react'
import {connect} from 'react-redux'

import {getAnalyticsSeen, setAnalyticsSeen} from '../../analytics'

import {Modal} from '@opentrons/components'
import ModalButton from './ModalButton'
import AnalyticsToggle from './AnalyticsToggle'
import AnalyticsInfo from './AnalyticsInfo'

import type {State, Dispatch} from '../../types'

type SP = {
  seen: boolean,
}

type DP = {
  setSeen: () => mixed,
}

type Props = SP & DP

const TITLE = 'Privacy Settings'
const CONTINUE = 'continue'

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AnalyticsSettingsModal)

function AnalyticsSettingsModal (props: Props) {
  if (props.seen) return null

  const {setSeen} = props

  return (
    <Modal onCloseClick={setSeen} heading={TITLE} alertOverlay>
      <AnalyticsToggle />
      <AnalyticsInfo />
      <ModalButton onClick={setSeen}>
        {CONTINUE}
      </ModalButton>
    </Modal>
  )
}

function mapStateToProps (state: State): SP {
  return {
    seen: getAnalyticsSeen(state)
  }
}

function mapDispatchToProps (dispatch: Dispatch): DP {
  return {
    setSeen: () => dispatch(setAnalyticsSeen())
  }
}
