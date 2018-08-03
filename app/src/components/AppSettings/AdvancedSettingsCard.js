// @flow
// app info card with version and updated
import * as React from 'react'
import {connect} from 'react-redux'

import {getConfig, updateConfig, toggleDevTools} from '../../config'
import {Card} from '@opentrons/components'
import {LabeledToggle, LabeledSelect} from '../controls'

import type {State, Dispatch} from '../../types'
import type {UpdateChannel} from '../../config'

type OP = {
  checkForUpdates: () => mixed
}

type SP = {
  devToolsOn: boolean,
  channel: UpdateChannel
}

type DP = {
  toggleDevTools: () => mixed,
  handleChannel: (event: SyntheticInputEvent<HTMLSelectElement>) => mixed
}
type Props = SP & DP

const TITLE = 'Advanced Settings'

// TODO(mc, 2018-08-03): enable "alpha" option
const CHANNEL_OPTIONS = [
  {name: 'Stable', value: (('latest': UpdateChannel): string)},
  {name: 'Beta', value: (('beta': UpdateChannel): string)}
]

export default connect(mapStateToProps, mapDispatchToProps)(AdvancedSettingsCard)

function AdvancedSettingsCard (props: Props) {
  return (
    <Card title={TITLE} column>
      <LabeledSelect
        label='Update Channel'
        value={props.channel}
        options={CHANNEL_OPTIONS}
        onChange={props.handleChannel}
      >
        <p>
          Sets the update channel of your app. &quot;Stable&quot; will keep
          you on the latest stable release. The &quot;Beta&quot; channel will
          recieve updates more frequently so you can try out new features, but
          the releases may be less well tested than &quot;Stable&quot;.
        </p>
      </LabeledSelect>
      <LabeledToggle
        label='Enable Developer Tools'
        toggledOn={props.devToolsOn}
        onClick={props.toggleDevTools}
      >
        <p>
          Requires restart. Turns on the app&#39;s developer tools, which
          provide access to the inner workings of the app and additional
          logging.
        </p>
      </LabeledToggle>
    </Card>
  )
}

function mapStateToProps (state: State): SP {
  const config = getConfig(state)

  return {
    devToolsOn: config.devtools,
    channel: config.update.channel
  }
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP) {
  return {
    toggleDevTools: () => dispatch(toggleDevTools()),
    handleChannel: (event) => {
      dispatch(updateConfig('update.channel', event.target.value))

      // TODO(mc, 2018-08-03): refactor app update interface to be more
      // reactive and teach it to re-check on release channel change
      setTimeout(ownProps.checkForUpdates, 500)
    }
  }
}
