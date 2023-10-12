import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
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
import { AnalyticsOptInModal } from './AnalyticsOptInModal'
import { WelcomeModal } from './WelcomeModal'
import { RunData } from '@opentrons/api-client'
import { ServerInitializing } from '../../../organisms/OnDeviceDisplay/RobotDashboard/ServerInitializing'
import { css } from 'styled-components'

export const MAXIMUM_RECENT_RUN_PROTOCOLS = 8

const purples = {
  "purple70": "#3D1A48",
  "purple55": "#713187",
  "purple50": "#893BA4",
  "purple40": "#D0A8E0",
  "purple35": "#DBBCE7",
  "purple30": "#E6D5EC",
  "purple20": "#F1E8F5"
}

const greens = {
  "green70": "#024428",
  "green55": "#038C53",
  "green50": "#04AA65",
  "green35": "#AFEDD3",
  "green30": "#C4F6E0",
  "green20": "#E8F7ED",
}
export function RobotDashboard(): JSX.Element {
  return (
    <Flex 
    css={css`
      filter: hue-rotate(0deg) contrast(100%) brightness(100%);
    `}
    width="100vw" 
    flexDirection={DIRECTION_COLUMN}
    >
      <Flex>
        {Object.entries(purples).map(([name, hex]) => (
          <Flex
            key={hex}
            backgroundColor={hex}
            size="14rem"
            justifyContent={JUSTIFY_CENTER}
            marginBottom={SPACING.spacing32}
            alignItems={ALIGN_CENTER}>
            <StyledText as="p">{name}</StyledText>
          </Flex>
        ))}</Flex>
      <Flex>
        {Object.entries(greens).map(([name, hex]) => (
          <Flex
            key={hex}
            backgroundColor={hex}
            size="14rem"
            justifyContent={JUSTIFY_CENTER}
            marginBottom={SPACING.spacing32}
            alignItems={ALIGN_CENTER}>
            <StyledText as="p">{name}</StyledText>
          </Flex>
        ))}
      </Flex>
    </Flex>
  )
}

export function RobotDashboardtemp(): JSX.Element {
  const { t } = useTranslation('device_details')
  const { data: allRunsQueryData, error: allRunsQueryError } = useAllRunsQuery()

  const { unfinishedUnboxingFlowRoute } = useSelector(
    getOnDeviceDisplaySettings
  )
  const [showWelcomeModal, setShowWelcomeModal] = React.useState<boolean>(
    unfinishedUnboxingFlowRoute !== null
  )
  const [
    showAnalyticsOptInModal,
    setShowAnalyticsOptInModal,
  ] = React.useState<boolean>(false)

  const recentRunsOfUniqueProtocols = (allRunsQueryData?.data ?? [])
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

  let contents: JSX.Element = <EmptyRecentRun />
  // GET runs query will error with 503 if database is initializing
  // this should be momentary, and the type of error to come from this endpoint
  // so, all errors will be mapped to an initializing spinner
  if (allRunsQueryError != null) {
    contents = <ServerInitializing />
  } else if (recentRunsOfUniqueProtocols.length > 0) {
    contents = (
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
    )
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Navigation routes={onDeviceDisplayRoutes} />
      <Flex
        paddingX={SPACING.spacing40}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing16}
      >
        {showWelcomeModal ? (
          <WelcomeModal
            setShowAnalyticsOptInModal={setShowAnalyticsOptInModal}
            setShowWelcomeModal={setShowWelcomeModal}
          />
        ) : null}
        {showAnalyticsOptInModal ? (
          <AnalyticsOptInModal
            setShowAnalyticsOptInModal={setShowAnalyticsOptInModal}
          />
        ) : null}
        {contents}
      </Flex>
    </Flex>
  )
}
