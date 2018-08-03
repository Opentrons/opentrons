// @flow
// app status panel with connect button
import * as React from 'react'
import type {ShellUpdate} from '../../shell'
import {AnalyticsSettingsCard} from '../analytics-settings'
import AdvancedSettingsCard from './AdvancedSettingsCard'
import AppInfoCard from './AppInfoCard'
import AppUpdateModal from './AppUpdateModal'

import {CardContainer, CardRow} from '../layout'

type Props = {
  update: ShellUpdate,
  checkForUpdates: () => mixed,
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
        <AdvancedSettingsCard checkForUpdates={props.checkForUpdates} />
      </CardRow>
    </CardContainer>
  )
}

export {AppUpdateModal}
