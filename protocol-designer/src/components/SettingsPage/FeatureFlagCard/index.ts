import * as React from 'react'
import { connect } from 'react-redux'
import { FeatureFlagCard as FeatureFlagCardComponent } from './FeatureFlagCard'
import {
  actions as featureFlagActions,
  selectors as featureFlagSelectors,
} from '../../../feature-flags'
import { Dispatch } from 'redux'
import { BaseState } from '../../../types'
type Props = React.ComponentProps<typeof FeatureFlagCardComponent>
interface SP {
  flags: Props['flags']
}
interface DP {
  setFeatureFlags: Props['setFeatureFlags']
}

const mapStateToProps = (state: BaseState): SP => ({
  flags: featureFlagSelectors.getFeatureFlagData(state),
})

const mapDispatchToProps = (dispatch: Dispatch<any>): DP => ({
  setFeatureFlags: flags => dispatch(featureFlagActions.setFeatureFlags(flags)),
})

export const FeatureFlagCard = connect(
  mapStateToProps,
  mapDispatchToProps
)(FeatureFlagCardComponent)
