import * as React from 'react'
import { useParams, useHistory, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import {
  Flex,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  SPACING,
  COLORS,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  POSITION_RELATIVE,
  OVERFLOW_HIDDEN,
  ALIGN_FLEX_END,
  POSITION_ABSOLUTE,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_STRETCH,
  ALIGN_FLEX_START,
  BORDERS,
  DIRECTION_ROW,
  DISPLAY_FLEX,
  SIZE_2,
} from '@opentrons/components'
import { RUN_STATUS_SUCCEEDED } from '@opentrons/api-client'
import { useProtocolQuery, useRunQuery } from '@opentrons/react-api-client'

import { TertiaryButton } from '../../atoms/buttons'
import { LargeButton } from '../../atoms/buttons/OnDeviceDisplay'
import { useRunTimestamps } from '../../organisms/RunTimeControl/hooks'
import { useRunCreatedAtTimestamp } from '../../organisms/Devices/hooks'
import { onDeviceDisplayFormatTimestamp } from '../../organisms/Devices/utils'
import { EMPTY_TIMESTAMP } from '../../organisms/Devices/constants'
import { RunTimer } from '../../organisms/Devices/ProtocolRun/RunTimer'

import type { OnDeviceRouteParams } from '../../App/types'

export function RunSummary(): JSX.Element {
  const { runId } = useParams<OnDeviceRouteParams>()
  const { t } = useTranslation('run_details')
  const history = useHistory()
  const { data: runRecord } = useRunQuery(runId, { staleTime: Infinity })
  const runStatus = runRecord?.data.status ?? null
  const isRunSucceeded = runStatus === RUN_STATUS_SUCCEEDED
  const protocolId = runRecord?.data.protocolId ?? null
  const { data: protocolRecord } = useProtocolQuery(protocolId, {
    staleTime: Infinity,
  })
  const protocolName =
    protocolRecord?.data.metadata.protocolName ??
    protocolRecord?.data.files[0].name
  const { startedAt, stoppedAt, completedAt } = useRunTimestamps(runId)
  const createdAtTimestamp = useRunCreatedAtTimestamp(runId)
  const startedAtTimestamp =
    startedAt != null
      ? onDeviceDisplayFormatTimestamp(startedAt)
      : EMPTY_TIMESTAMP

  const completedAtTimestamp =
    completedAt != null
      ? onDeviceDisplayFormatTimestamp(completedAt)
      : EMPTY_TIMESTAMP

  const [showSplash, setShowSplash] = React.useState(true)

  const runStatusText = isRunSucceeded
    ? t('run_complete')
    : t('run_failed_modal_title')

  const handleReturnToDash = (): void => {
    history.push('/')
  }

  const handleRunAgain = (): void => {
    history.push(`/protocols/${runId}/setup`)
  }

  const handleViewErrorDetails = (): void => {
    // Note (kj:04/28/2023) the current RunFailedModal is needed to refactor before hooking up
    console.log('will be added')
  }

  return (
    <>
      <Flex
        height="100vh"
        flexDirection={DIRECTION_COLUMN}
        position={POSITION_RELATIVE}
        overflow={OVERFLOW_HIDDEN}
        onClick={() => {
          setShowSplash(false)
        }}
      >
        {showSplash ? (
          <Flex
            height="100vh"
            width="100%"
            justifyContent={JUSTIFY_CENTER}
            alignItems={ALIGN_CENTER}
            position={POSITION_ABSOLUTE}
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacingXXL}
            padding={SPACING.spacingXXL}
            backgroundColor={isRunSucceeded ? COLORS.green_two : COLORS.red_two}
          >
            <SplashFrame>
              <Flex gridGap={SPACING.spacing6} alignItems={ALIGN_CENTER}>
                <Icon
                  name={isRunSucceeded ? 'ot-check' : 'ot-alert'}
                  size="4.5rem"
                  color={COLORS.white}
                />
                <SplashHeader> {runStatusText} </SplashHeader>
              </Flex>
              <Flex width="49rem">
                <SplashBody>{protocolName}</SplashBody>
              </Flex>
            </SplashFrame>
          </Flex>
        ) : (
          <Flex
            height="100vh"
            width="100%"
            flexDirection={DIRECTION_COLUMN}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            padding={SPACING.spacingXXL}
          >
            <Flex
              flexDirection={DIRECTION_COLUMN}
              alignItems={ALIGN_FLEX_START}
              gridGap={SPACING.spacing16}
            >
              <Flex gridGap={SPACING.spacing3} alignItems={ALIGN_CENTER}>
                <Icon
                  name={isRunSucceeded ? 'ot-check' : 'ot-alert'}
                  size={SIZE_2}
                  color={
                    isRunSucceeded ? COLORS.successEnabled : COLORS.errorEnabled
                  }
                />
                <SummaryHeader>{runStatusText}</SummaryHeader>
              </Flex>
              <ProtocolName>{protocolName}</ProtocolName>
              <Flex gridGap={SPACING.spacing3}>
                <SummaryDatum>{`${t(
                  'run'
                )}: ${createdAtTimestamp}`}</SummaryDatum>
                <SummaryDatum>
                  {`${t('duration')}: `}
                  <RunTimer
                    {...{
                      runStatus,
                      startedAt,
                      stoppedAt,
                      completedAt,
                    }}
                    style={DURATION_TEXT_STYLE}
                  />
                </SummaryDatum>
                <SummaryDatum>{`${t(
                  'start'
                )}: ${startedAtTimestamp}`}</SummaryDatum>
                <SummaryDatum>{`${t(
                  'end'
                )}: ${completedAtTimestamp}`}</SummaryDatum>
              </Flex>
            </Flex>
            <Flex alignSelf={ALIGN_STRETCH} gridGap={SPACING.spacing16}>
              <LargeButton
                flex="1"
                iconName="arrow-left"
                buttonType="secondary"
                onClick={handleReturnToDash}
                buttonText={t('return_to_dashboard')}
                height="17rem"
              />
              <LargeButton
                flex="1"
                iconName="play-round-corners"
                buttonType="primary"
                onClick={handleRunAgain}
                buttonText={t('run_again')}
                height="17rem"
              />
              {!isRunSucceeded ? (
                // Note: (04/28/2023) info icon will be added by NetworkDetailsModal.
                // Once the PR is merged into edge this icon name will be updated.
                <LargeButton
                  flex="1"
                  iconName="information"
                  buttonType="alert"
                  onClick={handleViewErrorDetails}
                  buttonText={t('view_error_details')}
                  height="17rem"
                />
              ) : null}
            </Flex>
          </Flex>
        )}
      </Flex>
      {/* temporary */}
      <Flex
        alignSelf={ALIGN_FLEX_END}
        marginTop={SPACING.spacing5}
        width="fit-content"
        paddingRight={SPACING.spacing6}
      >
        <Link to="/dashboard">
          <TertiaryButton>back to RobotDashboard</TertiaryButton>
        </Link>
      </Flex>
    </>
  )
}

