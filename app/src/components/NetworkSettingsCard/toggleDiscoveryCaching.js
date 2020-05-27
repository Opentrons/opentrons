// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { LabeledToggle } from '@opentrons/components'
import type { State, Dispatch } from '../../types'
import { getConfig, toggleDiscoveryCache } from '../../config'

type OP = {||}

type SP = {| cacheDisabled: boolean |}

type DP = {| toggleCacheDisable: () => mixed |}

type Props = {| ...SP, ...DP |}

export const CachingToggle = connect<Props, OP, _, _, _, _>(
  mapStateToProps,
  mapDispatchToProps
)(CachingToggleComponent)

function CachingToggleComponent(props: Props) {
  return (
    <LabeledToggle
      label="Disable robot caching"
      toggledOn={props.cacheDisabled}
      onClick={props.toggleCacheDisable}
    >
      <p>
        Disable caching of discovered robots. The app will not remember
        previously discovered robots.
      </p>
    </LabeledToggle>
  )
}

function mapStateToProps(state: State): SP {
  const config = getConfig(state)

  return {
    cacheDisabled: config.discovery.disableCache,
  }
}

function mapDispatchToProps(dispatch: Dispatch): DP {
  return {
    toggleCacheDisable: () => dispatch(toggleDiscoveryCache()),
  }
}
