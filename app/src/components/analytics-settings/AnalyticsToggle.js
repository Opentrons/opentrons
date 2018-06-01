// @flow
import * as React from 'react'
import {connect} from 'react-redux'

import type {State, Dispatch} from '../../types'
import {toggleAnalyticsOptedIn, getAnalyticsOptedIn} from '../../analytics'
import LabeledToggle from './LabeledToggle'

type SP = {
  optedIn: boolean
}

type DP = {
  toggleOptedIn: () => mixed
}

type Props = SP & DP

export default connect(mapStateToProps, mapDispatchToProps)(AnalyticsToggle)

function AnalyticsToggle (props: Props) {
  return (
    <LabeledToggle
      label='Share robot & app analytics with Opentrons'
      toggledOn={props.optedIn}
      onClick={props.toggleOptedIn}
    />
  )
}

function mapStateToProps (state: State): SP {
  return {
    optedIn: getAnalyticsOptedIn(state)
  }
}

function mapDispatchToProps (dispatch: Dispatch): DP {
  return {
    toggleOptedIn: () => dispatch(toggleAnalyticsOptedIn())
  }
}
