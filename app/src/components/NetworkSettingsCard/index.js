// @flow
import * as React from 'react'

import { Card } from '@opentrons/components'
import { AddManualIp } from './AddManualIp'
import { ClearDiscoveryCache } from './ClearDiscoveryCache'
import { CachingToggle } from './toggleDiscoveryCaching'

// TODO(mc, 2020-04-27): i18n
const NETWORK_SETTINGS = 'Network Settings'

export const NetworkSettingsCard = () => (
  <Card title={NETWORK_SETTINGS}>
    <AddManualIp />
    <CachingToggle />
    <ClearDiscoveryCache />
  </Card>
)
