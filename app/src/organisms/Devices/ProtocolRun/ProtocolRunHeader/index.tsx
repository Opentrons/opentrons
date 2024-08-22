import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

import {
  RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_RUNNING,
  RUN_STATUS_STOPPED,
  RUN_STATUSES_TERMINAL,
} from '@opentrons/api-client'
import { useRunCommandErrors } from '@opentrons/react-api-client'
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
import { DropTipWizardFlows } from '../../../DropTipWizardFlows'
import {
  ProtocolAnalysisErrorModal,
  useProtocolAnalysisErrorsModal,
} from './ProtocolAnalysisErrorModal'
import { Banner } from '../../../../atoms/Banner'
import { useCloseCurrentRun } from '../../../ProtocolUpload/hooks'
import {
  ConfirmCancelModal,
  useConfirmCancelModal,
} from '../../../RunDetails/ConfirmCancelModal'
import {
  useRunControls,
  useRunStatus,
  useRunTimestamps,
} from '../../../../organisms/RunTimeControl/hooks'
import {
  useIsFlex,
  useIsRobotViewable,
  useProtocolDetailsForRun,
  useRunCreatedAtTimestamp,
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
import { useNotifyRunQuery } from '../../../../resources/runs'
import {
  ErrorRecoveryFlows,
  useErrorRecoveryFlows,
} from '../../../ErrorRecoveryFlows'
import { ProtocolDropTipModal } from './ProtocolDropTipModal'
import { DisplayRunStatus } from './DisplayRunStatus'
import { LabeledValue } from './LabeledValueProps'
import { TerminalRunBanner } from './TerminalRunBanner'
import { ActionButton } from './ActionButton'
import { CANCELLABLE_STATUSES } from './constants'
import { useIsDoorOpen, useRunAnalytics, useRunHeaderDropTip } from './hooks'

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
  const createdAtTimestamp = useRunCreatedAtTimestamp(runId)
  const {
    protocolData,
    displayName,
    protocolKey,
    isProtocolAnalyzing,
  } = useProtocolDetailsForRun(runId)

  const isRobotViewable = useIsRobotViewable(robotName)
  const runStatus = useRunStatus(runId)

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
  const { isClosingCurrentRun } = useCloseCurrentRun()
  const { startedAt, stoppedAt, completedAt } = useRunTimestamps(runId)
  const { data: commandErrorList } = useRunCommandErrors(
    runId,
    { cursor: 0, pageLength: 100 },
    {
      enabled:
        // @ts-expect-error runStatus expected to possibly not be terminal
        RUN_STATUSES_TERMINAL.includes(runStatus) && isMostRecentRun,
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

  const isDoorOpen = useIsDoorOpen(robotName, isFlex)
  const { dropTipModalUtils, dropTipWizardUtils } = useRunHeaderDropTip({
    runId,
    runStatus,
    runRecord: runRecord ?? null,
    robotType,
  })

  const enteredER = runRecord?.data.hasEverEnteredErrorRecovery ?? false
  const cancelledWithoutRecovery =
    !enteredER && runStatus === RUN_STATUS_STOPPED

  React.useEffect(() => {
    if (protocolData != null && !isRobotViewable) {
      navigate('/devices')
    }
  }, [protocolData, isRobotViewable, navigate])

  const startedAtTimestamp =
    startedAt != null ? formatTimestamp(startedAt) : EMPTY_TIMESTAMP

  const completedAtTimestamp =
    completedAt != null ? formatTimestamp(completedAt) : EMPTY_TIMESTAMP

  const { play, pause } = useRunControls(runId)

  const {
    showModal: showConfirmCancelModal,
    toggleModal: toggleConfirmCancelModal,
  } = useConfirmCancelModal()

  const handleCancelRunClick = (): void => {
    if (runStatus === RUN_STATUS_RUNNING) {
      pause()
    }
    toggleConfirmCancelModal()
  }

  useRunAnalytics({ runId, robotName, enteredER })

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
        CANCELLABLE_STATUSES.includes(runStatus) ? (
          <Banner type="warning" iconMarginLeft={SPACING.spacing4}>
            {t('shared:close_robot_door')}
          </Banner>
        ) : null}
        {isMostRecentRun ? (
          <TerminalRunBanner
            {...{
              runStatus,
              runId,
              isClosingCurrentRun,
              toggleRunFailedModal,
              commandErrorList,
              highestPriorityError,
              cancelledWithoutRecovery,
            }}
            isResetRunLoading={isResetRunLoadingRef.current}
          />
        ) : null}
        {dropTipModalUtils.showModal ? (
          <ProtocolDropTipModal {...dropTipModalUtils.modalProps} />
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
                  onClick={handleCancelRunClick}
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
            onClose={toggleConfirmCancelModal}
            runId={runId}
            robotName={robotName}
          />
        ) : null}
        {dropTipWizardUtils.showDTWiz ? (
          <DropTipWizardFlows {...dropTipWizardUtils.dtWizProps} />
        ) : null}
      </Flex>
    </>
  )
}
