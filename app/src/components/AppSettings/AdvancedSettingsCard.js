// @flow
// app info card with version and updated
import type { DropdownOption } from '@opentrons/components'
import { Card, LabeledSelect, LabeledToggle } from '@opentrons/components'
import startCase from 'lodash/startCase'
import * as React from 'react'
import { connect } from 'react-redux'
import type { ContextRouter } from 'react-router-dom'
import { withRouter } from 'react-router-dom'

import {
  DEV_INTERNAL_FLAGS,
  getDevtoolsEnabled,
  getFeatureFlags,
  getUpdateChannel,
  getUpdateChannelOptions,
  toggleDevInternalFlag,
  toggleDevtools,
  updateConfigValue,
} from '../../config'
import type { Config, DevInternalFlag, UpdateChannel } from '../../config/types'
import type { Dispatch, State } from '../../types'

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
  toggleDevtools: () => mixed,
  toggleDevInternalFlag: DevInternalFlag => mixed,
  handleChannel: (event: SyntheticInputEvent<HTMLSelectElement>) => mixed,
|}

type Props = {| ...OP, ...SP, ...DP |}

const TITLE = 'Advanced Settings'

export const AdvancedSettingsCard: React.AbstractComponent<
  $Diff<OP, ContextRouter>
> = withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(AdvancedSettingsCardComponent)
)

function AdvancedSettingsCardComponent(props: Props) {
  return (
    <Card title={TITLE}>
      <LabeledSelect
        label="Update Channel"
        value={props.channel}
        options={props.channelOptions}
        onChange={props.handleChannel}
      >
        <p>
          Sets the update channel of your app. &quot;Stable&quot; receives the
          latest stable releases. &quot;Beta&quot; is updated more frequently so
          you can try out new features, but the releases may be less well tested
          than &quot;Stable&quot;.
        </p>
      </LabeledSelect>
      <LabeledToggle
        label="Enable Developer Tools"
        toggledOn={props.devToolsOn}
        onClick={props.toggleDevtools}
      >
        <p>
          Requires restart. Turns on the app&#39;s developer tools, which
          provide access to the inner workings of the app and additional
          logging.
        </p>
      </LabeledToggle>
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
  )
}

function mapStateToProps(state: State): SP {
  return {
    devToolsOn: getDevtoolsEnabled(state),
    devInternal: getFeatureFlags(state),
    channel: getUpdateChannel(state),
    channelOptions: getUpdateChannelOptions(state),
  }
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  return {
    toggleDevtools: () => dispatch(toggleDevtools()),
    toggleDevInternalFlag: (flag: DevInternalFlag) =>
      dispatch(toggleDevInternalFlag(flag)),
    handleChannel: event => {
      dispatch(updateConfigValue('update.channel', event.target.value))

      // TODO(mc, 2018-08-03): refactor app update interface to be more
      // reactive and teach it to re-check on release channel change
      setTimeout(ownProps.checkUpdate, 500)
    },
  }
}
