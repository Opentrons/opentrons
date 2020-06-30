// @flow
// app status panel with connect button
import * as React from 'react'

import { AnalyticsSettingsCard } from '../analytics-settings'
import { CardContainer, CardRow } from '../layout'
import { AdvancedSettingsCard } from './AdvancedSettingsCard'
import { AppInfoCard } from './AppInfoCard'

export type AppSettingsProps = {|
  availableVersion: ?string,
  checkUpdate: () => void,
|}

export function AppSettings(props: AppSettingsProps): React.Node {
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
