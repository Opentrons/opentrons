import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useAllProtocolsQuery } from '@opentrons/react-api-client'

import { Navigation } from '/app/organisms/ODD/Navigation'
import {
  EmptyRecentRun,
  RecentRunProtocolCarousel,
} from '/app/organisms/ODD/RobotDashboard'
import { getOnDeviceDisplaySettings } from '/app/redux/config'
import { WelcomeModal } from './WelcomeModal'
import { ServerInitializing } from '/app/organisms/ODD/RobotDashboard/ServerInitializing'
import { useNotifyAllRunsQuery } from '/app/resources/runs'
import type { RunData } from '@opentrons/api-client'

export const MAXIMUM_RECENT_RUN_PROTOCOLS = 8

export function RobotDashboard(): JSX.Element {
  const { t } = useTranslation('device_details')
  const {
    data: allRunsQueryData,
    error: allRunsQueryError,
  } = useNotifyAllRunsQuery()
  const protocols = useAllProtocolsQuery()

  const { unfinishedUnboxingFlowRoute } = useSelector(
    getOnDeviceDisplaySettings
  )
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(
    unfinishedUnboxingFlowRoute !== null
  )

  const recentRunsOfUniqueProtocols = (allRunsQueryData?.data ?? [])
    .reduceRight<RunData[]>((acc, run) => {
      if (
        acc.some(collectedRun => collectedRun.protocolId === run.protocolId)
      ) {
        return acc
      } else if (
        protocols?.data?.data.find(protocol => protocol.id === run.protocolId)
          ?.protocolKind === 'quick-transfer'
      ) {
        return acc
      } else {
        return [...acc, run]
      }
    }, [])
    .slice(0, MAXIMUM_RECENT_RUN_PROTOCOLS)

  let contents: JSX.Element = <EmptyRecentRun />
  // GET runs query will error with 503 if database is initializing
  // this should be momentary, and the type of error to come from this endpoint
  // so, all errors will be mapped to an initializing spinner
  if (allRunsQueryError?.code === '503') {
    contents = <ServerInitializing />
  } else if (recentRunsOfUniqueProtocols.length > 0) {
    contents = (
      <>
        <LegacyStyledText
          as="p"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          color={COLORS.grey60}
        >
          {t('run_again')}
        </LegacyStyledText>
        <RecentRunProtocolCarousel
          recentRunsOfUniqueProtocols={recentRunsOfUniqueProtocols}
        />
      </>
    )
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Navigation />
      <Flex
        paddingX={SPACING.spacing40}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing16}
      >
        {showWelcomeModal ? (
          <WelcomeModal setShowWelcomeModal={setShowWelcomeModal} />
        ) : null}
        {contents}
      </Flex>
    </Flex>
  )
}
