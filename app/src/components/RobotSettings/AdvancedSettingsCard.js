// @flow
// app info card with version and updated
import * as React from 'react'
import {connect} from 'react-redux'
import {Link} from 'react-router-dom'
import {reduce, get} from 'lodash'

import {
  fetchSettings,
  setSettings,
  makeGetRobotSettings,
} from '../../http-api-client'
import {getConfig, updateConfig} from '../../config'
import {CONNECTABLE} from '../../discovery'
import {downloadLogs} from '../../shell'
import {RefreshCard} from '@opentrons/components'
import {LabeledButton, LabeledToggle} from '../controls'
import OptInPipetteModal from './OptInPipetteModal'

import type {State, Dispatch} from '../../types'
import type {ViewableRobot} from '../../discovery'
import type {Setting} from '../../http-api-client'

type OP = {
  robot: ViewableRobot,
  resetUrl: string,
}

type SP = {|
  settings: Array<Setting>,
  showP10Warning: boolean,
|}

type DP = {|
  fetch: () => mixed,
  set: (id: string, value: boolean) => mixed,
  download: () => mixed,
  setP10WarningSeen: () => mixed,
|}

type Props = {...$Exact<OP>, ...SP, ...DP}

type BooleanSettingProps = {
  id: string,
  title: string,
  description: string,
  value: boolean,
  set: (id: string, value: boolean) => mixed,
}

const TITLE = 'Advanced Settings'
const P10_OPT_IN_SETTING_ID = 'useNewP10Aspiration'

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
  const {
    settings,
    set,
    fetch,
    download,
    resetUrl,
    showP10Warning,
    setP10WarningSeen,
  } = props
  const {name, health, status} = props.robot
  const disabled = status !== CONNECTABLE
  const logsAvailable = health && health.logs
  const setP10Setting = () => set(P10_OPT_IN_SETTING_ID, true)
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
      {showP10Warning && (
        <OptInPipetteModal
          setP10Setting={setP10Setting}
          setP10WarningSeen={setP10WarningSeen}
        />
      )}
      {settings.map(s => <BooleanSettingToggle {...s} key={s.id} set={set} />)}
    </RefreshCard>
  )
}

const seenP10WarningConfigPath = (name: string) => `p10WarningSeen.${name}`

function makeMapStateToProps (): (state: State, ownProps: OP) => SP {
  const getRobotSettings = makeGetRobotSettings()

  return (state, ownProps) => {
    const {robot} = ownProps
    const config = getConfig(state)
    const settingsRequest = getRobotSettings(state, robot)
    const settings =
      settingsRequest &&
      settingsRequest.response &&
      settingsRequest.response.settings

    const p10OptedIn = reduce(
      settings,
      (result, setting) => {
        if (setting.id === P10_OPT_IN_SETTING_ID) return setting.value
        return result
      },
      null
    )

    const seenP10Warning = get(config, seenP10WarningConfigPath(robot.name))

    return {
      settings: settings || [],
      showP10Warning: !seenP10Warning && p10OptedIn === false,
    }
  }
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  const {robot} = ownProps
  const setP10WarningSeen = () =>
    dispatch(updateConfig(seenP10WarningConfigPath(robot.name), true))
  return {
    fetch: () => dispatch(fetchSettings(robot)),
    set: (id, value) => {
      if (id === P10_OPT_IN_SETTING_ID) {
        setP10WarningSeen()
      }
      dispatch(setSettings(robot, {id, value}))
    },
    download: () => dispatch(downloadLogs(robot)),
    setP10WarningSeen,
  }
}
