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
import { useAllRunsQuery } from '@opentrons/react-api-client'

import { StyledText } from '../../../atoms/text'
import { Navigation } from '../../../organisms/Navigation'
import { onDeviceDisplayRoutes } from '../../../App/OnDeviceDisplayApp'
import {
  EmptyRecentRun,
  RecentRunProtocolCarousel,
} from '../../../organisms/OnDeviceDisplay/RobotDashboard'
import { getOnDeviceDisplaySettings } from '../../../redux/config'
import { WelcomedModal } from './WelcomeModal'
import { RunData } from '@opentrons/api-client'

export const MAXIMUM_RECENT_RUN_PROTOCOLS = 8

export function RobotDashboard(): JSX.Element {
  const { t } = useTranslation('device_details')
  const allRuns = useAllRunsQuery().data?.data ?? []

  const { unfinishedUnboxingFlowRoute } = useSelector(
    getOnDeviceDisplaySettings
  )
  const [showWelcomeModal, setShowWelcomeModal] = React.useState<boolean>(
    unfinishedUnboxingFlowRoute !== null
  )

  const recentRunsOfUniqueProtocols = allRuns
    .reverse() // newest runs first
    .reduce<RunData[]>((acc, run) => {
      if (
        acc.some(collectedRun => collectedRun.protocolId === run.protocolId)
      ) {
        return acc
      } else {
        return [...acc, run]
      }
    }, [])
    .slice(0, MAXIMUM_RECENT_RUN_PROTOCOLS)

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Navigation routes={onDeviceDisplayRoutes} />
      <Flex
        paddingX={SPACING.spacing40}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing16}
      >
        {showWelcomeModal ? (
          <WelcomedModal setShowWelcomeModal={setShowWelcomeModal} />
        ) : null}
        {recentRunsOfUniqueProtocols.length === 0 ? (
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
            <RecentRunProtocolCarousel
              recentRunsOfUniqueProtocols={recentRunsOfUniqueProtocols}
            />
          </>
        )}
      </Flex>
    </Flex>
  )
}
