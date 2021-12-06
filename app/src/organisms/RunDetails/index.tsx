import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  RunStatus,
  RUN_STATUS_IDLE,
  RUN_STATUS_RUNNING,
  RUN_STATUS_PAUSED,
  RUN_STATUS_PAUSE_REQUESTED,
} from '@opentrons/api-client'
import {
  AppAlertPrimaryBtn,
  LINE_HEIGHT_SOLID,
  SPACING_2,
  SPACING_3,
  useConditionalConfirm,
} from '@opentrons/components'
import { Page } from '../../atoms/Page'
import { useProtocolDetails } from './hooks'
import { useRunStatus, useRunStartTime } from '../RunTimeControl/hooks'
import { ConfirmCancelModal } from '../../pages/Run/RunLog'
import { useCurrentRunControls } from '../../pages/Run/RunLog/hooks'
import { CommandList } from './CommandList'

export function RunDetails(): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const { displayName } = useProtocolDetails()
  const runStatus = useRunStatus()
  const startTime = useRunStartTime()

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

  const cancelRunButton = (
    <AppAlertPrimaryBtn
      onClick={cancelRunAndExit}
      lineHeight={LINE_HEIGHT_SOLID}
      marginX={SPACING_3}
      paddingRight={SPACING_2}
      paddingLeft={SPACING_2}
    >
      {t('cancel_run')}
    </AppAlertPrimaryBtn>
  )

  const titleBarProps =
    adjustedRunStatus === RUN_STATUS_RUNNING ||
    adjustedRunStatus === RUN_STATUS_PAUSED ||
    adjustedRunStatus === RUN_STATUS_PAUSE_REQUESTED
      ? {
          title: t('protocol_title', { protocol_name: displayName }),
          rightNode: cancelRunButton,
        }
      : {
          title: t('protocol_title', { protocol_name: displayName }),
        }

  return (
    <Page titleBarProps={titleBarProps}>
      {showConfirmExit ? <ConfirmCancelModal onClose={cancelExit} /> : null}
      <CommandList />
    </Page>
  )
}
