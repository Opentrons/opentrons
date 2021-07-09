import { connect } from 'react-redux'
import {
  FeatureFlagCard as FeatureFlagCardComponent,
  Props as FeatureFlagCardProps,
} from './FeatureFlagCard'
import {
  actions as featureFlagActions,
  selectors as featureFlagSelectors,
} from '../../../feature-flags'
import { Dispatch } from 'redux'
import { BaseState } from '../../../types'
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
