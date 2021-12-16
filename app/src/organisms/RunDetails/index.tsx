import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Redirect } from 'react-router-dom'
import {
  RUN_STATUS_RUNNING,
  RUN_STATUS_PAUSED,
  RUN_STATUS_PAUSE_REQUESTED,
} from '@opentrons/api-client'
import {
  LINE_HEIGHT_SOLID,
  SPACING_2,
  SPACING_3,
  C_ERROR_DARK,
  useConditionalConfirm,
  NewSecondaryBtn,
} from '@opentrons/components'
import { Page } from '../../atoms/Page'
import { Portal } from '../../App/portal'
import { useProtocolDetails } from './hooks'
import { useRunStatus } from '../RunTimeControl/hooks'
import { ConfirmCancelModal } from '../../pages/Run/RunLog'
import { ConfirmExitProtocolUploadModal } from '../ProtocolUpload/ConfirmExitProtocolUploadModal'
import {
  useCloseCurrentRun,
  useCurrentProtocolRun,
} from '../ProtocolUpload/hooks'
import { useCurrentRunControls } from '../../pages/Run/RunLog/hooks'
import { CommandList } from './CommandList'

import styles from '../ProtocolUpload/styles.css'

export function RunDetails(): JSX.Element | null {
  const { t } = useTranslation(['run_details', 'shared'])
  const { displayName } = useProtocolDetails()
  const runStatus = useRunStatus()
  const { closeCurrentRun } = useCloseCurrentRun()
  const { protocolRecord, runRecord } = useCurrentProtocolRun()

  const { pauseRun } = useCurrentRunControls()

  const cancelRunAndExit = (): void => {
    pauseRun()
    confirmExit()
  }

  const [
    showConfirmExitProtocolUploadModal,
    setShowConfirmExitProtocolUploadModal,
  ] = React.useState(false)

  const {
    showConfirmation: showConfirmCancelModal,
    confirm: confirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(cancelRunAndExit, true)

  if (protocolRecord == null && runRecord == null) {
    return <Redirect to="/upload" />
  }

  const cancelRunButton = (
    <NewSecondaryBtn
      onClick={cancelRunAndExit}
      lineHeight={LINE_HEIGHT_SOLID}
      marginX={SPACING_3}
      paddingRight={SPACING_2}
      paddingLeft={SPACING_2}
      color={C_ERROR_DARK}
    >
      {t('cancel_run')}
    </NewSecondaryBtn>
  )

  let titleBarProps

  if (
    runStatus === RUN_STATUS_RUNNING ||
    runStatus === RUN_STATUS_PAUSED ||
    runStatus === RUN_STATUS_PAUSE_REQUESTED
  ) {
    titleBarProps = {
      title: t('protocol_title', { protocol_name: displayName }),
      rightNode: cancelRunButton,
    }
  } else {
    titleBarProps = {
      title: t('protocol_title', { protocol_name: displayName }),
      back: {
        onClick: () => setShowConfirmExitProtocolUploadModal(true),
        title: t('shared:close'),
        children: t('shared:close'),
        iconName: 'close' as const,
      },
      className: styles.reverse_titlebar_items,
    }
  }

  return (
    <>
      {showConfirmExitProtocolUploadModal && (
        <Portal level="top">
          <ConfirmExitProtocolUploadModal
            exit={closeCurrentRun}
            back={() => setShowConfirmExitProtocolUploadModal(false)}
          />
        </Portal>
      )}
      <Page titleBarProps={titleBarProps}>
        {showConfirmCancelModal ? (
          <ConfirmCancelModal onClose={cancelExit} />
        ) : null}
        <CommandList />
      </Page>
    </>
  )
}