const SplashHeader = styled.h1`
  font-weight: ${TYPOGRAPHY.fontWeightBold};
  text-align: ${TYPOGRAPHY.textAlignLeft};
  text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  font-size: 80px;
  line-height: 94px;
  color: ${COLORS.white};
`
const SplashBody = styled.h4`
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  text-align: ${TYPOGRAPHY.textAlignLeft};
  text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  font-size: ${TYPOGRAPHY.fontSize32};
  line-height: ${TYPOGRAPHY.lineHeight42};
  color: ${COLORS.white};
`

const SummaryHeader = styled.h4`
  font-weight: ${TYPOGRAPHY.fontWeightBold};
  text-align: ${TYPOGRAPHY.textAlignLeft};
  text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  font-size: ${TYPOGRAPHY.fontSize28};
  line-height: ${TYPOGRAPHY.lineHeight36};
`

const SplashFrame = styled(Flex)`
  width: 100%;
  height: 100%;
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_CENTER};
  align-items: ${ALIGN_CENTER};
  border: ${BORDERS.size_two} solid ${COLORS.white}${COLORS.opacity20HexCode};
  border-radius: ${BORDERS.size_three};
  grid-gap: ${SPACING.spacingXXL};
`

const ProtocolName = styled.h4`
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  text-align: ${TYPOGRAPHY.textAlignLeft};
  text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  font-size: ${TYPOGRAPHY.fontSize28};
  line-height: ${TYPOGRAPHY.lineHeight36};
  color: ${COLORS.darkBlack_seventy};
`

const SummaryDatum = styled.div`
  display: ${DISPLAY_FLEX};
  flex-direction: ${DIRECTION_ROW};
  align-items: ${ALIGN_CENTER};
  padding: ${SPACING.spacing3} 0.75rem;
  grid-gap: ${SPACING.spacing2};
  height: 44px;
  background: #d6d6d6;
  border-radius: 4px;
  color: ${COLORS.darkBlack_ninety};
  font-size: ${TYPOGRAPHY.fontSize22};
  line-height: ${TYPOGRAPHY.lineHeight28};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  width: max-content;
`

const DURATION_TEXT_STYLE = css`
  font-size: ${TYPOGRAPHY.fontSize22};
  line-height: ${TYPOGRAPHY.lineHeight28};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
`
