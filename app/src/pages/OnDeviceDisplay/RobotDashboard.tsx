import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  useAllProtocolsQuery,
  useAllRunsQuery,
} from '@opentrons/react-api-client'

import { StyledText } from '../../atoms/text'
import { Navigation } from '../../organisms/OnDeviceDisplay/Navigation'
import { onDeviceDisplayRoutes } from '../../App/OnDeviceDisplayApp'
import {
  EmptyRecentRun,
  RecentRunProtocolCarousel,
} from '../../organisms/OnDeviceDisplay/RobotDashboard'
import { sortProtocols } from './ProtocolDashboard/utils'

export const MAXIMUM_RECENT_RUN_PROTOCOLS = 8 // This might be changed
const SORT_KEY = 'recentRun'

export function RobotDashboard(): JSX.Element {
  const { t } = useTranslation('device_details')
  const protocols = useAllProtocolsQuery()
  const runs = useAllRunsQuery()
  const protocolsData = protocols.data?.data ?? []
  const runData = runs.data?.data ?? []

  /** Currently the max number of displaying recent run protocol is 8 */
  const sortedProtocols =
    protocolsData.length > 0
      ? sortProtocols(SORT_KEY, protocolsData, runData).slice(
          0,
          MAXIMUM_RECENT_RUN_PROTOCOLS
        )
      : []

  return (
    <Flex paddingX={SPACING.spacing40} flexDirection={DIRECTION_COLUMN}>
      <Navigation routes={onDeviceDisplayRoutes} />
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
        {sortedProtocols.length === 0 ? (
          <EmptyRecentRun />
        ) : (
          <>
            <StyledText
              fontSize={TYPOGRAPHY.fontSize20}
              lineHeight={TYPOGRAPHY.lineHeight28}
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            >
              {t('run_again')}
            </StyledText>
            <RecentRunProtocolCarousel sortedProtocols={sortedProtocols} />
          </>
        )}
      </Flex>
    </Flex>
  )
}
