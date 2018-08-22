// @flow
// app info card with version and updated
import * as React from 'react'
import {connect} from 'react-redux'
import {Link} from 'react-router-dom'

import type {State, Dispatch} from '../../types'
import type {Robot} from '../../robot'
import type {Setting, RobotHealth} from '../../http-api-client'
import {fetchSettings, setSettings, makeGetRobotSettings, makeGetRobotHealth} from '../../http-api-client'
import {downloadLogs} from '../../shell'

import {RefreshCard} from '@opentrons/components'
import {LabeledButton, LabeledToggle} from '../controls'

type OP = Robot

type SP = {
  health: ?RobotHealth,
  settings: Array<Setting>,
}

type DP = {
  fetch: () => mixed,
  set: (id: string, value: boolean) => mixed,
  download: () => mixed,
}

type Props = OP & SP & DP

type BooleanSettingProps = {
  id: string,
  title: string,
  description: string,
  value: boolean,
  set: (id: string, value: boolean) => mixed,
}

const TITLE = 'Advanced Settings'

export default connect(
  makeMapStateToProps,
  mapDispatchToProps
)(AdvancedSettingsCard)

class BooleanSettingToggle extends React.Component<BooleanSettingProps> {
  toggle = (value) => this.props.set(this.props.id, !this.props.value)

  render () {
    return (
      <LabeledToggle
        label={this.props.title}
        onClick={this.toggle}
        toggledOn={this.props.value}
      >
        <p>{this.props.description}</p>
      </LabeledToggle>
    )
  }
}

function AdvancedSettingsCard (props: Props) {
  const {name, settings, set, fetch, download, health} = props
  const logsAvailable = health && health.response && health.response.logs
  const resetUrl = `/robots/${name}/reset`
  return (
    <RefreshCard watch={name} refresh={fetch} title={TITLE} column>
      <LabeledButton
        label='Download Logs'
        buttonProps={{
          disabled: !logsAvailable,
          onClick: download,
          children: 'Download'
        }}
      >
        <p>Access logs from this robot.</p>
      </LabeledButton>
      <LabeledButton
        label='Factory Reset'
        buttonProps={{
          component: Link,
          to: resetUrl,
          children: 'Reset'
        }}
      >
        <p>Restore robot to factory configuration</p>
      </LabeledButton>
      {settings.map(s => (
        <BooleanSettingToggle {...s} key={s.id} set={set} />
      ))}
    </RefreshCard>
  )
}

function makeMapStateToProps (): (state: State, ownProps: OP) => SP {
  const getRobotSettings = makeGetRobotSettings()
  const getRobotHealth = makeGetRobotHealth()

  return (state, ownProps) => {
    const settingsRequest = getRobotSettings(state, ownProps)
    const settings = settingsRequest && settingsRequest.response && settingsRequest.response.settings
    const health = getRobotHealth(state, ownProps)

    return {
      health,
      settings: settings || []
    }
  }
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  return {
    fetch: () => dispatch(fetchSettings(ownProps)),
    set: (id, value) => dispatch(setSettings(ownProps, id, value)),
    download: () => dispatch(downloadLogs(ownProps))
  }
}
