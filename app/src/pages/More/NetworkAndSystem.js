// @flow
// Page for /more/network-and-system
import * as React from 'react'
import { css } from 'styled-components'
import { Box, C_WHITE } from '@opentrons/components'

import { Page } from '../../components/Page'
import { NetworkSettingsCard } from '../../components/NetworkSettingsCard'
import { SystemInfoCard } from '../../components/SystemInfoCard'

// TODO(mc, 2020-04-27): i18n
const NETWORK_AND_SYSTEM = 'Network & System'

const CARD_GRID_STYLE = css`
  padding: 1.5rem 1.5rem 0.75rem 1.5rem;

  & > * {
    margin-bottom: 0.75rem;
  }
`

export const NetworkAndSystem = (): React.Node => (
  <Page titleBarProps={{ title: NETWORK_AND_SYSTEM }}>
    <Box color={'default-text'} css={CARD_GRID_STYLE}>
      <NetworkSettingsCard />
      <SystemInfoCard />
    </Box>
  </Page>
)
