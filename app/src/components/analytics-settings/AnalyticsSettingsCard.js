// @flow
// info on analytics data collected and toggle to opt in/out
import { Card } from '@opentrons/components'
import * as React from 'react'

import { AnalyticsToggle } from './AnalyticsToggle'

const TITLE = 'Privacy Settings'

export function AnalyticsSettingsCard(): React.Node {
  return (
    <Card title={TITLE}>
      <AnalyticsToggle />
    </Card>
  )
}
