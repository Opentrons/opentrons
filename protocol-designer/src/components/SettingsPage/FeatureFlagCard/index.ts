import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import {
  actions as featureFlagActions,
  selectors as featureFlagSelectors,
} from '../../../feature-flags'
import { BaseState } from '../../../types'
import {
  FeatureFlagCard as FeatureFlagCardComponent,
  Props as FeatureFlagCardProps,
} from './FeatureFlagCard'

interface SP {
  flags: FeatureFlagCardProps['flags']
}
interface DP {
  setFeatureFlags: FeatureFlagCardProps['setFeatureFlags']
}

const mapStateToProps = (state: BaseState): SP => ({
  flags: featureFlagSelectors.getFeatureFlagData(state),
})

const mapDispatchToProps = (dispatch: Dispatch): DP => ({
  setFeatureFlags: flags => dispatch(featureFlagActions.setFeatureFlags(flags)),
})

export const FeatureFlagCard = connect(
  mapStateToProps,
  mapDispatchToProps
)(FeatureFlagCardComponent)
