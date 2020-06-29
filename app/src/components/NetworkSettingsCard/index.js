// @flow
import { Card } from '@opentrons/components'
import * as React from 'react'

import { AddManualIp } from './AddManualIp'
import { ClearDiscoveryCache } from './ClearDiscoveryCache'
import { DisableDiscoveryCache } from './DisableDiscoveryCache'

// TODO(mc, 2020-04-27): i18n
const NETWORK_SETTINGS = 'Network Settings'

export const NetworkSettingsCard = (): React.Node => (
  <Card title={NETWORK_SETTINGS}>
    <AddManualIp />
    <DisableDiscoveryCache />
    <ClearDiscoveryCache />
  </Card>
)
