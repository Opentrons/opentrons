import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

import type { Run } from '@opentrons/api-client'
import {
  RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_IDLE,
  RUN_STATUS_RUNNING,
  RUN_STATUS_STOPPED,
  RUN_STATUSES_TERMINAL,
} from '@opentrons/api-client'
import { useHost, useRunCommandErrors } from '@opentrons/react-api-client'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import {
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_FLEX_END,
  LegacyStyledText,
  SecondaryButton,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { ProtocolAnalysisErrorBanner } from '../ProtocolAnalysisErrorBanner'
import {
  DropTipWizardFlows,
  useDropTipWizardFlows,
  useTipAttachmentStatus,
} from '../../../DropTipWizardFlows'
import {
  ProtocolAnalysisErrorModal,
  useProtocolAnalysisErrorsModal,
} from './ProtocolAnalysisErrorModal'
import { Banner } from '../../../../atoms/Banner'
import { ANALYTICS_PROTOCOL_RUN_ACTION } from '../../../../redux/analytics'
import { useCloseCurrentRun } from '../../../ProtocolUpload/hooks'
import { ConfirmCancelModal } from '../../../RunDetails/ConfirmCancelModal'
import {
  useRunControls,
  useRunStatus,
  useRunTimestamps,
} from '../../../../organisms/RunTimeControl/hooks'
import {
  useIsFlex,
  useIsRobotViewable,
  useProtocolDetailsForRun,
  useRobotAnalyticsData,
  useRunCreatedAtTimestamp,
  useTrackProtocolRunEvent,
} from '../../hooks'
import { formatTimestamp } from '../../utils'
import { RunTimer } from '../RunTimer'
import { EMPTY_TIMESTAMP } from '../../constants'
import { getHighestPriorityError } from '../../../OnDeviceDisplay/RunningProtocol'
import { RunFailedModal, useRunFailedModal } from './RunFailedModal'
import { RunProgressMeter } from '../../../RunProgressMeter'
import { getIsFixtureMismatch } from '../../../../resources/deck_configuration/utils'
import { useDeckConfigurationCompatibility } from '../../../../resources/deck_configuration/hooks'
import { useMostRecentCompletedAnalysis } from '../../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useMostRecentRunId } from '../../../ProtocolUpload/hooks/useMostRecentRunId'
import { useIsRunCurrent, useNotifyRunQuery } from '../../../../resources/runs'
import {
  ErrorRecoveryFlows,
  useErrorRecoveryFlows,
} from '../../../ErrorRecoveryFlows'
import { useRecoveryAnalytics } from '../../../ErrorRecoveryFlows/hooks'
import {
  ProtocolDropTipModal,
  useProtocolDropTipModal,
} from './ProtocolDropTipModal'
import { DisplayRunStatus } from './DisplayRunStatus'
import { LabeledValue } from './LabeledValueProps'
import { TerminalRunBanner } from './TerminalRunBanner'
import { ActionButton } from './ActionButton'
import { CANCELLABLE_STATUSES } from './constants'
import { useIsDoorOpen } from './hooks'

import type { RunCommandError } from '@opentrons/shared-data'

interface ProtocolRunHeaderProps {
  protocolRunHeaderRef: React.RefObject<HTMLDivElement> | null
  robotName: string
  runId: string
  makeHandleJumpToStep: (index: number) => () => void
  missingSetupSteps: string[]
}

export function ProtocolRunHeader({
  protocolRunHeaderRef,
  robotName,
  runId,
  makeHandleJumpToStep,
  missingSetupSteps,
}: ProtocolRunHeaderProps): JSX.Element | null {
  const { t } = useTranslation(['run_details', 'shared'])
  const navigate = useNavigate()
  const host = useHost()
  const createdAtTimestamp = useRunCreatedAtTimestamp(runId)
  const {
    protocolData,
    displayName,
    protocolKey,
    isProtocolAnalyzing,
  } = useProtocolDetailsForRun(runId)
  const { reportRecoveredRunResult } = useRecoveryAnalytics()

  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId, robotName)
  const robotAnalyticsData = useRobotAnalyticsData(robotName)
  const isRobotViewable = useIsRobotViewable(robotName)
  const runStatus = useRunStatus(runId)
  const isRunCurrent = useIsRunCurrent(runId)

  const {
    showRunFailedModal,
    toggleModal: toggleRunFailedModal,
  } = useRunFailedModal()

  const {
    showModal: showAnalysisErrorsModal,
    modalProps: analysisErrorsModalProps,
  } = useProtocolAnalysisErrorsModal({ robotName, runId, displayName })

  const mostRecentRunId = useMostRecentRunId()
  const isMostRecentRun = mostRecentRunId === runId
  const { closeCurrentRun, isClosingCurrentRun } = useCloseCurrentRun()
  const { startedAt, stoppedAt, completedAt } = useRunTimestamps(runId)
  const { data: commandErrorList } = useRunCommandErrors(
    runId,
    { cursor: 0, pageLength: 100 },
    {
      enabled:
        runStatus != null &&
        // @ts-expect-error runStatus expected to possibly not be terminal
        RUN_STATUSES_TERMINAL.includes(runStatus) &&
        isMostRecentRun,
    }
  )
  const isResetRunLoadingRef = React.useRef(false)
  const { data: runRecord } = useNotifyRunQuery(runId, { staleTime: Infinity })
  const highestPriorityError =
    runRecord?.data.errors?.[0] != null
      ? getHighestPriorityError(runRecord.data.errors as RunCommandError[])
      : null

  const robotProtocolAnalysis = useMostRecentCompletedAnalysis(runId)
  const isFlex = useIsFlex(robotName)
  const robotType = isFlex ? FLEX_ROBOT_TYPE : OT2_ROBOT_TYPE
  const deckConfigCompatibility = useDeckConfigurationCompatibility(
    robotType,
    robotProtocolAnalysis
  )
  const isFixtureMismatch = getIsFixtureMismatch(deckConfigCompatibility)
  const { isERActive, failedCommand } = useErrorRecoveryFlows(runId, runStatus)

  const { showDTWiz, toggleDTWiz } = useDropTipWizardFlows()
  const {
    areTipsAttached,
    determineTipStatus,
    resetTipStatus,
    setTipStatusResolved,
    aPipetteWithTip,
    initialPipettesWithTipsCount,
  } = useTipAttachmentStatus({
    runId,
    runRecord: runRecord ?? null,
    host,
  })
  const {
    showDTModal,
    onDTModalSkip,
    onDTModalRemoval,
    isDisabled: areDTModalBtnsDisabled,
  } = useProtocolDropTipModal({
    areTipsAttached,
    toggleDTWiz,
    isRunCurrent,
    currentRunId: runId,
    instrumentModelSpecs: aPipetteWithTip?.specs,
    mount: aPipetteWithTip?.mount,
    robotType,
    onSkipAndHome: () => {
      closeCurrentRun()
    },
  })

  const isDoorOpen = useIsDoorOpen(robotName, isFlex)

  const enteredER = runRecord?.data.hasEverEnteredErrorRecovery ?? false
  const cancelledWithoutRecovery =
    !enteredER && runStatus === RUN_STATUS_STOPPED

  React.useEffect(() => {
    if (isFlex) {
      if (runStatus === RUN_STATUS_IDLE) {
        resetTipStatus()
      } else if (
        runStatus != null &&
        // @ts-expect-error runStatus expected to possibly not be terminal
        RUN_STATUSES_TERMINAL.includes(runStatus) &&
        enteredER === false
      ) {
        void determineTipStatus()
      }
    }
  }, [runStatus])

  React.useEffect(() => {
    if (protocolData != null && !isRobotViewable) {
      navigate('/devices')
    }
  }, [protocolData, isRobotViewable, navigate])

  React.useEffect(() => {
    if (isRunCurrent && typeof enteredER === 'boolean') {
      reportRecoveredRunResult(runStatus, enteredER)
    }
  }, [isRunCurrent, enteredER])

  // Side effects dependent on the current run state.
  React.useEffect(() => {
    if (runStatus === RUN_STATUS_STOPPED && isRunCurrent && runId != null) {
      trackProtocolRunEvent({
        name: ANALYTICS_PROTOCOL_RUN_ACTION.FINISH,
        properties: {
          ...robotAnalyticsData,
        },
      })

      // TODO(jh, 08-15-24): The enteredER condition is a hack, because errorCommands are only returned when a run is current.
      // Ideally the run should not need to be current to view errorCommands.

      // Close the run if no tips are attached after running tip check at least once.
      // This marks the robot as "not busy" as soon as a run is cancelled if drop tip CTAs are unnecessary.
      if (initialPipettesWithTipsCount === 0 && !enteredER) {
        closeCurrentRun()
      }
    }
  }, [runStatus, isRunCurrent, runId, enteredER])

  const startedAtTimestamp =
    startedAt != null ? formatTimestamp(startedAt) : EMPTY_TIMESTAMP

  const completedAtTimestamp =
    completedAt != null ? formatTimestamp(completedAt) : EMPTY_TIMESTAMP

  // redirect to new run after successful reset
  const onResetSuccess = (createRunResponse: Run): void => {
    navigate(
      `/devices/${robotName}/protocol-runs/${createRunResponse.data.id}/run-preview`
    )
  }

  const { pause, play } = useRunControls(runId, onResetSuccess)

  const [
    showConfirmCancelModal,
    setShowConfirmCancelModal,
  ] = React.useState<boolean>(false)

  const handleCancelClick = (): void => {
    if (runStatus === RUN_STATUS_RUNNING) pause()
    setShowConfirmCancelModal(true)
  }

  const handleClearClick = (): void => {
    trackProtocolRunEvent({
      name: ANALYTICS_PROTOCOL_RUN_ACTION.FINISH,
      properties: robotAnalyticsData ?? undefined,
    })
    closeCurrentRun()
  }

  return (
    <>
      {isERActive ? (
        <ErrorRecoveryFlows
          runStatus={runStatus}
          runId={runId}
          failedCommandByRunRecord={failedCommand}
          protocolAnalysis={robotProtocolAnalysis}
        />
      ) : null}
      {showRunFailedModal ? (
        <RunFailedModal
          robotName={robotName}
          runId={runId}
          toggleModal={toggleRunFailedModal}
          highestPriorityError={highestPriorityError}
          commandErrorList={commandErrorList}
          runStatus={runStatus}
        />
      ) : null}
      <Flex
        ref={protocolRunHeaderRef}
        backgroundColor={COLORS.white}
        borderRadius={BORDERS.borderRadius8}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing16}
        marginBottom={SPACING.spacing16}
        padding={SPACING.spacing16}
      >
        {showAnalysisErrorsModal ? (
          <ProtocolAnalysisErrorModal {...analysisErrorsModalProps} />
        ) : null}
        <Flex>
          {protocolKey != null ? (
            <Link to={`/protocols/${protocolKey}`}>
              <LegacyStyledText
                as="h2"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                color={COLORS.blue50}
              >
                {displayName}
              </LegacyStyledText>
            </Link>
          ) : (
            <LegacyStyledText
              as="h2"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            >
              {displayName}
            </LegacyStyledText>
          )}
        </Flex>
        {showAnalysisErrorsModal ? (
          <ProtocolAnalysisErrorBanner
            errors={analysisErrorsModalProps.errors}
          />
        ) : null}
        {runStatus === RUN_STATUS_BLOCKED_BY_OPEN_DOOR ? (
          <Banner type="warning" iconMarginLeft={SPACING.spacing4}>
            {t('close_door_to_resume')}
          </Banner>
        ) : null}
        {runStatus === RUN_STATUS_STOPPED && !enteredER ? (
          <Banner type="warning" iconMarginLeft={SPACING.spacing4}>
            {t('run_canceled')}
          </Banner>
        ) : null}
        {/* Note: This banner is for before running a protocol */}
        {isDoorOpen &&
        runStatus !== RUN_STATUS_BLOCKED_BY_OPEN_DOOR &&
        runStatus !== RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR &&
        runStatus != null &&
        CANCELLABLE_STATUSES.includes(runStatus) ? (
          <Banner type="warning" iconMarginLeft={SPACING.spacing4}>
            {t('shared:close_robot_door')}
          </Banner>
        ) : null}
        {isMostRecentRun ? (
          <TerminalRunBanner
            {...{
              runStatus,
              handleClearClick,
              isClosingCurrentRun,
              toggleRunFailedModal,
              commandErrorList,
              highestPriorityError,
              cancelledWithoutRecovery,
            }}
            isResetRunLoading={isResetRunLoadingRef.current}
            isRunCurrent={isRunCurrent}
          />
        ) : null}
        {showDTModal ? (
          <ProtocolDropTipModal
            onSkip={onDTModalSkip}
            onBeginRemoval={onDTModalRemoval}
            mount={aPipetteWithTip?.mount}
            isDisabled={areDTModalBtnsDisabled}
          />
        ) : null}
        <Box display="grid" gridTemplateColumns="4fr 3fr 3fr 4fr">
          <LabeledValue label={t('run')} value={createdAtTimestamp} />
          <LabeledValue
            label={t('status')}
            value={<DisplayRunStatus runStatus={runStatus} />}
          />
          <LabeledValue
            label={t('run_time')}
            value={
              <RunTimer {...{ runStatus, startedAt, stoppedAt, completedAt }} />
            }
          />
          <Flex justifyContent={JUSTIFY_FLEX_END}>
            <ActionButton
              runId={runId}
              robotName={robotName}
              runStatus={runStatus}
              isProtocolAnalyzing={
                protocolData == null || !!isProtocolAnalyzing
              }
              isDoorOpen={isDoorOpen}
              isFixtureMismatch={isFixtureMismatch}
              isResetRunLoadingRef={isResetRunLoadingRef}
              missingSetupSteps={missingSetupSteps}
            />
          </Flex>
        </Box>
        {runStatus != null ? (
          <Box
            backgroundColor={COLORS.grey10}
            display="grid"
            gridTemplateColumns="4fr 6fr 4fr"
            padding={SPACING.spacing8}
            borderRadius={BORDERS.borderRadius4}
          >
            <LabeledValue
              label={t('protocol_start')}
              value={startedAtTimestamp}
            />
            <LabeledValue
              label={t('protocol_end')}
              value={completedAtTimestamp}
            />
            <Flex justifyContent={JUSTIFY_FLEX_END}>
              {CANCELLABLE_STATUSES.includes(runStatus) && (
                <SecondaryButton
                  isDangerous
                  onClick={handleCancelClick}
                  disabled={isClosingCurrentRun}
                >
                  {t('cancel_run')}
                </SecondaryButton>
              )}
            </Flex>
          </Box>
        ) : null}
        <RunProgressMeter
          {...{
            makeHandleJumpToStep,
            runId,
            robotName,
            resumeRunHandler: play,
          }}
        />
        {showConfirmCancelModal ? (
          <ConfirmCancelModal
            onClose={() => {
              setShowConfirmCancelModal(false)
            }}
            runId={runId}
            robotName={robotName}
          />
        ) : null}
        {showDTWiz && aPipetteWithTip != null ? (
          <DropTipWizardFlows
            robotType={isFlex ? FLEX_ROBOT_TYPE : OT2_ROBOT_TYPE}
            mount={aPipetteWithTip.mount}
            instrumentModelSpecs={aPipetteWithTip.specs}
            closeFlow={isTakeover => {
              if (isTakeover) {
                toggleDTWiz()
              } else {
                void setTipStatusResolved(() => {
                  toggleDTWiz()
                  closeCurrentRun()
                }, toggleDTWiz)
              }
            }}
          />
        ) : null}
      </Flex>
    </>
  )
}
