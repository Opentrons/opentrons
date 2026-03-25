import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { Navigation } from '/app/organisms/ODD/Navigation'
import {
  EmptyRecentRun,
  RecentRunProtocolCarousel,
} from '/app/organisms/ODD/RobotDashboard'
import { ServerInitializing } from '/app/organisms/ODD/RobotDashboard/ServerInitializing'
import { getOnDeviceDisplaySettings } from '/app/redux/config'
import { useNotifyAllRunsQuery } from '/app/resources/runs'

import { WelcomeModal } from './WelcomeModal'

import type { RunData } from '@opentrons/api-client'

export const MAXIMUM_RECENT_RUN_PROTOCOLS = 8

export function RobotDashboard(): JSX.Element {
  const { t } = useTranslation('device_details')
  const { data: allRunsQueryData, error: allRunsQueryError } =
    useNotifyAllRunsQuery()

  const { unfinishedUnboxingFlowRoute } = useSelector(
    getOnDeviceDisplaySettings
  )
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(
    unfinishedUnboxingFlowRoute !== null
  )

  const recentRunsOfUniqueProtocols = useMemo(() => {
    const runs = allRunsQueryData?.data ?? []
    const seenProtocolIds = new Set<string>()
    const result: RunData[] = []
    for (let i = runs.length - 1; i >= 0; i--) {
      const run = runs[i]
      if (seenProtocolIds.has(run.protocolId!)) continue

      seenProtocolIds.add(run.protocolId!)
      result.push(run)

      if (result.length === MAXIMUM_RECENT_RUN_PROTOCOLS) break
    }

    return result
  }, [allRunsQueryData?.data])

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
          forwardedAs="p"
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
