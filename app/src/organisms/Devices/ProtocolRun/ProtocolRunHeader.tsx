import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'

import {
  RUN_STATUS_IDLE,
  RUN_STATUS_RUNNING,
  RUN_STATUS_PAUSE_REQUESTED,
  RUN_STATUS_PAUSED,
  RUN_STATUS_STOP_REQUESTED,
  RUN_STATUS_STOPPED,
  RUN_STATUS_FAILED,
  RUN_STATUS_FINISHING,
  RUN_STATUS_SUCCEEDED,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
} from '@opentrons/api-client'
import {
  AlertItem,
  Box,
  Flex,
  Icon,
  IconName,
  Tooltip,
  useHoverTooltip,
  useInterval,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SIZE_1,
  TEXT_TRANSFORM_UPPERCASE,
  BORDERS,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useRunQuery } from '@opentrons/react-api-client'

import { PrimaryButton, SecondaryButton } from '../../../atoms/Buttons'
import { StyledText } from '../../../atoms/text'
import {
  useCloseCurrentRun,
  useCurrentRunId,
} from '../../../organisms/ProtocolUpload/hooks'
import { ConfirmCancelModal } from '../../../organisms/RunDetails/ConfirmCancelModal'
import {
  useRunControls,
  useRunStatus,
  useRunTimestamps,
} from '../../../organisms/RunTimeControl/hooks'
import { formatInterval } from '../../../organisms/RunTimeControl/utils'

import {
  useAttachedModuleMatchesForProtocol,
  useProtocolDetailsForRun,
  useRunCalibrationStatus,
} from '../hooks'
import { formatTimestamp } from '../utils'

import type { Run } from '@opentrons/api-client'

interface ProtocolRunHeaderProps {
  robotName: string
  runId: string
}

function RunTimer({
  runStatus,
  startedAt,
  stoppedAt,
  completedAt,
}: {
  runStatus: string | null
  startedAt: string | null
  stoppedAt: string | null
  completedAt: string | null
}): JSX.Element {
  const [now, setNow] = React.useState(Date())
  useInterval(() => setNow(Date()), 500, true)

  const endTime =
    runStatus === RUN_STATUS_STOP_REQUESTED && stoppedAt != null
      ? stoppedAt
      : completedAt ?? now

  const runTime =
    startedAt != null ? formatInterval(startedAt, endTime) : '--:--:--'

  return (
    <StyledText css={TYPOGRAPHY.pRegular} color={COLORS.darkBlack}>
      {runTime}
    </StyledText>
  )
}

