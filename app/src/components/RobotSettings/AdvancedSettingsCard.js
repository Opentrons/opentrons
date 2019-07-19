// @flow
// app info card with version and updated
import * as React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import {
  fetchSettings,
  setSettings,
  getRobotSettingsState,
} from '../../robot-api'

import { getConfig } from '../../config'
import { CONNECTABLE } from '../../discovery'
import { downloadLogs } from '../../shell'
import { RefreshCard } from '@opentrons/components'
import { LabeledButton, LabeledToggle } from '../controls'

import type { State, Dispatch } from '../../types'
import type { ViewableRobot } from '../../discovery'
import type { RobotSettings } from '../../robot-api'
import UploadRobotUpdate from './UploadRobotUpdate'

type OP = {|
  robot: ViewableRobot,
  resetUrl: string,
|}

type SP = {|
  settings: RobotSettings,
  __buildRootEnabled: boolean,
|}

type DP = {|
  fetch: () => mixed,
  set: (id: string, value: boolean) => mixed,
  download: () => mixed,
|}

type Props = {| ...OP, ...SP, ...DP |}

type BooleanSettingProps = {|
  id: string,
  title: string,
  description: string,
  value: boolean | null,
  set: (id: string, value: boolean) => mixed,
|}

const TITLE = 'Advanced Settings'

class BooleanSettingToggle extends React.Component<BooleanSettingProps> {
  toggle = value => this.props.set(this.props.id, !this.props.value)

  render() {
    return (
      <LabeledToggle
        label={this.props.title}
        onClick={this.toggle}
        toggledOn={this.props.value === true}
      >
        <p>{this.props.description}</p>
      </LabeledToggle>
    )
  }
}

function AdvancedSettingsCard(props: Props) {
  const { robot, settings, set, fetch, download, resetUrl } = props
  const { name, health, status } = robot
  const disabled = status !== CONNECTABLE
  const logsAvailable = health && health.logs

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
      {settings.map(s => (
        <BooleanSettingToggle {...s} key={s.id} set={set} />
      ))}
      {props.__buildRootEnabled && <UploadRobotUpdate />}
    </RefreshCard>
  )
}

function mapStateToProps(state: State, ownProps: OP): SP {
  const { robot } = ownProps
  const settings = getRobotSettingsState(state, robot.name)

  return {
    settings: settings,
    __buildRootEnabled: Boolean(getConfig(state).devInternal?.enableBuildRoot),
  }
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  const { robot } = ownProps

  return {
    fetch: () => dispatch(fetchSettings(robot)),
    set: (id, value) => dispatch(setSettings(robot, { id, value })),
    download: () => dispatch(downloadLogs(robot)),
  }
}

export default connect<Props, OP, SP, DP, State, Dispatch>(
  mapStateToProps,
  mapDispatchToProps
)(AdvancedSettingsCard)
