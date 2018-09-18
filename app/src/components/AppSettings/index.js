// @flow
// app status panel with connect button
import * as React from 'react'

import {AnalyticsSettingsCard} from '../analytics-settings'
import AdvancedSettingsCard from './AdvancedSettingsCard'
import AppInfoCard from './AppInfoCard'
import AppUpdateModal from './AppUpdateModal'
import {CardContainer, CardRow} from '../layout'

type Props = {
  availableVersion: ?string,
  checkUpdate: () => mixed,
}

export default function AppSettings (props: Props) {
  return (
    <CardContainer>
      <CardRow>
        <AppInfoCard
          availableVersion={props.availableVersion}
          checkUpdate={props.checkUpdate}
        />
      </CardRow>
      <CardRow>
        <AnalyticsSettingsCard />
      </CardRow>
      <CardRow>
        <AdvancedSettingsCard checkUpdate={props.checkUpdate} />
      </CardRow>
    </CardContainer>
  )
}

export {AppUpdateModal}
