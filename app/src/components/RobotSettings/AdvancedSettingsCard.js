// @flow
// app info card with version and updated
import * as React from 'react'
import {connect} from 'react-redux'

import type {State, Dispatch} from '../../types'
import type {Robot} from '../../robot'
import type {Setting} from '../../http-api-client'
import {fetchSettings, setSettings, makeGetRobotSettings} from '../../http-api-client'

import {IntervalWrapper, Card} from '@opentrons/components'
import {LabeledButton, LabeledToggle} from '../controls'

type OP = Robot

type SP = {settings: Array<Setting>}

type DP = {
  fetch: () => mixed,
  set: (id: string, value: boolean) => mixed,
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
  const {settings, set, fetch} = props

  return (
    <IntervalWrapper
      refresh={fetch}
      interval={1000}
    >
      <Card title={TITLE} column>
        {settings.map(s => (
          <BooleanSettingToggle {...s} key={s.id} set={set} />
        ))}
        <LabeledButton
          label='Download Logs'
          buttonProps={{
            disabled: true,
            children: 'Download'
          }}
        >
          <p>Access logs from this robot.</p>
        </LabeledButton>
      </Card>
    </IntervalWrapper>
  )
}

function makeMapStateToProps (): (state: State, ownProps: OP) => SP {
  const getRobotSettings = makeGetRobotSettings()

  return (state, ownProps) =>
    getRobotSettings(state, ownProps).response || {settings: []}
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  return {
    fetch: () => dispatch(fetchSettings(ownProps)),
    set: (id, value) => dispatch(setSettings(ownProps, id, value))
  }
}
