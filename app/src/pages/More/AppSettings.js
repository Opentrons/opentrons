// @flow
// view info about the app and update
import * as React from 'react'

import { SPACING_3, Box } from '@opentrons/components'
import { Page } from '../../components/Page'
import { AnalyticsSettingsCard } from '../../components/analytics-settings'
import {
  AppSoftwareSettingsCard,
  AppAdvancedSettingsCard,
} from '../../components/app-settings'

export function AppSettings(): React.Node {
  return (
    <Page titleBarProps={{ title: 'App' }}>
      <Box margin={SPACING_3}>
        <AppSoftwareSettingsCard />
      </Box>
      <Box margin={SPACING_3}>
        <AnalyticsSettingsCard />
      </Box>
      <Box margin={SPACING_3}>
        <AppAdvancedSettingsCard />
      </Box>
    </Page>
  )
}