export function ProtocolRunHeader({
  robotName,
  runId,
}: ProtocolRunHeaderProps): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const history = useHistory()
  const [targetProps, tooltipProps] = useHoverTooltip()

  const runRecord = useRunQuery(runId)
  const { displayName } = useProtocolDetailsForRun(runId)

  // this duplicates the run query above but has additional run status processing logic
  const runStatus = useRunStatus(runId)

  const { startedAt, stoppedAt, completedAt } = useRunTimestamps(runId)

  const createdAtTimestamp =
    runRecord?.data?.data.createdAt != null
      ? formatTimestamp(runRecord?.data?.data.createdAt)
      : '--:--:--'

  const startedAtTimestamp =
    startedAt != null ? formatTimestamp(startedAt) : '--:--:--'

  const completedAtTimestamp =
    completedAt != null ? formatTimestamp(completedAt) : '--:--:--'

  // redirect to new run after successful reset
  const onResetSuccess = (createRunResponse: Run): void =>
    history.push(
      `/devices/${robotName}/protocol-runs/${createRunResponse.data.id}/run-log`
    )

  const {
    play,
    pause,
    reset,
    isPlayRunActionLoading,
    isPauseRunActionLoading,
    isResetRunLoading,
  } = useRunControls(runId, onResetSuccess)

  const isMutationLoading =
    isPlayRunActionLoading || isPauseRunActionLoading || isResetRunLoading

  const { missingModuleIds } = useAttachedModuleMatchesForProtocol(
    robotName,
    runId
  )
  const { complete: isCalibrationComplete } = useRunCalibrationStatus(
    robotName,
    runId
  )
  const isSetupComplete = isCalibrationComplete && missingModuleIds.length === 0

  const currentRunId = useCurrentRunId()
  const isRobotBusy = currentRunId != null && currentRunId !== runId

  const isRunControlButtonDisabled =
    !isSetupComplete ||
    isMutationLoading ||
    isRobotBusy ||
    runStatus === RUN_STATUS_FINISHING ||
    runStatus === RUN_STATUS_PAUSE_REQUESTED ||
    runStatus === RUN_STATUS_STOP_REQUESTED ||
    runStatus === RUN_STATUS_BLOCKED_BY_OPEN_DOOR

  let handleButtonClick = (): void => {}
  let buttonIconName: IconName | null = null
  let buttonText: string = ''

  switch (runStatus) {
    case RUN_STATUS_IDLE:
    case RUN_STATUS_PAUSED:
    case RUN_STATUS_PAUSE_REQUESTED:
    case RUN_STATUS_BLOCKED_BY_OPEN_DOOR:
      buttonIconName = 'play'
      buttonText =
        runStatus === RUN_STATUS_IDLE ? t('start_run') : t('resume_run')
      handleButtonClick = play
      break
    case RUN_STATUS_RUNNING:
      buttonIconName = 'pause'
      buttonText = t('pause_run')
      handleButtonClick = pause
      break
    case RUN_STATUS_STOP_REQUESTED:
      buttonIconName = null
      buttonText = t('canceling_run')
      handleButtonClick = reset
      break
    case RUN_STATUS_STOPPED:
    case RUN_STATUS_FINISHING:
    case RUN_STATUS_FAILED:
    case RUN_STATUS_SUCCEEDED:
      buttonIconName = 'play'
      buttonText = t('run_again')
      handleButtonClick = reset
      break
  }

  let disableReason = null
  if (!isSetupComplete) {
    disableReason = t('setup_incomplete')
  } else if (isRobotBusy) {
    disableReason = t('robot_is_busy')
  }

  const buttonIcon =
    buttonIconName != null ? (
      <Icon
        name={buttonIconName}
        size={SIZE_1}
        marginRight={SPACING.spacing3}
      />
    ) : null

  const [
    showConfirmCancelModal,
    setShowConfirmCancelModal,
  ] = React.useState<boolean>(false)

  const handleCancelClick = (): void => {
    pause()
    setShowConfirmCancelModal(true)
  }

  const showCancelButton =
    runStatus === RUN_STATUS_RUNNING ||
    runStatus === RUN_STATUS_PAUSED ||
    runStatus === RUN_STATUS_PAUSE_REQUESTED ||
    runStatus === RUN_STATUS_BLOCKED_BY_OPEN_DOOR

  const { closeCurrentRun, isClosingCurrentRun } = useCloseCurrentRun()

  const handleCloseClick = (): void => {
    closeCurrentRun()
  }

  const showCloseButton =
    currentRunId === runId &&
    (runStatus === RUN_STATUS_STOPPED ||
      runStatus === RUN_STATUS_FAILED ||
      runStatus === RUN_STATUS_SUCCEEDED)

  const ProtocolRunningContent = (): JSX.Element | null =>
    runStatus != null && runStatus !== RUN_STATUS_IDLE ? (
      <Flex
        backgroundColor={COLORS.lightGrey}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        padding={SPACING.spacing3}
      >
        <Flex gridGap={SPACING.spacing6}>
          <Box>
            <StyledText
              textTransform={TEXT_TRANSFORM_UPPERCASE}
              color={COLORS.darkGreyEnabled}
              css={TYPOGRAPHY.h6Default}
              paddingBottom={SPACING.spacing2}
            >
              {t('protocol_start')}
            </StyledText>
            <StyledText
              css={TYPOGRAPHY.pRegular}
              color={COLORS.darkBlack}
              id="ProtocolRunHeader_protocolStart"
            >
              {startedAtTimestamp}
            </StyledText>
          </Box>
          <Box>
            <StyledText
              textTransform={TEXT_TRANSFORM_UPPERCASE}
              color={COLORS.darkGreyEnabled}
              css={TYPOGRAPHY.h6Default}
              paddingBottom={SPACING.spacing2}
            >
              {t('protocol_end')}
            </StyledText>
            <StyledText
              css={TYPOGRAPHY.pRegular}
              color={COLORS.darkBlack}
              id="ProtocolRunHeader_protocolEnd"
            >
              {completedAtTimestamp}
            </StyledText>
          </Box>
          {/* TODO(bh, 2022-03-07): determine how (and whether) to derive "elapsed time", as it does not exist in 5.0 functionality
        <Box>
          <StyledText
            textTransform={TEXT_TRANSFORM_UPPERCASE}
            color={COLORS.darkGreyEnabled}
            css={TYPOGRAPHY.h6Default}
            paddingBottom={SPACING.spacing2}
          >
            {t('total_elapsed_time')}
          </StyledText>
          <StyledText css={TYPOGRAPHY.pRegular} color={COLORS.darkBlack}>
            {runTime}
          </StyledText>
        </Box> */}
        </Flex>
        {showCancelButton ? (
          <SecondaryButton
            color={COLORS.error}
            padding={`${SPACING.spacingSM} ${SPACING.spacing4}`}
            onClick={handleCancelClick}
            id="ProtocolRunHeader_cancelRunButton"
          >
            {t('cancel_run')}
          </SecondaryButton>
        ) : null}
        {showCloseButton ? (
          <SecondaryButton
            padding={`${SPACING.spacingSM} ${SPACING.spacing4}`}
            onClick={handleCloseClick}
            disabled={isClosingCurrentRun}
            id="ProtocolRunHeader_closeRunButton"
          >
            {t('close_run')}
          </SecondaryButton>
        ) : null}
      </Flex>
    ) : null

  return (
    <Flex
      backgroundColor={COLORS.white}
      border={BORDERS.lineBorder}
      borderRadius={BORDERS.radiusSoftCorners}
      color={COLORS.black}
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing4}
      marginBottom={SPACING.spacing4}
      padding={SPACING.spacing4}
    >
      <Flex>
        {/* TODO(bh, 2022-03-15) will update link to a protocol key stored locally when built */}
        <Link to={`/protocols/${runRecord?.data?.data.protocolId}`}>
          <StyledText
            color={COLORS.blue}
            css={TYPOGRAPHY.h2SemiBold}
            id="ProtocolRunHeader_protocolName"
          >
            {displayName}
          </StyledText>
        </Link>
      </Flex>
      {runStatus === RUN_STATUS_BLOCKED_BY_OPEN_DOOR ? (
        <Box>
          <AlertItem type="warning" title={t('close_door_to_resume')} />
        </Box>
      ) : null}
      {runStatus === RUN_STATUS_FAILED ? (
        <Box>
          <AlertItem type="error" title={t('protocol_run_failed')} />
        </Box>
      ) : null}
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Box>
          <StyledText
            textTransform={TEXT_TRANSFORM_UPPERCASE}
            color={COLORS.darkGreyEnabled}
            css={TYPOGRAPHY.h6Default}
            paddingBottom={SPACING.spacing2}
          >
            {t('run_record_id')}
          </StyledText>
          {/* this is the createdAt timestamp, not the run id */}
          <StyledText
            css={TYPOGRAPHY.pRegular}
            color={COLORS.darkBlack}
            id="ProtocolRunHeader_runRecordId"
          >
            {createdAtTimestamp}
          </StyledText>
        </Box>
        <Flex gridGap={SPACING.spacing7}>
          <Box>
            <StyledText
              textTransform={TEXT_TRANSFORM_UPPERCASE}
              color={COLORS.darkGreyEnabled}
              css={TYPOGRAPHY.h6Default}
              paddingBottom={SPACING.spacing2}
            >
              {t('status')}
            </StyledText>
            <StyledText
              css={TYPOGRAPHY.pRegular}
              color={COLORS.darkBlack}
              id="ProtocolRunHeader_runStatus"
            >
              {runStatus != null ? t(`status_${runStatus}`) : ''}
            </StyledText>
          </Box>
          <Box>
            <StyledText
              textTransform={TEXT_TRANSFORM_UPPERCASE}
              color={COLORS.darkGreyEnabled}
              css={TYPOGRAPHY.h6Default}
              paddingBottom={SPACING.spacing2}
            >
              {t('run_time')}
            </StyledText>
            <RunTimer
              runStatus={runStatus}
              startedAt={startedAt}
              stoppedAt={stoppedAt}
              completedAt={completedAt}
            />
          </Box>
          <PrimaryButton
            justifyContent={JUSTIFY_CENTER}
            alignItems={ALIGN_CENTER}
            boxShadow="none"
            display={DISPLAY_FLEX}
            padding={`${SPACING.spacingSM} ${SPACING.spacing4}`}
            disabled={isRunControlButtonDisabled}
            onClick={handleButtonClick}
            id="ProtocolRunHeader_runControlButton"
            {...targetProps}
          >
            {buttonIcon}
            <StyledText css={TYPOGRAPHY.pSemiBold}>{buttonText}</StyledText>
          </PrimaryButton>
          {disableReason != null && (
            <Tooltip {...tooltipProps}>{disableReason}</Tooltip>
          )}
        </Flex>
      </Flex>
      <ProtocolRunningContent />
      {showConfirmCancelModal ? (
        <ConfirmCancelModal
          onClose={() => setShowConfirmCancelModal(false)}
          runId={runId}
        />
      ) : null}
    </Flex>
  )
}
