// @flow
// app status panel with connect button
import * as React from 'react'

import { AnalyticsSettingsCard } from '../analytics-settings'
import { AdvancedSettingsCard } from './AdvancedSettingsCard'
import { AppInfoCard } from './AppInfoCard'
import { CardContainer, CardRow } from '../layout'

export type AppSettingsProps = {|
  availableVersion: ?string,
  checkUpdate: () => mixed,
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
