// Page for /more/network-and-system
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import { Page } from '../../atoms/Page'
import { NetworkSettingsCard } from './NetworkSettingsCard'
import { SystemInfoCard } from './SystemInfoCard'

const CARD_GRID_STYLE = css`
  padding: 1.5rem 1.5rem 0.75rem 1.5rem;

  & > * {
    margin-bottom: 0.75rem;
  }
`

export const NetworkAndSystem = (): JSX.Element => {
  const { t } = useTranslation('more_network_and_system')

  return (
    <Page titleBarProps={{ title: t('network_and_system_title') }}>
      <div css={CARD_GRID_STYLE}>
        <NetworkSettingsCard />
        <SystemInfoCard />
      </div>
    </Page>
  )
}
