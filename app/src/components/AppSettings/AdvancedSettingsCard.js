// @flow
// app info card with version and updated
import * as React from 'react'
import {connect} from 'react-redux'

import type {State, Dispatch} from '../../types'
import {getDevToolsOn, toggleDevTools} from '../../config'
import {Card} from '@opentrons/components'
import {LabeledToggle, ToggleInfo} from '../toggles'

type SP = {
  devToolsOn: boolean,
}

type DP = {
  toggleDevTools: () => mixed
}
type Props = SP & DP

const TITLE = 'Advanced Settings'

export default connect(mapStateToProps, mapDispatchToProps)(AdvancedSettingsCard)

function AdvancedSettingsCard (props: Props) {
  return (
    <Card title={TITLE} column>
      <LabeledToggle
        label='Enable Developer Tools'
        toggledOn={props.devToolsOn}
        onClick={props.toggleDevTools}
      />
      <ToggleInfo>
        <p>Requires restart. Turns on the app&#39;s developer tools, which provide access to the inner workings of the app and additional logging.</p>
      </ToggleInfo>
    </Card>
  )
}

function mapStateToProps (state: State): SP {
  return {
    devToolsOn: getDevToolsOn(state)
  }
}

function mapDispatchToProps (dispatch: Dispatch) {
  return {
    toggleDevTools: () => dispatch(toggleDevTools())
  }
}
