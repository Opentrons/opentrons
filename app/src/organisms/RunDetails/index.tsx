import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Redirect } from 'react-router-dom'
import {
  RunStatus,
  RUN_STATUS_IDLE,
  RUN_STATUS_RUNNING,
  RUN_STATUS_PAUSED,
  RUN_STATUS_PAUSE_REQUESTED,
} from '@opentrons/api-client'
import {
  SPACING_2,
  SPACING_3,
  useConditionalConfirm,
  NewAlertSecondaryBtn,
} from '@opentrons/components'
import { Page } from '../../atoms/Page'
import { Portal } from '../../App/portal'
import { useProtocolDetails } from './hooks'
import { useRunStatus, useRunStartTime, useRunControls } from '../RunTimeControl/hooks'
import { ConfirmExitProtocolUploadModal } from '../ProtocolUpload/ConfirmExitProtocolUploadModal'
import { useCloseCurrentRun } from '../ProtocolUpload/hooks/useCloseCurrentRun'
import { CommandList } from './CommandList'
import { ConfirmCancelModal } from './ConfirmCancelModal'

import styles from '../ProtocolUpload/styles.css'

export function RunDetails(): JSX.Element | null {
  const { t } = useTranslation(['run_details', 'shared'])
  const { displayName } = useProtocolDetails()
  const runStatus = useRunStatus()
  const startTime = useRunStartTime()
  const { closeCurrentRun, isProtocolRunLoaded } = useCloseCurrentRun()

  // display an idle status as 'running' in the UI after a run has started
  const adjustedRunStatus: RunStatus | null =
    runStatus === RUN_STATUS_IDLE && startTime != null
      ? RUN_STATUS_RUNNING
      : runStatus

  const { pause } = useRunControls()
  const [showConfirmCancelModal, setShowConfirmCancelModal] = React.useState<boolean>(false)

  const handleCancelClick = (): void => {
    pause()
    setShowConfirmCancelModal(true)
  }
  const handleCloseProtocol: React.MouseEventHandler = _event => {
    closeCurrentRun()
  }

  const {
    showConfirmation: showCloseConfirmExit,
    confirm: confirmCloseExit,
    cancel: cancelCloseExit,
  } = useConditionalConfirm(handleCloseProtocol, true)

  if (!isProtocolRunLoaded) {
    return <Redirect to="/upload" />
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
    adjustedRunStatus === RUN_STATUS_PAUSE_REQUESTED
  ) {
    titleBarProps = {
      title: t('protocol_title', { protocol_name: displayName }),
      rightNode: cancelRunButton,
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
            exit={confirmCloseExit}
            back={cancelCloseExit}
          />
        </Portal>
      )}
      <Page titleBarProps={titleBarProps}>
        {showConfirmCancelModal ? <ConfirmCancelModal onClose={() => setShowConfirmCancelModal(false)} /> : null}
        <CommandList />
      </Page>
    </>
  )
}
