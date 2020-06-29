// @flow
import { Card } from '@opentrons/components'
import * as React from 'react'

import { U2EAdapterInfo } from './U2EAdapterInfo'

// TODO(mc, 2020-04-27): i18n
const SYSTEM_INFORMATION = 'System Information'

export const SystemInfoCard = (): React.Node => (
  <Card title={SYSTEM_INFORMATION}>
    <U2EAdapterInfo />
  </Card>
)
