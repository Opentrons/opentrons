import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

import {
  RUN_STATUS_IDLE,
  RUN_STATUS_RUNNING,
  RUN_STATUS_STOP_REQUESTED,
  RUN_STATUS_STOPPED,
} from '@opentrons/api-client'

import {
  ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
  ANALYTICS_PROTOCOL_RUN_ACTION,
  useTrackEvent,
} from '/app/redux/analytics'
import { useTrackProtocolRunEvent } from '/app/redux-resources/analytics'
import { getMissingSetupSteps } from '/app/redux/protocol-runs'
import { useIsHeaterShakerInProtocol } from '/app/organisms/ModuleCard/hooks'
import { isAnyHeaterShakerShaking } from '../../../RunHeaderModalContainer/modals'
import {
  isRecoveryStatus,
  isRunAgainStatus,
  isStartRunStatus,
} from '../../../utils'

import type { IconName } from '@opentrons/components'
import type { BaseActionButtonProps } from '..'
import type { State } from '/app/redux/types'
import type { StepKey } from '/app/redux/protocol-runs'

interface UseButtonPropertiesProps extends BaseActionButtonProps {
  isProtocolNotReady: boolean
  confirmMissingSteps: () => void
  confirmAttachment: () => void
  robotAnalyticsData: any
  robotSerialNumber: string
  currentRunId: string | null
  isValidRunAgain: boolean
  isOtherRunCurrent: boolean
  isRobotOnWrongVersionOfSoftware: boolean
  isClosingCurrentRun: boolean
}

// Returns ActionButton properties.
export function useActionButtonProperties({
  isProtocolNotReady,
  runStatus,
  robotName,
  runId,
  confirmAttachment,
  confirmMissingSteps,
  robotAnalyticsData,
  robotSerialNumber,
  protocolRunControls,
  attachedModules,
  runHeaderModalContainerUtils,
  isResetRunLoadingRef,
  isClosingCurrentRun,
}: UseButtonPropertiesProps): {
  buttonText: string
  handleButtonClick: () => void
  buttonIconName: IconName | null
} {
  const { t } = useTranslation(['run_details', 'shared'])
  const navigate = useNavigate()
  const { play, pause, reset } = protocolRunControls
  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId, robotName)
  const isHeaterShakerInProtocol = useIsHeaterShakerInProtocol()
  const isHeaterShakerShaking = isAnyHeaterShakerShaking(attachedModules)
  const trackEvent = useTrackEvent()
  const missingSetupSteps = useSelector<State, StepKey[]>((state: State) =>
    getMissingSetupSteps(state, runId)
  )

  let buttonText = ''
  let handleButtonClick = (): void => {}
  let buttonIconName: IconName | null = null

  if (isProtocolNotReady) {
    buttonIconName = 'ot-spinner'
    buttonText = t('analyzing_on_robot')
  } else if (isClosingCurrentRun) {
    buttonIconName = 'ot-spinner'
    buttonText = t('canceling_run')
  } else if (runStatus === RUN_STATUS_RUNNING || isRecoveryStatus(runStatus)) {
    buttonIconName = 'pause'
    buttonText = t('pause_run')
    handleButtonClick = () => {
      pause()
      trackProtocolRunEvent({ name: ANALYTICS_PROTOCOL_RUN_ACTION.PAUSE })
    }
  } else if (runStatus === RUN_STATUS_STOP_REQUESTED) {
    buttonIconName = 'ot-spinner'
    buttonText = t('canceling_run')
  } else if (isStartRunStatus(runStatus)) {
    buttonIconName = 'play'
    buttonText =
      runStatus === RUN_STATUS_IDLE ? t('start_run') : t('resume_run')
    handleButtonClick = () => {
      if (isHeaterShakerShaking && isHeaterShakerInProtocol) {
        runHeaderModalContainerUtils.HSRunningModalUtils.toggleModal?.()
      } else if (
        missingSetupSteps.length !== 0 &&
        (runStatus === RUN_STATUS_IDLE || runStatus === RUN_STATUS_STOPPED)
      ) {
        confirmMissingSteps()
      } else if (
        isHeaterShakerInProtocol &&
        !isHeaterShakerShaking &&
        (runStatus === RUN_STATUS_IDLE || runStatus === RUN_STATUS_STOPPED)
      ) {
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
  } else if (isRunAgainStatus(runStatus)) {
    buttonIconName = isResetRunLoadingRef.current ? 'ot-spinner' : 'play'
    buttonText = t('run_again')
    handleButtonClick = () => {
      isResetRunLoadingRef.current = true
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

  return { buttonText, handleButtonClick, buttonIconName }
}
