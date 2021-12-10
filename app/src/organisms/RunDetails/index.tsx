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
  NewAlertPrimaryBtn,
  LINE_HEIGHT_SOLID,
  SPACING_2,
  SPACING_3,
  useConditionalConfirm,
} from '@opentrons/components'
import { Page } from '../../atoms/Page'
import { Portal } from '../../App/portal'
import { useProtocolDetails } from './hooks'
import { useRunStatus, useRunStartTime } from '../RunTimeControl/hooks'
import { ConfirmCancelModal } from '../../pages/Run/RunLog'
import { ConfirmExitProtocolUploadModal } from '../ProtocolUpload/ConfirmExitProtocolUploadModal'
import { useCloseCurrentRun } from '../ProtocolUpload/hooks/useCloseCurrentRun'
import { useCurrentRunControls } from '../../pages/Run/RunLog/hooks'
import { CommandList } from './CommandList'

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

  const { pauseRun } = useCurrentRunControls()

  const cancelRunAndExit = (): void => {
    pauseRun()
    confirmExit()
  }

  const {
    showConfirmation: showConfirmExit,
    confirm: confirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(cancelRunAndExit, true)

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
    <NewAlertPrimaryBtn
      onClick={cancelRunAndExit}
      lineHeight={LINE_HEIGHT_SOLID}
      marginX={SPACING_3}
      paddingRight={SPACING_2}
      paddingLeft={SPACING_2}
    >
      {t('cancel_run')}
    </NewAlertPrimaryBtn>
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
        {showConfirmExit ? <ConfirmCancelModal onClose={cancelExit} /> : null}
        <CommandList />
      </Page>
    </>
  )
}
