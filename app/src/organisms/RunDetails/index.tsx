import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Redirect } from 'react-router-dom'
import {
  RunStatus,
  RUN_STATUS_IDLE,
  RUN_STATUS_RUNNING,
  RUN_STATUS_PAUSED,
  RUN_STATUS_PAUSE_REQUESTED,
  RUN_STATUS_STOPPED,
  RUN_STATUS_FAILED,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'
import {
  NewAlertPrimaryBtn,
  LINE_HEIGHT_SOLID,
  SPACING_2,
  SPACING_3,
  useConditionalConfirm,
} from '@opentrons/components'
import { Page } from '../../atoms/Page'
import { useProtocolDetails } from './hooks'
import { useRunStatus, useRunStartTime } from '../RunTimeControl/hooks'
import { ConfirmCancelModal } from '../../pages/Run/RunLog'
import { ConfirmExitProtocolUploadModal } from '../ProtocolUpload/ConfirmExitProtocolUploadModal'
import { useCloseCurrentRun } from '../ProtocolUpload/hooks/useCloseCurrentRun'
import { useCurrentRunControls } from '../../pages/Run/RunLog/hooks'
import { closeProtocol } from '../../redux/protocol/actions'
import { CommandList } from './CommandList'

import type { Dispatch } from '../../redux/types'

import styles from '../ProtocolUpload/styles.css'

export function RunDetails(): JSX.Element | null {
  const { t } = useTranslation(['run_details', 'shared'])
  const { displayName, protocolData } = useProtocolDetails()
  const runStatus = useRunStatus()
  const startTime = useRunStartTime()
  const dispatch = useDispatch<Dispatch>()
  const closeProtocolRun = useCloseCurrentRun()

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
    dispatch(closeProtocol())
    closeProtocolRun()
  }

  const {
    showConfirmation: showCloseConfirmExit,
    confirm: confirmCloseExit,
    cancel: cancelCloseExit,
  } = useConditionalConfirm(handleCloseProtocol, true)

  if (protocolData === null) {
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
  } else if (
    adjustedRunStatus === RUN_STATUS_SUCCEEDED ||
    adjustedRunStatus === RUN_STATUS_STOPPED ||
    adjustedRunStatus === RUN_STATUS_FAILED
  ) {
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
  } else {
    titleBarProps = {
      title: t('protocol_title', { protocol_name: displayName }),
    }
  }

  return (
    <>
      {showCloseConfirmExit && (
        <ConfirmExitProtocolUploadModal
          exit={confirmCloseExit}
          back={cancelCloseExit}
        />
      )}
      <Page titleBarProps={titleBarProps}>
        {showConfirmExit ? <ConfirmCancelModal onClose={cancelExit} /> : null}
        <CommandList />
      </Page>
    </>
  )
}
