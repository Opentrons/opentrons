// @flow
// app status panel with connect button
import * as React from 'react'

import {AnalyticsSettingsCard} from '../analytics-settings'
import AdvancedSettingsCard from './AdvancedSettingsCard'
import AppInfoCard from './AppInfoCard'
import AppUpdateModal from './AppUpdateModal'
import {CardContainer, CardRow} from '../layout'

import type {ShellUpdateState} from '../../shell'

type Props = {
  update: ShellUpdateState,
  checkUpdate: () => mixed,
}

export default function AppSettings (props: Props) {
  return (
    <CardContainer>
      <CardRow>
        <AppInfoCard {...props}/>
      </CardRow>
      <CardRow>
        <AnalyticsSettingsCard {...props} />
      </CardRow>
      <CardRow>
        <AdvancedSettingsCard checkUpdate={props.checkUpdate} />
      </CardRow>
    </CardContainer>
  )
}

export {AppUpdateModal}
