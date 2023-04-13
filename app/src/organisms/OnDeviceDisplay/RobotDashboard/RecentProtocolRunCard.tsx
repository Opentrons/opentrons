import * as React from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { formatDistance } from 'date-fns'

import {
  Flex,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
  BORDERS,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { Chip } from '../../../atoms/Chip'
import { useMissingProtocolHardware } from '../../../pages/Protocols/hooks'

interface RecentProtocolRunCardProps {
  /** protocol name that was run recently */
  protocolName: string
  /** protocol id  */
  protocolId: string
  /** last run */
  lastRun?: string
}

export function RecentProtocolRunCard({
  protocolName,
  protocolId,
  lastRun,
}: RecentProtocolRunCardProps): JSX.Element {
  const { t, i18n } = useTranslation('device_details')
  const missingProtocolHardware = useMissingProtocolHardware(protocolId)
  const history = useHistory()
  const isSuccess = missingProtocolHardware.length === 0

  console.log(protocolId)
  console.log('missingProtocolHardware', missingProtocolHardware)
  console.log(missingProtocolHardware.length)
  console.log('isSuccess', isSuccess)

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

  const PROTOCOL_TEXT_STYLE = css`
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 5;
    overflow: hidden;
  `

  // switch below
  // const countHardwareType = (hwType: 'pipette' | 'module'): number => {
  //   return missingProtocolHardwareType.reduce((acc, hardwareType) => {
  //     if (hardwareType === hwType) {
  //       return acc + 1
  //     }
  //     return acc
  //   }, 0)
  // }

  // const missingPipettes = countHardwareType('pipette')
  // const missing = countHardwareType('pipette')

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
    chipText = t('missing_module', {
      num: missingProtocolModuleType.length,
      count: missingProtocolModuleType.length,
    })
  } else if (
    missingProtocolPipetteType.length > 0 &&
    missingProtocolModuleType.length === 0
  ) {
    chipText = t('missing_pipette', {
      num: missingProtocolPipetteType.length,
      count: missingProtocolPipetteType.length,
    })
  } else if (
    missingProtocolPipetteType.length > 0 &&
    missingProtocolModuleType.length > 0
  ) {
    chipText = t('missing_both', {
      numMod: missingProtocolModuleType.length,
      numPip: missingProtocolPipetteType.length,
    })
  }
  const handleCardClick = (): void => {
    history.push(`protocols/${protocolId}`)
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
      onClick={handleCardClick}
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
          css={PROTOCOL_TEXT_STYLE}
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
