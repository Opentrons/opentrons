// @flow
import { connect } from 'react-redux'
import FeatureFlagCard from './FeatureFlagCard'
import {
  actions as featureFlagActions,
  selectors as featureFlagSelectors,
} from '../../../feature-flags'

import type { Dispatch } from 'redux'
import type { ElementProps } from 'react'
import type { BaseState } from '../../../types'

type Props = ElementProps<typeof FeatureFlagCard>

type SP = {| flags: $PropertyType<Props, 'flags'> |}
type DP = {| setFeatureFlags: $PropertyType<Props, 'setFeatureFlags'> |}

const mapStateToProps = (state: BaseState): SP => ({
  flags: featureFlagSelectors.getFeatureFlagData(state),
})

const mapDispatchToProps = (dispatch: Dispatch<*>): DP => ({
  setFeatureFlags: flags => dispatch(featureFlagActions.setFeatureFlags(flags)),
})

export default connect<Props, {||}, SP, DP, BaseState, _>(
  mapStateToProps,
  mapDispatchToProps
)(FeatureFlagCard)
