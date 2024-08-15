import * as React from 'react'
import { useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  ALIGN_STRETCH,
  BORDERS,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  DISPLAY_FLEX,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  OVERFLOW_HIDDEN,
  OVERFLOW_WRAP_ANYWHERE,
  OVERFLOW_WRAP_BREAK_WORD,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  SPACING,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'
import {
  RUN_STATUS_FAILED,
  RUN_STATUS_STOPPED,
  RUN_STATUS_SUCCEEDED,
  RUN_STATUSES_TERMINAL,
} from '@opentrons/api-client'
import {
  useHost,
  useProtocolQuery,
  useDeleteRunMutation,
  useRunCommandErrors,
} from '@opentrons/react-api-client'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { LargeButton } from '../../atoms/buttons'
import {
  useRunTimestamps,
  useRunControls,
} from '../../organisms/RunTimeControl/hooks'
import {
  useRunCreatedAtTimestamp,
  useTrackProtocolRunEvent,
  useRobotAnalyticsData,
} from '../../organisms/Devices/hooks'
import { useCloseCurrentRun } from '../../organisms/ProtocolUpload/hooks'
import { onDeviceDisplayFormatTimestamp } from '../../organisms/Devices/utils'
import { EMPTY_TIMESTAMP } from '../../organisms/Devices/constants'
import { RunTimer } from '../../organisms/Devices/ProtocolRun/RunTimer'
import {
  useTrackEvent,
  ANALYTICS_PROTOCOL_RUN_ACTION,
  ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
} from '../../redux/analytics'
import { getLocalRobot } from '../../redux/discovery'
import { RunFailedModal } from '../../organisms/OnDeviceDisplay/RunningProtocol'
import { formatTimeWithUtcLabel, useNotifyRunQuery } from '../../resources/runs'
import { handleTipsAttachedModal } from '../../organisms/DropTipWizardFlows/TipsAttachedModal'
import { useTipAttachmentStatus } from '../../organisms/DropTipWizardFlows'
import { useRecoveryAnalytics } from '../../organisms/ErrorRecoveryFlows/hooks'

import type { OnDeviceRouteParams } from '../../App/types'
import type { PipetteWithTip } from '../../organisms/DropTipWizardFlows'

const CURRENT_RUN_POLL_MS = 5000

export function RunSummary(): JSX.Element {
  const { runId } = useParams<
    keyof OnDeviceRouteParams
  >() as OnDeviceRouteParams
  const { t } = useTranslation('run_details')
  const navigate = useNavigate()
  const host = useHost()
  const { data: runRecord } = useNotifyRunQuery(runId, { staleTime: Infinity })
  const isRunCurrent = Boolean(
    useNotifyRunQuery(runId, { refetchInterval: CURRENT_RUN_POLL_MS })?.data
      ?.data?.current
  )
  const { deleteRun } = useDeleteRunMutation()
  const runStatus = runRecord?.data.status ?? null
  const didRunSucceed = runStatus === RUN_STATUS_SUCCEEDED
  const protocolId = runRecord?.data.protocolId ?? null
  const { data: protocolRecord } = useProtocolQuery(protocolId, {
    staleTime: Infinity,
  })
  const protocolName =
    protocolRecord?.data.metadata.protocolName ??
    protocolRecord?.data.files[0].name
  const isQuickTransfer = protocolRecord?.data.protocolKind === 'quick-transfer'

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

  const [showSplash, setShowSplash] = React.useState(
    runStatus === RUN_STATUS_FAILED || runStatus === RUN_STATUS_SUCCEEDED
  )
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name ?? 'no name'

  const onCloneRunSuccess = (): void => {
    if (isQuickTransfer) {
      deleteRun(runId)
    }
  }

  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(
    runId,
    robotName as string
  )
  const robotAnalyticsData = useRobotAnalyticsData(robotName as string)
  const { reportRecoveredRunResult } = useRecoveryAnalytics()

  const enteredER = runRecord?.data.hasEverEnteredErrorRecovery ?? false
  React.useEffect(() => {
    if (isRunCurrent && typeof enteredER === 'boolean') {
      reportRecoveredRunResult(runStatus, enteredER)
    }
  }, [isRunCurrent, enteredER])

  const { reset, isResetRunLoading } = useRunControls(runId, onCloneRunSuccess)
  const trackEvent = useTrackEvent()
  const { closeCurrentRun, isClosingCurrentRun } = useCloseCurrentRun()
  const [showRunFailedModal, setShowRunFailedModal] = React.useState<boolean>(
    false
  )
  const [showRunAgainSpinner, setShowRunAgainSpinner] = React.useState<boolean>(
    false
  )
  const [showReturnToSpinner, setShowReturnToSpinner] = React.useState<boolean>(
    false
  )

  const robotSerialNumber =
    localRobot?.health?.robot_serial ??
    localRobot?.serverHealth?.serialNumber ??
    null

  const { data: commandErrorList } = useRunCommandErrors(
    runId,
    { cursor: 0, pageLength: 100 },
    {
      enabled:
        runStatus != null &&
        // @ts-expect-error runStatus expected to possibly not be terminal
        RUN_STATUSES_TERMINAL.includes(runStatus) &&
        isRunCurrent,
    }
  )
  // TODO(jh, 08-14-24): The backend never returns the "user cancelled a run" error and cancelledWithoutRecovery becomes unnecessary.
  const cancelledWithoutRecovery =
    !enteredER && runStatus === RUN_STATUS_STOPPED
  const showErrorDetailsBtn =
    !cancelledWithoutRecovery &&
    ((runRecord?.data.errors != null && runRecord?.data.errors.length > 0) ||
      (commandErrorList != null && commandErrorList?.data.length > 0))

  let headerText =
    commandErrorList != null && commandErrorList.data.length > 0
      ? t('run_completed_with_warnings_splash')
      : t('run_completed_splash')
  if (runStatus === RUN_STATUS_FAILED) {
    headerText = t('run_failed_splash')
  } else if (runStatus === RUN_STATUS_STOPPED) {
    if (enteredER) {
      headerText = t('run_canceled_with_errors_splash')
    } else {
      headerText = t('run_canceled_splash')
    }
  }

  const {
    determineTipStatus,
    setTipStatusResolved,
    aPipetteWithTip,
  } = useTipAttachmentStatus({
    runId,
    runRecord: runRecord ?? null,
    host,
  })

  // Determine tip status on initial render only. Error Recovery always handles tip status, so don't show it twice.
  React.useEffect(() => {
    if (isRunCurrent && enteredER === false) {
      void determineTipStatus()
    }
  }, [isRunCurrent, enteredER])

  const returnToQuickTransfer = (): void => {
    if (!isRunCurrent) {
      deleteRun(runId)
    } else {
      closeCurrentRun({
        onSuccess: () => {
          deleteRun(runId)
        },
      })
    }
    navigate('/quick-transfer')
  }

  // TODO(jh, 05-30-24): EXEC-487. Refactor reset() so we can redirect to the setup page, showing the shimmer skeleton instead.
  const runAgain = (): void => {
    setShowRunAgainSpinner(true)
    reset()
    trackEvent({
      name: ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
      properties: { sourceLocation: 'RunSummary', robotSerialNumber },
    })
    trackProtocolRunEvent({ name: ANALYTICS_PROTOCOL_RUN_ACTION.AGAIN })
  }

  // If no pipettes have tips attached, execute the routing callback.
  const setTipStatusResolvedAndRoute = (
    routeCb: (aPipetteWithTip: PipetteWithTip) => void
  ): (() => Promise<void>) => {
    return () =>
      setTipStatusResolved().then(newPipettesWithTip => {
        routeCb(newPipettesWithTip)
      })
  }

  const handleReturnToDash = (aPipetteWithTip: PipetteWithTip | null): void => {
    setShowReturnToSpinner(true)
    if (isRunCurrent && aPipetteWithTip != null) {
      void handleTipsAttachedModal({
        setTipStatusResolved: setTipStatusResolvedAndRoute(handleReturnToDash),
        host,
        aPipetteWithTip,
        instrumentModelSpecs: aPipetteWithTip.specs,
        mount: aPipetteWithTip.mount,
        robotType: FLEX_ROBOT_TYPE,
        isRunCurrent,
        onSkipAndHome: () => {
          closeCurrentRun({
            onSuccess: () => {
              navigate('/')
            },
          })
        },
      })
    } else if (isQuickTransfer) {
      returnToQuickTransfer()
    } else {
      closeCurrentRun({
        onSuccess: () => {
          navigate('/')
        },
      })
    }
  }

  const handleRunAgain = (aPipetteWithTip: PipetteWithTip | null): void => {
    if (isRunCurrent && aPipetteWithTip != null) {
      void handleTipsAttachedModal({
        setTipStatusResolved: setTipStatusResolvedAndRoute(handleRunAgain),
        host,
        aPipetteWithTip,
        instrumentModelSpecs: aPipetteWithTip.specs,
        mount: aPipetteWithTip.mount,
        robotType: FLEX_ROBOT_TYPE,
        isRunCurrent,
        onSkipAndHome: () => {
          runAgain()
        },
      })
    } else {
      if (!isResetRunLoading) {
        runAgain()
      }
    }
  }

  const handleViewErrorDetails = (): void => {
    setShowRunFailedModal(true)
  }

  const handleClickSplash = (): void => {
    trackProtocolRunEvent({
      name: ANALYTICS_PROTOCOL_RUN_ACTION.FINISH,
      properties: robotAnalyticsData ?? undefined,
    })
    setShowSplash(false)
  }

  const buildReturnToCopy = (): string =>
    isQuickTransfer ? t('return_to_quick_transfer') : t('return_to_dashboard')

  const buildReturnToWithSpinnerText = (): JSX.Element => (
    <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} width="16rem">
      {buildReturnToCopy()}
      <Icon
        name="ot-spinner"
        aria-label="icon_ot-spinner"
        spin={true}
        size="3.5rem"
        color={COLORS.white}
      />
    </Flex>
  )
  const buildRunAgainWithSpinnerText = (): JSX.Element => (
    <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} width="16rem">
      {t('run_again')}
      <Icon
        name="ot-spinner"
        aria-label="icon_ot-spinner"
        spin={true}
        size="2.5rem"
        color={COLORS.white}
      />
    </Flex>
  )

  return (
    <Btn
      display={DISPLAY_FLEX}
      width="100%"
      height="100vh"
      flexDirection={DIRECTION_COLUMN}
      position={POSITION_RELATIVE}
      overflow={OVERFLOW_HIDDEN}
      disabled={isClosingCurrentRun}
      onClick={handleClickSplash}
    >
      {showSplash ? (
        <Flex
          height="100vh"
          width="100%"
          justifyContent={JUSTIFY_CENTER}
          alignItems={ALIGN_CENTER}
          position={POSITION_ABSOLUTE}
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing40}
          padding={SPACING.spacing40}
          backgroundColor={didRunSucceed ? COLORS.green50 : COLORS.red50}
        >
          <SplashFrame>
            <Flex gridGap={SPACING.spacing32} alignItems={ALIGN_CENTER}>
              <Icon
                name={didRunSucceed ? 'ot-check' : 'ot-alert'}
                size="4.5rem"
                color={COLORS.white}
              />
              <SplashHeader>
                {didRunSucceed
                  ? t('run_complete_splash')
                  : t('run_failed_splash')}
              </SplashHeader>
            </Flex>
            <Flex width="49rem" justifyContent={JUSTIFY_CENTER}>
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
          padding={SPACING.spacing40}
        >
          {showRunFailedModal ? (
            <RunFailedModal
              runId={runId}
              setShowRunFailedModal={setShowRunFailedModal}
              errors={runRecord?.data.errors}
              commandErrorList={commandErrorList}
              runStatus={runStatus}
            />
          ) : null}
          <Flex
            flexDirection={DIRECTION_COLUMN}
            alignItems={ALIGN_FLEX_START}
            gridGap={SPACING.spacing16}
          >
            <Flex gridGap={SPACING.spacing8} alignItems={ALIGN_CENTER}>
              <Icon
                name={didRunSucceed ? 'ot-check' : 'ot-alert'}
                size="2rem"
                color={didRunSucceed ? COLORS.green50 : COLORS.red50}
              />
              <SummaryHeader>{headerText}</SummaryHeader>
            </Flex>
            <ProtocolName>{protocolName}</ProtocolName>
            <Flex gridGap={SPACING.spacing8} flexWrap={WRAP}>
              <SummaryDatum>
                {`${t('run')}: ${formatTimeWithUtcLabel(createdAtTimestamp)}`}
              </SummaryDatum>
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
              <SummaryDatum>
                {`${t('start')}: ${formatTimeWithUtcLabel(startedAtTimestamp)}`}
              </SummaryDatum>
              <SummaryDatum>
                {`${t('end')}: ${formatTimeWithUtcLabel(completedAtTimestamp)}`}
              </SummaryDatum>
            </Flex>
          </Flex>
          <ButtonContainer>
            <EqualWidthButton
              iconName="arrow-left"
              buttonType="secondary"
              onClick={() => {
                handleReturnToDash(aPipetteWithTip)
              }}
              buttonText={
                showReturnToSpinner
                  ? buildReturnToWithSpinnerText()
                  : buildReturnToCopy()
              }
              css={showReturnToSpinner ? RETURN_TO_CLICKED_STYLE : undefined}
            />
            <EqualWidthButton
              iconName="play-round-corners"
              onClick={() => {
                handleRunAgain(aPipetteWithTip)
              }}
              buttonText={
                showRunAgainSpinner
                  ? buildRunAgainWithSpinnerText()
                  : t('run_again')
              }
              css={showRunAgainSpinner ? RUN_AGAIN_CLICKED_STYLE : undefined}
            />
            {showErrorDetailsBtn ? (
              <EqualWidthButton
                iconName="info"
                buttonType="alert"
                onClick={handleViewErrorDetails}
                buttonText={t('view_error_details')}
              />
            ) : null}
          </ButtonContainer>
        </Flex>
      )}
    </Btn>
  )
}

