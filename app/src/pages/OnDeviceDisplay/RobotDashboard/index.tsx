import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  useAllProtocolsQuery,
  useAllRunsQuery,
} from '@opentrons/react-api-client'

import { StyledText } from '../../../atoms/text'
import { Navigation } from '../../../organisms/OnDeviceDisplay/Navigation'
import { onDeviceDisplayRoutes } from '../../../App/OnDeviceDisplayApp'
import {
  EmptyRecentRun,
  RecentRunProtocolCarousel,
} from '../../../organisms/OnDeviceDisplay/RobotDashboard'
import { getOnDeviceDisplaySettings } from '../../../redux/config'
import { sortProtocols } from '../ProtocolDashboard/utils'
import { WelcomedModal } from './WelcomeModal'

export const MAXIMUM_RECENT_RUN_PROTOCOLS = 8 // This might be changed
const SORT_KEY = 'recentRun'

export function RobotDashboard(): JSX.Element {
  const { t } = useTranslation('device_details')
  const protocols = useAllProtocolsQuery()
  const runs = useAllRunsQuery()
  const protocolsData = protocols.data?.data ?? []
  const runData = runs.data?.data ?? []
  const { unfinishedUnboxingFlowRoute } = useSelector(
    getOnDeviceDisplaySettings
  )
  const [showWelcomeModal, setShowWelcomeModal] = React.useState<boolean>(
    unfinishedUnboxingFlowRoute === '/robot-settings/rename-robot'
  )

  const recentlyRunProtocols = protocolsData.filter(protocol =>
    runData.some(run => run.protocolId === protocol.id)
  )

  /** Currently the max number of displaying recent run protocol is 8 */
  const sortedProtocols =
    recentlyRunProtocols.length > 0
      ? sortProtocols(SORT_KEY, recentlyRunProtocols, runData).slice(
          0,
          MAXIMUM_RECENT_RUN_PROTOCOLS
        )
      : []

  return (
    <Flex paddingX={SPACING.spacing40} flexDirection={DIRECTION_COLUMN}>
      <Navigation routes={onDeviceDisplayRoutes} />
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
        {showWelcomeModal ? (
          <WelcomedModal setShowWelcomeModal={setShowWelcomeModal} />
        ) : null}
        {sortedProtocols.length === 0 ? (
          <EmptyRecentRun />
        ) : (
          <>
            <StyledText
              as="p"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              color={COLORS.darkBlack70}
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
