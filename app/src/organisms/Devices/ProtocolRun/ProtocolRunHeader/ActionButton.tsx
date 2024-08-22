import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import {
  RUN_STATUS_RUNNING,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_IDLE,
  RUN_STATUS_STOPPED,
  RUN_STATUS_STOP_REQUESTED,
} from '@opentrons/api-client'
import { useModulesQuery } from '@opentrons/react-api-client'
import {
  ALIGN_CENTER,
  DISPLAY_FLEX,
  Icon,
  JUSTIFY_CENTER,
  PrimaryButton,
  SIZE_1,
  SPACING,
  Tooltip,
  useConditionalConfirm,
  useHoverTooltip,
  StyledText,
} from '@opentrons/components'

import {
  ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
  ANALYTICS_PROTOCOL_RUN_ACTION,
  useTrackEvent,
} from '../../../../redux/analytics'
import {
  useModuleCalibrationStatus,
  useRobot,
  useRobotAnalyticsData,
  useRunCalibrationStatus,
  useTrackProtocolRunEvent,
  useUnmatchedModulesForProtocol,
} from '../../hooks'
import { useRunControls } from '../../../RunTimeControl/hooks'
import { useSelector } from 'react-redux'
import { getRobotUpdateDisplayInfo } from '../../../../redux/robot-update'
import { useCurrentRunId } from '../../../../resources/runs'
import { getRobotSerialNumber } from '../../../../redux/discovery'
import { getIsHeaterShakerAttached } from '../../../../redux/config'
import { useIsHeaterShakerInProtocol } from '../../../ModuleCard/hooks'
import { HeaterShakerIsRunningModal } from '../../HeaterShakerIsRunningModal'
import { ConfirmAttachmentModal } from '../../../ModuleCard/ConfirmAttachmentModal'
import { ConfirmMissingStepsModal } from '../ConfirmMissingStepsModal'

import type { RunStatus, Run } from '@opentrons/api-client'
import type { IconName } from '@opentrons/components'
import type { State } from '../../../../redux/types'
import type { HeaterShakerModule } from '../../../../redux/modules/types'

import {
  CANCELLABLE_STATUSES,
  DISABLED_STATUSES,
  START_RUN_STATUSES,
  RUN_AGAIN_STATUSES,
  RECOVERY_STATUSES,
  EQUIPMENT_POLL_MS,
} from './constants'

interface ActionButtonProps {
  runId: string
  robotName: string
  runStatus: RunStatus | null
  isProtocolAnalyzing: boolean
  isDoorOpen: boolean
  isFixtureMismatch: boolean
  isResetRunLoadingRef: React.MutableRefObject<boolean>
  missingSetupSteps: string[]
}

