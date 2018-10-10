// @flow
// app info card with version and updated
import * as React from 'react'
import {connect} from 'react-redux'
import {Link} from 'react-router-dom'

import {
  fetchSettings,
  setSettings,
  makeGetRobotSettings,
} from '../../http-api-client'
import {CONNECTABLE} from '../../discovery'
import {downloadLogs} from '../../shell'
import {RefreshCard} from '@opentrons/components'
import {LabeledButton, LabeledToggle} from '../controls'

import type {State, Dispatch} from '../../types'
import type {ViewableRobot} from '../../discovery'
import type {Setting} from '../../http-api-client'

type OP = {robot: ViewableRobot}

type SP = {|settings: Array<Setting>|}

type DP = {|
  fetch: () => mixed,
  set: (id: string, value: boolean) => mixed,
  download: () => mixed,
|}

type Props = {
  ...$Exact<OP>,
  ...SP,
  ...DP,
}

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
  toggle = value => this.props.set(this.props.id, !this.props.value)

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
  const {settings, set, fetch, download} = props
  const {name, health, status} = props.robot
  const disabled = status !== CONNECTABLE
  const logsAvailable = health && health.logs
  const resetUrl = `/robots/${name}/reset`

  return (
    <RefreshCard
      watch={name}
      refresh={fetch}
      title={TITLE}
      disabled={disabled}
      column
    >
      <LabeledButton
        label="Download Logs"
        buttonProps={{
          disabled: disabled || !logsAvailable,
          onClick: download,
          children: 'Download',
        }}
      >
        <p>Access logs from this robot.</p>
      </LabeledButton>
      <LabeledButton
        label="Factory Reset"
        buttonProps={{
          disabled,
          Component: Link,
          to: resetUrl,
          children: 'Reset',
        }}
      >
        <p>Restore robot to factory configuration</p>
      </LabeledButton>
      {settings.map(s => <BooleanSettingToggle {...s} key={s.id} set={set} />)}
    </RefreshCard>
  )
}

function makeMapStateToProps (): (state: State, ownProps: OP) => SP {
  const getRobotSettings = makeGetRobotSettings()

  return (state, ownProps) => {
    const settingsRequest = getRobotSettings(state, ownProps.robot)
    const settings =
      settingsRequest &&
      settingsRequest.response &&
      settingsRequest.response.settings

    return {settings: settings || []}
  }
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  const {robot} = ownProps

  return {
    fetch: () => dispatch(fetchSettings(robot)),
    set: (id, value) => dispatch(setSettings(robot, {id, value})),
    download: () => dispatch(downloadLogs(robot)),
  }
}