const SplashHeader = styled.h1`
  font-weight: ${TYPOGRAPHY.fontWeightBold};
  text-align: ${TYPOGRAPHY.textAlignLeft};
  font-size: 80px;
  line-height: 94px;
  color: ${COLORS.white};
`
const SplashBody = styled.h4`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  overflow: hidden;
  overflow-wrap: ${OVERFLOW_WRAP_BREAK_WORD};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  text-align: ${TYPOGRAPHY.textAlignCenter};
  text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  font-size: ${TYPOGRAPHY.fontSize32};
  line-height: ${TYPOGRAPHY.lineHeight42};
  color: ${COLORS.white};
`

const SummaryHeader = styled.h4`
  font-weight: ${TYPOGRAPHY.fontWeightBold};
  text-align: ${TYPOGRAPHY.textAlignLeft};
  font-size: ${TYPOGRAPHY.fontSize28};
  line-height: ${TYPOGRAPHY.lineHeight36};
`

const SplashFrame = styled(Flex)`
  width: 100%;
  height: 100%;
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_CENTER};
  align-items: ${ALIGN_CENTER};
  grid-gap: ${SPACING.spacing40};
  border-radius: ${BORDERS.borderRadius8};
`

const ProtocolName = styled.h4`
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  text-align: ${TYPOGRAPHY.textAlignLeft};
  font-size: ${TYPOGRAPHY.fontSize28};
  line-height: ${TYPOGRAPHY.lineHeight36};
  color: ${COLORS.grey60};
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  overflow-wrap: ${OVERFLOW_WRAP_ANYWHERE};
  height: max-content;
`