// TODO(jh, 04-22-2024): Refactor switch cases into separate factories to increase readability and testability.
export function ActionButton(props: ActionButtonProps): JSX.Element {
  const {
    runId,
    robotName,
    runStatus,
    isProtocolAnalyzing,
    isDoorOpen,
    isFixtureMismatch,
    isResetRunLoadingRef,
    missingSetupSteps,
  } = props
  const navigate = useNavigate()
  const { t } = useTranslation(['run_details', 'shared'])
  const attachedModules =
    useModulesQuery({
      refetchInterval: EQUIPMENT_POLL_MS,
      enabled: START_RUN_STATUSES.includes(runStatus),
    })?.data?.data ?? []
  const trackEvent = useTrackEvent()
  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId, robotName)
  const [targetProps, tooltipProps] = useHoverTooltip()
  const {
    play,
    pause,
    reset,
    isPlayRunActionLoading,
    isPauseRunActionLoading,
    isResetRunLoading,
  } = useRunControls(runId, (createRunResponse: Run): void =>
    // redirect to new run after successful reset
    {
      navigate(
        `/devices/${robotName}/protocol-runs/${createRunResponse.data.id}/run-preview`
      )
    }
  )
  isResetRunLoadingRef.current = isResetRunLoading
  const { missingModuleIds } = useUnmatchedModulesForProtocol(robotName, runId)
  const { complete: isCalibrationComplete } = useRunCalibrationStatus(
    robotName,
    runId
  )
  const { complete: isModuleCalibrationComplete } = useModuleCalibrationStatus(
    robotName,
    runId
  )
  const [showIsShakingModal, setShowIsShakingModal] = React.useState(false)
  const isSetupComplete =
    isCalibrationComplete &&
    isModuleCalibrationComplete &&
    missingModuleIds.length === 0
  const isRobotOnWrongVersionOfSoftware = ['upgrade', 'downgrade'].includes(
    useSelector((state: State) => {
      return getRobotUpdateDisplayInfo(state, robotName)
    })?.autoUpdateAction
  )
  const currentRunId = useCurrentRunId()
  const isCurrentRun = currentRunId === runId
  const isOtherRunCurrent = currentRunId != null && currentRunId !== runId
  const isRunControlButtonDisabled =
    (isCurrentRun && !isSetupComplete) ||
    isPlayRunActionLoading ||
    isPauseRunActionLoading ||
    isResetRunLoading ||
    isOtherRunCurrent ||
    isProtocolAnalyzing ||
    isFixtureMismatch ||
    DISABLED_STATUSES.includes(runStatus) ||
    isRobotOnWrongVersionOfSoftware ||
    // For before running a protocol, "close door to begin".
    (isDoorOpen &&
      runStatus !== RUN_STATUS_BLOCKED_BY_OPEN_DOOR &&
      CANCELLABLE_STATUSES.includes(runStatus))
  const robot = useRobot(robotName)
  const robotSerialNumber =
    robot?.status != null ? getRobotSerialNumber(robot) : null ?? ''
  const handleProceedToRunClick = (): void => {
    trackEvent({
      name: ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
      properties: { robotSerialNumber },
    })
    play()
  }
  const configBypassHeaterShakerAttachmentConfirmation = useSelector(
    getIsHeaterShakerAttached
  )
  const {
    confirm: confirmAttachment,
    showConfirmation: showHSConfirmationModal,
    cancel: cancelExitHSConfirmation,
  } = useConditionalConfirm(
    handleProceedToRunClick,
    !configBypassHeaterShakerAttachmentConfirmation
  )
  const {
    confirm: confirmMissingSteps,
    showConfirmation: showMissingStepsConfirmationModal,
    cancel: cancelExitMissingStepsConfirmation,
  } = useConditionalConfirm(
    handleProceedToRunClick,
    missingSetupSteps.length !== 0
  )
  const robotAnalyticsData = useRobotAnalyticsData(robotName)

  const isHeaterShakerInProtocol = useIsHeaterShakerInProtocol()
  const activeHeaterShaker = attachedModules.find(
    (module): module is HeaterShakerModule =>
      module.moduleType === 'heaterShakerModuleType' &&
      module?.data != null &&
      module.data.speedStatus !== 'idle'
  )
  const isHeaterShakerShaking = attachedModules
    .filter((module): module is HeaterShakerModule => {
      return module.moduleType === 'heaterShakerModuleType'
    })
    .some(module => module?.data != null && module.data.speedStatus !== 'idle')
  const isValidRunAgain = RUN_AGAIN_STATUSES.includes(runStatus)
  const validRunAgainButRequiresSetup = isValidRunAgain && !isSetupComplete
  const runAgainWithSpinner = validRunAgainButRequiresSetup && isResetRunLoading

  let buttonText: string = ''
  let handleButtonClick = (): void => {}
  let buttonIconName: IconName | null = null
  let disableReason = null

  if (
    currentRunId === runId &&
    (!isSetupComplete || isFixtureMismatch) &&
    !isValidRunAgain
  ) {
    disableReason = t('setup_incomplete')
  } else if (isOtherRunCurrent) {
    disableReason = t('shared:robot_is_busy')
  } else if (isRobotOnWrongVersionOfSoftware) {
    disableReason = t('shared:a_software_update_is_available')
  } else if (isDoorOpen && START_RUN_STATUSES.includes(runStatus)) {
    disableReason = t('close_door')
  }

  const shouldShowHSConfirm =
    isHeaterShakerInProtocol &&
    !isHeaterShakerShaking &&
    (runStatus === RUN_STATUS_IDLE || runStatus === RUN_STATUS_STOPPED)

  if (isProtocolAnalyzing) {
    buttonIconName = 'ot-spinner'
    buttonText = t('analyzing_on_robot')
  } else if (
    runStatus === RUN_STATUS_RUNNING ||
    RECOVERY_STATUSES.includes(runStatus)
  ) {
    buttonIconName = 'pause'
    buttonText = t('pause_run')
    handleButtonClick = (): void => {
      pause()
      trackProtocolRunEvent({ name: ANALYTICS_PROTOCOL_RUN_ACTION.PAUSE })
    }
  } else if (runStatus === RUN_STATUS_STOP_REQUESTED) {
    buttonIconName = 'ot-spinner'
    buttonText = t('canceling_run')
  } else if (START_RUN_STATUSES.includes(runStatus)) {
    buttonIconName = 'play'
    buttonText =
      runStatus === RUN_STATUS_IDLE ? t('start_run') : t('resume_run')
    handleButtonClick = () => {
      if (isHeaterShakerShaking && isHeaterShakerInProtocol) {
        setShowIsShakingModal(true)
      } else if (
        missingSetupSteps.length !== 0 &&
        (runStatus === RUN_STATUS_IDLE || runStatus === RUN_STATUS_STOPPED)
      ) {
        confirmMissingSteps()
      } else if (shouldShowHSConfirm) {
        confirmAttachment()
      } else {
        play()
        navigate(`/devices/${robotName}/protocol-runs/${runId}/run-preview`)
        trackProtocolRunEvent({
          name:
            runStatus === RUN_STATUS_IDLE
              ? ANALYTICS_PROTOCOL_RUN_ACTION.START
              : ANALYTICS_PROTOCOL_RUN_ACTION.RESUME,
          properties:
            runStatus === RUN_STATUS_IDLE && robotAnalyticsData != null
              ? robotAnalyticsData
              : {},
        })
      }
    }
  } else if (RUN_AGAIN_STATUSES.includes(runStatus)) {
    buttonIconName = runAgainWithSpinner ? 'ot-spinner' : 'play'
    buttonText = t('run_again')
    handleButtonClick = () => {
      reset()
      trackEvent({
        name: ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
        properties: { sourceLocation: 'RunRecordDetail', robotSerialNumber },
      })
      trackProtocolRunEvent({
        name: ANALYTICS_PROTOCOL_RUN_ACTION.AGAIN,
      })
    }
  }

  return (
    <>
      <PrimaryButton
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        boxShadow="none"
        display={DISPLAY_FLEX}
        padding={`${SPACING.spacing12} ${SPACING.spacing16}`}
        disabled={isRunControlButtonDisabled && !validRunAgainButRequiresSetup}
        onClick={handleButtonClick}
        id="ProtocolRunHeader_runControlButton"
        {...targetProps}
      >
        {buttonIconName != null ? (
          <Icon
            name={buttonIconName}
            size={SIZE_1}
            marginRight={SPACING.spacing8}
            spin={
              isProtocolAnalyzing ||
              runStatus === RUN_STATUS_STOP_REQUESTED ||
              runAgainWithSpinner
            }
          />
        ) : null}
        <StyledText as="pSemiBold">{buttonText}</StyledText>
      </PrimaryButton>
      {disableReason != null && (
        <Tooltip tooltipProps={tooltipProps} width="auto" maxWidth="8rem">
          {disableReason}
        </Tooltip>
      )}
      {showIsShakingModal &&
        activeHeaterShaker != null &&
        isHeaterShakerInProtocol &&
        runId != null && (
          <HeaterShakerIsRunningModal
            closeModal={() => {
              setShowIsShakingModal(false)
            }}
            module={activeHeaterShaker}
            startRun={play}
          />
        )}
      {showHSConfirmationModal && (
        <ConfirmAttachmentModal
          onCloseClick={cancelExitHSConfirmation}
          isProceedToRunModal={true}
          onConfirmClick={handleProceedToRunClick}
        />
      )}
      {showMissingStepsConfirmationModal && (
        <ConfirmMissingStepsModal
          onCloseClick={cancelExitMissingStepsConfirmation}
          onConfirmClick={() => {
            shouldShowHSConfirm
              ? confirmAttachment()
              : handleProceedToRunClick()
          }}
          missingSteps={missingSetupSteps}
        />
      )}
      {}
    </>
  )
}
