import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { formatDistance } from 'date-fns'
import last from 'lodash/last'
import { css } from 'styled-components'

import {
  RUN_STATUS_FAILED,
  RUN_STATUS_STOPPED,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'
import {
  BORDERS,
  Chip,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  OVERFLOW_WRAP_BREAK_WORD,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  useProtocolAnalysisAsDocumentQuery,
  useProtocolQuery,
} from '@opentrons/react-api-client'

import { getTopPortalEl } from '/app/App/portal'
import { ODD_FOCUS_VISIBLE } from '/app/atoms/buttons/constants'
import { Skeleton } from '/app/atoms/Skeleton'
import {
  ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
  useTrackEvent,
} from '/app/redux/analytics'
import { useCloneRun } from '/app/resources/runs'
import { useMissingProtocolHardware } from '/app/transformations/commands'

import { ProtocolSetupFullSkeleton } from '../ProtocolSetup'
import { useRerunnableStatusText } from './hooks'

import type { RunData, RunStatus } from '@opentrons/api-client'
import type { ProtocolResource } from '@opentrons/shared-data'

interface RecentRunProtocolCardProps {
  runData: RunData
  onCardResolved: (runId: string, isStandard: boolean) => void
}

export function RecentRunProtocolCard({
  runData,
  onCardResolved,
}: RecentRunProtocolCardProps): JSX.Element | null {
  const { data, isLoading } = useProtocolQuery(runData.protocolId ?? null)
  const protocolData = data?.data ?? null
  const isProtocolFetching = isLoading
  const prevResolvedRef = useRef(false)

  useEffect(() => {
    if (prevResolvedRef.current) {
      return
    }
    if (isProtocolFetching || protocolData == null) {
      return
    }

    prevResolvedRef.current = true
    const isStandard = protocolData.protocolKind !== 'quick-transfer'
    onCardResolved(runData.id, isStandard)
  }, [isProtocolFetching, protocolData, onCardResolved, runData.id])

  return protocolData == null ||
    protocolData.protocolKind === 'quick-transfer' ? null : (
    <ProtocolWithLastRun
      protocolData={protocolData}
      runData={runData}
      isProtocolFetching={isProtocolFetching}
    />
  )
}

interface ProtocolWithLastRunProps {
  runData: RunData
  protocolData: ProtocolResource
  isProtocolFetching: boolean
}

export function ProtocolWithLastRun({
  runData,
  protocolData,
  isProtocolFetching,
}: ProtocolWithLastRunProps): JSX.Element {
  const { t, i18n } = useTranslation('device_details')
  const {
    missingProtocolHardware,
    isLoading: isLookingForHardware,
    conflictedSlots,
  } = useMissingProtocolHardware(protocolData.id)
  const navigate = useNavigate()
  const isOk = 'ok' in runData ? !(runData?.ok === false) : true
  const isReadyToBeReRun = isOk && missingProtocolHardware.length === 0
  const chipText = useRerunnableStatusText(
    isOk,
    missingProtocolHardware,
    conflictedSlots
  )
  const trackEvent = useTrackEvent()
  // TODO(BC, 08/29/23): reintroduce this analytics event when we refactor the hook to fetch data lazily (performance concern)
  // const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runData.id)
  const { cloneRun, isCloning } = useCloneRun(runData.id, run => {
    if (run.data.id != null) {
      navigate(`/runs/${run.data.id}/setup`)
    }
  })
  const [showSpinner, setShowSpinner] = useState<boolean>(false)

  const protocolName =
    protocolData.metadata.protocolName ?? protocolData.files[0].name

  const protocolId = protocolData.id

  const { data: analysis } = useProtocolAnalysisAsDocumentQuery(
    protocolId,
    last(protocolData?.analysisSummaries)?.id ?? null,
    { enabled: protocolData != null }
  )

  const PROTOCOL_CARD_STYLE = css`
    flex: 1 0 0;
    &:active {
      background-color: ${isReadyToBeReRun ? COLORS.green40 : COLORS.yellow40};
    }
    &:focus-visible {
      box-shadow: ${ODD_FOCUS_VISIBLE};
    }
  `

  const PROTOCOL_CARD_CLICKED_STYLE = css`
    flex: 1 0 0;
    background-color: ${isReadyToBeReRun ? COLORS.green40 : COLORS.yellow40};
    &:focus-visible {
      box-shadow: ${ODD_FOCUS_VISIBLE};
    }
  `

  const PROTOCOL_TEXT_STYLE = css`
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 5;
    overflow: hidden;
    overflow-wrap: ${OVERFLOW_WRAP_BREAK_WORD};
    height: max-content;
  `

  const hasRunTimeParameters =
    analysis?.runTimeParameters != null
      ? analysis?.runTimeParameters.length > 0
      : false

  const handleCardClick = (): void => {
    setShowSpinner(true)
    if (hasRunTimeParameters) {
      navigate(`/protocols/${protocolId}`)
    } else {
      cloneRun()
      trackEvent({
        name: ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
        properties: { sourceLocation: 'RecentRunProtocolCard' },
      })
    }
    // TODO(BC, 08/29/23): reintroduce this analytics event when we refactor the hook to fetch data lazily (performance concern)
    // trackProtocolRunEvent({ name: 'runAgain' })
  }

  const terminationTypeMap: { [runStatus in RunStatus]?: string } = {
    [RUN_STATUS_STOPPED]: t('canceled'),
    [RUN_STATUS_SUCCEEDED]: t('completed'),
    [RUN_STATUS_FAILED]: t('failed'),
  }
  const formattedLastRunTime =
    runData.completedAt != null
      ? formatDistance(new Date(runData.completedAt), new Date(), {
          addSuffix: true,
        }).replace('about ', '')
      : null
  const buildLastRunCopy = (): string => {
    if (formattedLastRunTime != null) {
      return i18n.format(
        `${terminationTypeMap[runData.status] ?? ''} ${formattedLastRunTime}`,
        'capitalize'
      )
    } else {
      return ''
    }
  }

  if (isCloning) {
    return createPortal(<ProtocolSetupFullSkeleton />, getTopPortalEl())
  }

  return isProtocolFetching || isLookingForHardware ? (
    <Skeleton
      height="24.5rem"
      width="25.8125rem"
      backgroundSize="64rem"
      borderRadius={BORDERS.borderRadius12}
    />
  ) : (
    <Flex
      aria-label="RecentRunProtocolCard"
      css={!showSpinner ? PROTOCOL_CARD_STYLE : PROTOCOL_CARD_CLICKED_STYLE}
      flexDirection={DIRECTION_COLUMN}
      padding={SPACING.spacing24}
      gridGap={SPACING.spacing24}
      backgroundColor={
        isOk
          ? isReadyToBeReRun
            ? COLORS.green35
            : COLORS.yellow35
          : COLORS.red35
      }
      width="25.8125rem"
      height="24.5rem"
      borderRadius={BORDERS.borderRadius16}
      onClick={handleCardClick}
    >
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Chip
          paddingLeft="0"
          type={isOk ? (isReadyToBeReRun ? 'success' : 'warning') : 'error'}
          background={false}
          text={i18n.format(chipText, 'capitalize')}
        />
        {showSpinner && (
          <Icon
            name="ot-spinner"
            aria-label="icon_ot-spinner"
            spin={true}
            size="2.5rem"
            color={COLORS.black90}
          />
        )}
      </Flex>
      <Flex width="100%" height="14rem">
        <LegacyStyledText
          fontSize={TYPOGRAPHY.fontSize32}
          fontWeight={TYPOGRAPHY.fontWeightBold}
          lineHeight={TYPOGRAPHY.lineHeight42}
          css={PROTOCOL_TEXT_STYLE}
        >
          {protocolName}
        </LegacyStyledText>
      </Flex>
      <LegacyStyledText
        fontSize={TYPOGRAPHY.fontSize22}
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        lineHeight={TYPOGRAPHY.lineHeight28}
        color={COLORS.grey60}
      >
        {buildLastRunCopy()}
      </LegacyStyledText>
    </Flex>
  )
}
