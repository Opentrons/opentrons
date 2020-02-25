// @flow
// app info card with version and updated
import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, Route, Link } from 'react-router-dom'
import startCase from 'lodash/startCase'

import {
  getConfig,
  getUpdateChannelOptions,
  updateConfig,
  toggleDevTools,
  toggleDevInternalFlag,
  DEV_INTERNAL_FLAGS,
} from '../../config'

import {
  Card,
  LabeledToggle,
  LabeledSelect,
  LabeledButton,
} from '@opentrons/components'

import { AddManualIp } from './AddManualIp'

import type { ContextRouter } from 'react-router-dom'
import type { DropdownOption } from '@opentrons/components'
import type { State, Dispatch } from '../../types'
import type { Config, DevInternalFlag, UpdateChannel } from '../../config/types'

type OP = {|
  ...ContextRouter,
  checkUpdate: () => mixed,
|}

type SP = {|
  devToolsOn: boolean,
  devInternal: $PropertyType<Config, 'devInternal'>,
  channel: UpdateChannel,
  channelOptions: Array<DropdownOption>,
|}

type DP = {|
  toggleDevTools: () => mixed,
  toggleDevInternalFlag: DevInternalFlag => mixed,
  handleChannel: (event: SyntheticInputEvent<HTMLSelectElement>) => mixed,
|}

type Props = {| ...OP, ...SP, ...DP |}

const TITLE = 'Advanced Settings'

export const AdvancedSettingsCard = withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(AdvancedSettingsCardComponent)
)

function AdvancedSettingsCardComponent(props: Props) {
  return (
    <>
      <Card title={TITLE}>
        <LabeledSelect
          label="Update Channel"
          value={props.channel}
          options={props.channelOptions}
          onChange={props.handleChannel}
        >
          <p>
            Sets the update channel of your app. &quot;Stable&quot; receives the
            latest stable releases. &quot;Beta&quot; is updated more frequently
            so you can try out new features, but the releases may be less well
            tested than &quot;Stable&quot;.
          </p>
        </LabeledSelect>
        <LabeledToggle
          label="Enable Developer Tools"
          toggledOn={props.devToolsOn}
          onClick={props.toggleDevTools}
        >
          <p>
            Requires restart. Turns on the app&#39;s developer tools, which
            provide access to the inner workings of the app and additional
            logging.
          </p>
        </LabeledToggle>
        <LabeledButton
          label="Manually Add Robot Network Addresses"
          buttonProps={{
            Component: Link,
            children: 'manage',
            to: `${props.match.url}/add-ip`,
          }}
        >
          <p>
            If your app is unable to automatically discover your robot, you can
            manually add its IP address or hostname here
          </p>
        </LabeledButton>
        {props.devToolsOn &&
          DEV_INTERNAL_FLAGS.map(flag => (
            <LabeledToggle
              key={flag}
              label={`__DEV__ ${startCase(flag)}`}
              toggledOn={Boolean(props.devInternal?.[flag])}
              onClick={() => props.toggleDevInternalFlag(flag)}
            />
          ))}
      </Card>
      <Route
        path={`${props.match.path}/add-ip`}
        render={() => <AddManualIp backUrl={props.match.url} />}
      />
    </>
  )
}

function mapStateToProps(state: State): SP {
  const config = getConfig(state)

  return {
    devToolsOn: config.devtools,
    devInternal: config.devInternal,
    channel: config.update.channel,
    channelOptions: getUpdateChannelOptions(state),
  }
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  return {
    toggleDevTools: () => dispatch(toggleDevTools()),
    toggleDevInternalFlag: (flag: DevInternalFlag) =>
      dispatch(toggleDevInternalFlag(flag)),
    handleChannel: event => {
      dispatch(updateConfig('update.channel', event.target.value))

      // TODO(mc, 2018-08-03): refactor app update interface to be more
      // reactive and teach it to re-check on release channel change
      setTimeout(ownProps.checkUpdate, 500)
    },
  }
}