const SummaryDatum = styled.div`
  display: ${DISPLAY_FLEX};
  flex-direction: ${DIRECTION_ROW};
  align-items: ${ALIGN_CENTER};
  padding: ${SPACING.spacing8} ${SPACING.spacing12};
  grid-gap: ${SPACING.spacing4};
  height: 44px;
  background: #d6d6d6;
  border-radius: ${BORDERS.borderRadius4};
  color: ${COLORS.grey60};
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

const RETURN_TO_CLICKED_STYLE = css`
  background-color: ${COLORS.blue40};
  &:focus {
    background-color: ${COLORS.blue40};
  }
  &:hover {
    background-color: ${COLORS.blue40};
  }
  &:focus-visible {
    background-color: ${COLORS.blue40};
  }
  &:active {
    background-color: ${COLORS.blue40};
  }
`

const RUN_AGAIN_CLICKED_STYLE = css`
  background-color: ${COLORS.blue60};
  &:focus {
    background-color: ${COLORS.blue60};
  }
  &:hover {
    background-color: ${COLORS.blue60};
  }
  &:focus-visible {
    background-color: ${COLORS.blue60};
  }
  &:active {
    background-color: ${COLORS.blue60};
  }
`

const ButtonContainer = styled(Flex)`
  align-self: ${ALIGN_STRETCH};
  gap: ${SPACING.spacing16};
`

const EqualWidthButton = styled(LargeButton)`
  flex: 1;
  min-width: 0;
  height: 17rem;
`
