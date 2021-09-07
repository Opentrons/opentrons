// view info about the app and update
import * as React from 'react'

import { SPACING_3, Box } from '@opentrons/components'
import { Page } from '../../../atoms/Page'
import { AnalyticsSettingsCard } from './AnalyticsSettingsCard'
import { AppSoftwareSettingsCard } from './AppSoftwareSettingsCard'
import { AppAdvancedSettingsCard } from './AppAdvancedSettingsCard'

export function AppSettings(): JSX.Element {
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
