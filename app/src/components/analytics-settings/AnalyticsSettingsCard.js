// @flow
// info on analytics data collected and toggle to opt in/out
import * as React from 'react'

import {Card} from '@opentrons/components'
import AnalyticsToggle from './AnalyticsToggle'

const TITLE = 'Privacy Settings'

export default function AnalyticsSettingsCard () {
  return (
    <Card title={TITLE} column>
      <AnalyticsToggle />
    </Card>
  )
}
