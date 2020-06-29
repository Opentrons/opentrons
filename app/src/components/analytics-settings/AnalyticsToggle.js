// @flow
import { LabeledToggle } from '@opentrons/components'
import * as React from 'react'
import { connect } from 'react-redux'

import { getAnalyticsOptedIn, toggleAnalyticsOptedIn } from '../../analytics'
import type { Dispatch, State } from '../../types'

type OP = {||}

type SP = {| optedIn: boolean |}

type DP = {| toggleOptedIn: () => mixed |}

type Props = {| ...SP, ...DP |}

export const AnalyticsToggle: React.AbstractComponent<OP> = connect<
  Props,
  OP,
  SP,
  DP,
  _,
  _
>(
  mapStateToProps,
  mapDispatchToProps
)(AnalyticsToggleComponent)

function AnalyticsToggleComponent(props: Props) {
  return (
    <LabeledToggle
      label="Share robot & app analytics with Opentrons"
      toggledOn={props.optedIn}
      onClick={props.toggleOptedIn}
    >
      <p>
        Help Opentrons improve its products and services by automatically
        sending anonymous diagnostic and usage data.
      </p>
      <p>
        This will allow us to learn things such as which features get used the
        most, which parts of the process are taking longest to complete, and how
        errors are generated. You can change this setting at any time.
      </p>
    </LabeledToggle>
  )
}

function mapStateToProps(state: State): SP {
  return {
    optedIn: getAnalyticsOptedIn(state),
  }
}

function mapDispatchToProps(dispatch: Dispatch): DP {
  return {
    toggleOptedIn: () => dispatch(toggleAnalyticsOptedIn()),
  }
}
