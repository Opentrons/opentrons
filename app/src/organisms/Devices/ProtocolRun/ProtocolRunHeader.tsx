import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'
import { format, parseISO } from 'date-fns'

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
import { useProtocolQuery, useRunQuery } from '@opentrons/react-api-client'

import { PrimaryButton, SecondaryButton } from '../../../atoms/Buttons'
import { StyledText } from '../../../atoms/text'
import { ConfirmCancelModal } from '../../../organisms/RunDetails/ConfirmCancelModal'
import {
  useRunControls,
  useRunStatus,
  useRunTimestamps,
} from '../../../organisms/RunTimeControl/hooks'
import { formatInterval } from '../../../organisms/RunTimeControl/utils'

import {
  useAttachedModuleMatchesForProtocol,
  useRunCalibrationStatus,
} from '../hooks'

import type { Run } from '@opentrons/api-client'

interface ProtocolRunHeaderProps {
  robotName: string
  runId: string
}

export function formatTimestamp(timestamp: string): string {
  // eslint-disable-next-line eqeqeq
  return (new Date(timestamp) as Date | string) != 'Invalid Date'
    ? format(parseISO(timestamp), 'MM/dd/yyyy HH:mm:ss')
    : timestamp
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

  const runRecord = useRunQuery(runId)
  const protocolRecord = useProtocolQuery(
    runRecord?.data?.data.protocolId ?? null
  )
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

  const isRunControlButtonDisabled =
    !isSetupComplete ||
    isMutationLoading ||
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
    runStatus === RUN_STATUS_FINISHING ||
    runStatus === RUN_STATUS_BLOCKED_BY_OPEN_DOOR

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
            <StyledText css={TYPOGRAPHY.pRegular} color={COLORS.darkBlack}>
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
            <StyledText css={TYPOGRAPHY.pRegular} color={COLORS.darkBlack}>
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
          >
            {t('cancel_run')}
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
        <Link to={`/protocols/${protocolRecord?.data?.data.id}`}>
          <StyledText color={COLORS.blue} css={TYPOGRAPHY.h2SemiBold}>
            {protocolRecord?.data?.data.metadata.protocolName}
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
          <StyledText css={TYPOGRAPHY.pRegular} color={COLORS.darkBlack}>
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
            <StyledText css={TYPOGRAPHY.pRegular} color={COLORS.darkBlack}>
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
          >
            {buttonIcon}
            <StyledText css={TYPOGRAPHY.pSemiBold}>{buttonText}</StyledText>
          </PrimaryButton>
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
