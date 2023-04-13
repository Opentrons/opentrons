import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { formatDistance } from 'date-fns'

import {
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  SPACING,
  COLORS,
  TYPOGRAPHY,
  BORDERS,
} from '@opentrons/components'
import {
  useAllProtocolsQuery,
  useAllRunsQuery,
} from '@opentrons/react-api-client'
import { css } from 'styled-components'

import { StyledText } from '../../atoms/text'
import { Chip } from '../../atoms/Chip'
import { Navigation } from '../../organisms/OnDeviceDisplay/Navigation'
import { onDeviceDisplayRoutes } from '../../App/OnDeviceDisplayApp'
import { EmptyRecentRun } from '../../organisms/OnDeviceDisplay/RobotDashboard/EmptyRecentRun'
import { useMissingProtocolHardware } from '../Protocols/hooks'
import { sortProtocols } from './ProtocolDashboard/utils'

export const MAXIMUM_RECENT_RUN_PROTOCOLS = 8 // This might be changed
const SORT_KEY = 'recentRun'

export function RobotDashboard(): JSX.Element {
  const { t } = useTranslation('device_details')
  const protocols = useAllProtocolsQuery()
  const runs = useAllRunsQuery()
  const protocolsData = protocols.data?.data != null ? protocols.data?.data : []
  const runData = runs.data?.data != null ? runs.data?.data : []

  /** Currently the max number of displaying recent run protocol is 8 */
  const sortedProtocols = sortProtocols(SORT_KEY, protocolsData, runData).slice(
    0,
    MAXIMUM_RECENT_RUN_PROTOCOLS
  )
  return (
    <Flex padding={SPACING.spacingXXL} flexDirection={DIRECTION_COLUMN}>
      <Navigation routes={onDeviceDisplayRoutes} />
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        {sortedProtocols.length === 0 ? (
          <>
            <EmptyRecentRun />
          </>
        ) : (
          <>
            <StyledText
              fontSize={TYPOGRAPHY.fontSize20}
              lineHeight={TYPOGRAPHY.lineHeight28}
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            >
              {t('run_again')}
            </StyledText>
            <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing3}>
              {sortedProtocols.map(protocol => {
                const protocolId = protocol.id
                const lastRun = runs.data?.data.find(
                  run => run.protocolId === protocolId
                )?.createdAt
                return (
                  <React.Fragment key={protocol.id}>
                    <RecentRunCard
                      lastRun={lastRun}
                      protocolId={protocolId}
                      protocolName={
                        protocol.metadata.protocolName ?? protocol.files[0].name
                      }
                    />
                  </React.Fragment>
                )
              })}
            </Flex>
          </>
        )}
      </Flex>
    </Flex>
  )
}

interface RecentRunCardProps {
  protocolName: string
  protocolId: string
  lastRun?: string
}

function RecentRunCard(props: RecentRunCardProps): JSX.Element {
  const { t, i18n } = useTranslation('device_details')
  const { protocolName, protocolId, lastRun } = props
  const missingProtocolHardware = useMissingProtocolHardware(protocolId)
  const isSuccess = missingProtocolHardware.length === 0

  const CARD_STYLE = css`
    &:active {
      background-color: ${isSuccess
        ? COLORS.green_three_pressed
        : COLORS.yellow_three_pressed};
    }
    &:focus-visible {
      box-shadow: 0 0 0 ${SPACING.spacing1} ${COLORS.fundamentalsFocus};
    }
  `

  const missingProtocolHardwareType = missingProtocolHardware.map(
    hardware => hardware.hardwareType
  )
  const missingProtocolPipetteType = missingProtocolHardwareType.filter(
    type => type === 'pipette'
  )
  const missingProtocolModuleType = missingProtocolHardwareType.filter(
    type => type === 'module'
  )

  let chipText: string = t('ready_to_run')
  if (
    missingProtocolPipetteType.length === 0 &&
    missingProtocolModuleType.length > 0
  ) {
    chipText = t('missing_modules', { num: missingProtocolModuleType.length })
  } else if (
    missingProtocolPipetteType.length > 0 &&
    missingProtocolModuleType.length === 0
  ) {
    chipText = t('missing_pipettes', { num: missingProtocolPipetteType.length })
  } else if (
    missingProtocolPipetteType.length > 0 &&
    missingProtocolModuleType.length > 0
  ) {
    chipText = t('missing_both', {
      numMod: missingProtocolModuleType.length,
      numPip: missingProtocolPipetteType.length,
    })
  }
  return (
    <Flex
      aria-label="RecentRunCard"
      css={CARD_STYLE}
      flexDirection={DIRECTION_COLUMN}
      padding={SPACING.spacing5}
      gridGap={SPACING.spacing5}
      backgroundColor={isSuccess ? COLORS.green_three : COLORS.yellow_three}
      width="25.8125rem"
      borderRadius={BORDERS.size_four}
    >
      {/* marginLeft is needed to cancel chip's padding */}
      <Flex marginLeft={`-${SPACING.spacing4}`}>
        <Chip
          type={isSuccess ? 'success' : 'warning'}
          background={false}
          text={i18n.format(chipText, 'capitalize')}
        />
      </Flex>
      <Flex width="100%" height="14rem">
        <StyledText
          fontSize={TYPOGRAPHY.fontSize32}
          fontWeight={TYPOGRAPHY.fontWeightLevel2_bold}
          lineHeight={TYPOGRAPHY.lineHeight42}
        >
          {protocolName}
        </StyledText>
      </Flex>
      <StyledText
        fontSize={TYPOGRAPHY.fontSize22}
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        lineHeight={TYPOGRAPHY.lineHeight28}
        color={COLORS.darkBlack_seventy}
      >
        {i18n.format(t('last_run_time'), 'capitalize')}{' '}
        {lastRun != null
          ? formatDistance(new Date(lastRun), new Date(), {
              addSuffix: true,
            }).replace('about ', '')
          : ''}
      </StyledText>
    </Flex>
  )
}
