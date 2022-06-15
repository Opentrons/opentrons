import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import {
  RunStatus,
  RUN_STATUS_IDLE,
  RUN_STATUS_RUNNING,
  RUN_STATUS_PAUSED,
  RUN_STATUS_PAUSE_REQUESTED,
  RUN_STATUS_FINISHING,
  RUN_STATUS_STOP_REQUESTED,
  RUN_STATUS_STOPPED,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
} from '@opentrons/api-client'
import {
  SPACING_2,
  SPACING_3,
  useConditionalConfirm,
  NewAlertSecondaryBtn,
  SpinnerModal,
} from '@opentrons/components'
import { Page } from '../../atoms/Page'
import { Portal } from '../../App/portal'
import { useProtocolDetails } from './hooks'
import {
  useCurrentRunStatus,
  useRunStartTime,
  useCurrentRunControls,
} from '../RunTimeControl/hooks'
import { ConfirmExitProtocolUploadModal } from '../ProtocolUpload/ConfirmExitProtocolUploadModal'
import { useCloseCurrentRun } from '../ProtocolUpload/hooks/useCloseCurrentRun'
import { CommandList } from './CommandList'
import { ConfirmCancelModal } from './ConfirmCancelModal'

import styles from '../ProtocolUpload/styles.css'
import {
  useCurrentRunId,
  useIsProtocolRunLoaded,
} from '../ProtocolUpload/hooks'
import { useTrackEvent } from '../../redux/analytics'
import { getConnectedRobotName } from '../../redux/robot/selectors'
import type { State } from '../../redux/types'

export function RunDetails(): JSX.Element | null {
  const { t } = useTranslation(['run_details', 'shared'])
  const trackEvent = useTrackEvent()
  const robotName = useSelector<State>(getConnectedRobotName)
  const runId = useCurrentRunId()
  const { displayName } = useProtocolDetails()
  const history = useHistory()
  const runStatus = useCurrentRunStatus({
    onSettled: data => {
      if (data == null) {
        history.push('/upload')
      }
    },
  })
  const startTime = useRunStartTime()
  const isProtocolRunLoaded = useIsProtocolRunLoaded()
  const { closeCurrentRun, isClosingCurrentRun } = useCloseCurrentRun()

  // display an idle status as 'running' in the UI after a run has started
  const adjustedRunStatus: RunStatus | null =
    runStatus === RUN_STATUS_IDLE && startTime != null
      ? RUN_STATUS_RUNNING
      : runStatus

  const { pause } = useCurrentRunControls()
  const [
    showConfirmCancelModal,
    setShowConfirmCancelModal,
  ] = React.useState<boolean>(false)

  const handleCancelClick = (): void => {
    trackEvent({ name: 'runPause', properties: {} })
    pause()
    setShowConfirmCancelModal(true)
  }
  const handleCloseProtocol: React.MouseEventHandler = _event => {
    closeCurrentRun({ onSuccess: () => history.push('/upload') })
  }

  const {
    showConfirmation: showCloseConfirmExit,
    confirm: confirmCloseExit,
    cancel: cancelCloseExit,
  } = useConditionalConfirm(handleCloseProtocol, true)
  if (robotName == null) history.push('/robots')

  if (!isProtocolRunLoaded || isClosingCurrentRun) {
    let text = t('loading_protocol')
    if (
      isClosingCurrentRun ||
      adjustedRunStatus === RUN_STATUS_FINISHING ||
      adjustedRunStatus === RUN_STATUS_STOPPED
    ) {
      text = t('closing_protocol')
    }
    return (
      <Portal level="top">
        <SpinnerModal message={text} />
      </Portal>
    )
  }

  const cancelRunButton = (
    <NewAlertSecondaryBtn
      onClick={handleCancelClick}
      marginX={SPACING_3}
      paddingX={SPACING_2}
    >
      {t('cancel_run')}
    </NewAlertSecondaryBtn>
  )

  let titleBarProps

  if (
    adjustedRunStatus === RUN_STATUS_RUNNING ||
    adjustedRunStatus === RUN_STATUS_PAUSED ||
    adjustedRunStatus === RUN_STATUS_PAUSE_REQUESTED ||
    adjustedRunStatus === RUN_STATUS_FINISHING ||
    adjustedRunStatus === RUN_STATUS_BLOCKED_BY_OPEN_DOOR
  ) {
    titleBarProps = {
      title: t('protocol_title', { protocol_name: displayName }),
      rightNode: cancelRunButton,
    }
  } else if (adjustedRunStatus === RUN_STATUS_STOP_REQUESTED) {
    titleBarProps = {
      title: t('protocol_title', { protocol_name: displayName }),
    }
  } else {
    titleBarProps = {
      title: t('protocol_title', { protocol_name: displayName }),
      back: {
        onClick: confirmCloseExit,
        title: t('shared:close'),
        children: t('shared:close'),
        iconName: 'close' as const,
        className: styles.close_button,
      },
      className: styles.reverse_titlebar_items,
    }
  }

  return (
    <>
      {showCloseConfirmExit && (
        <Portal level="top">
          <ConfirmExitProtocolUploadModal
            back={cancelCloseExit}
            exit={confirmCloseExit}
          />
        </Portal>
      )}
      <Page titleBarProps={titleBarProps}>
        {showConfirmCancelModal ? (
          <ConfirmCancelModal
            onClose={() => setShowConfirmCancelModal(false)}
            runId={runId}
          />
        ) : null}
        <CommandList />
      </Page>
    </>
  )
}
