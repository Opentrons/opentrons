import * as React from 'react'
import { connect, MapStateToProps, MapDispatchToProps } from 'react-redux'
import { LabeledToggle } from '@opentrons/components'

import {
  toggleAnalyticsOptedIn,
  getAnalyticsOptedIn,
} from '../../redux/analytics'

import type { State } from '../../redux/types'

interface SP {
  optedIn: boolean
}

interface DP {
  toggleOptedIn: () => unknown
}

type Props = SP & DP

function AnalyticsToggleComponent(props: Props): JSX.Element {
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

const mapStateToProps: MapStateToProps<SP, {}, State> = state => {
  return {
    optedIn: getAnalyticsOptedIn(state),
  }
}

const mapDispatchToProps: MapDispatchToProps<DP, {}> = dispatch => {
  return {
    toggleOptedIn: () => dispatch(toggleAnalyticsOptedIn()),
  }
}

export const AnalyticsToggle = connect(
  mapStateToProps,
  mapDispatchToProps
)(AnalyticsToggleComponent)
