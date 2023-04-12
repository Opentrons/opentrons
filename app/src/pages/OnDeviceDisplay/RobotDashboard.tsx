import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

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

import { StyledText } from '../../atoms/text'
import { Chip } from '../../atoms/Chip'
import { Navigation } from '../../organisms/OnDeviceDisplay/Navigation'
import { onDeviceDisplayRoutes } from '../../App/OnDeviceDisplayApp'
import { sortProtocols } from './ProtocolDashboard/utils'
import { EmptyRecentRun } from '../../organisms/OnDeviceDisplay/RobotDashboard/EmptyRecentRun'
import { useMissingProtocolHardware } from '../Protocols/hooks'

import type { OnDeviceRouteParams } from '../../App/types'

export const MAXIMUM_RECENT_RUN_PROTOCOLS = 8 // This might be changed
const SORT_KEY = 'recentRun'

export function RobotDashboard(): JSX.Element {
  const { t } = useTranslation('device_details')
  const protocols = useAllProtocolsQuery()
  const { protocolId } = useParams<OnDeviceRouteParams>()
  const missingProtocolHardware = useMissingProtocolHardware(protocolId)
  const runs = useAllRunsQuery()
  const protocolsData = protocols.data?.data != null ? protocols.data?.data : []
  const runData = runs.data?.data != null ? runs.data?.data : []
  const lastRun = runs.data?.data.find(run => run.protocolId === protocolId)
    ?.createdAt
  /** Currently the max number of displaying recent run protocol is 8 */
  const sortedProtocols = sortProtocols(SORT_KEY, protocolsData, runData).slice(
    0,
    MAXIMUM_RECENT_RUN_PROTOCOLS
  )
  const missingProtocolHardwareType = missingProtocolHardware.map(hardware => {
    hardware.hardwareType
  })
  console.log(missingProtocolHardwareType)
  console.table(sortedProtocols)

  return (
    <Flex padding={SPACING.spacingXXL} flexDirection={DIRECTION_COLUMN}>
      <Navigation routes={onDeviceDisplayRoutes} />
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        {sortProtocols.length === 0 ? (
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
              {sortedProtocols.map((protocol, id) => {
                ;<React.Fragment key={id}>
                  <RecentRunCard
                    missingHardwareTypes={missingProtocolHardwareType}
                    lastRun={lastRun ?? ''}
                    protocolName={protocol.metadata.protocolName ?? ''}
                  />
                </React.Fragment>
              })}
            </Flex>
          </>
        )}
      </Flex>
    </Flex>
  )
}

interface RecentRunCardProps {
  missingHardwareTypes: 'pipette' | 'module'[]
  protocolName: string // need to change
  lastRun: string
}

function RecentRunCard(props: RecentRunCardProps): JSX.Element {
  const { t, i18n } = useTranslation('device_details')
  const { protocolName, lastRun } = props
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      padding={SPACING.spacing5}
      gridGap={SPACING.spacing5}
      backgroundColor={COLORS.green_three}
      width="25.8125rem"
      borderRadius={BORDERS.size_four}
    >
      {/* marginLeft is needed to cancel chip's padding */}
      <Flex marginLeft={`-${SPACING.spacing4}`}>
        <Chip type="success" background={false} text={'Ready to run'} />
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
        {i18n.format(t('last_run_time', { number: lastRun }), 'capitalize')}
      </StyledText>
    </Flex>
  )
}
