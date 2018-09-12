// @flow
import * as React from 'react'
import {connect} from 'react-redux'

import type {State, Dispatch} from '../../types'
import {toggleAnalyticsOptedIn, getAnalyticsOptedIn} from '../../analytics'
import {LabeledToggle} from '../controls'

type SP = {
  optedIn: boolean,
}

type DP = {
  toggleOptedIn: () => mixed,
}

type Props = SP & DP

export default connect(mapStateToProps, mapDispatchToProps)(AnalyticsToggle)

function AnalyticsToggle (props: Props) {
  return (
    <LabeledToggle
      label='Share robot & app analytics with Opentrons'
      toggledOn={props.optedIn}
      onClick={props.toggleOptedIn}
    >
      <p>
        Help Opentrons improve its products and services by automatically sending anonymous diagnostic and usage data.
      </p>
      <p>
        This will allow us to learn things such as which features get used the most, which parts of the process are taking longest to complete, and how errors are generated. You can change this setting at any time.
      </p>
    </LabeledToggle>
  )
}

function mapStateToProps (state: State): SP {
  return {
    optedIn: getAnalyticsOptedIn(state),
  }
}

function mapDispatchToProps (dispatch: Dispatch): DP {
  return {
    toggleOptedIn: () => dispatch(toggleAnalyticsOptedIn()),
  }
}
